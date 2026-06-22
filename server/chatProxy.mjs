import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const DEFAULT_AI_ENDPOINT = "https://khzlai-production.up.railway.app/api/chat";
const MAX_BODY_SIZE = 32 * 1024;
const MAX_HISTORY_MESSAGES = 16;
const MAX_HISTORY_CONTENT_CHARS = 800;
const MAX_PROMPT_CHARS = 6000;

function loadDotEnv() {
  const envPath = resolve(process.cwd(), ".env");

  try {
    const content = readFileSync(envPath, "utf8");

    content.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;

      const separator = trimmed.indexOf("=");
      if (separator === -1) return;

      const key = trimmed.slice(0, separator).trim();
      const rawValue = trimmed.slice(separator + 1).trim();
      const value = rawValue.replace(/^["']|["']$/g, "");

      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    });
  } catch {
    // The caller returns a friendly configuration error if required env is missing.
  }
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  return new Promise((resolveBody, rejectBody) => {
    let body = "";
    let settled = false;

    req.on("data", (chunk) => {
      if (settled) return;

      body += chunk;

      if (Buffer.byteLength(body) > MAX_BODY_SIZE) {
        settled = true;
        rejectBody(new Error("REQUEST_TOO_LARGE"));
      }
    });

    req.on("end", () => {
      if (settled) return;
      settled = true;

      try {
        resolveBody(body ? JSON.parse(body) : {});
      } catch {
        rejectBody(new Error("INVALID_JSON"));
      }
    });

    req.on("error", (error) => {
      if (settled) return;
      settled = true;
      rejectBody(error);
    });
  });
}

async function parseUpstreamResponse(response) {
  const text = await response.text();

  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function sanitizePersona(persona) {
  if (!persona || typeof persona !== "object") return null;

  const safePersona = {};
  ["type", "gender", "label"].forEach((key) => {
    if (typeof persona[key] === "string") {
      safePersona[key] = persona[key].slice(0, 80);
    }
  });

  return Object.keys(safePersona).length > 0 ? safePersona : null;
}

function sanitizeConversationId(value) {
  const conversationId = String(value || "").trim();
  if (!conversationId) return "";

  return conversationId
    .replace(/[^a-zA-Z0-9:._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
}

function truncateEnd(text, maxChars) {
  const value = String(text || "").replace(/\s+/g, " ").trim();
  if (value.length <= maxChars) return value;

  return value.slice(0, maxChars).trim();
}

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];

  return history
    .map((entry) => {
      const role = entry?.role === "assistant" ? "assistant" : entry?.role === "user" ? "user" : "";
      const content = truncateEnd(entry?.content, MAX_HISTORY_CONTENT_CHARS);

      if (!role || !content) return null;

      return { role, content };
    })
    .filter(Boolean)
    .slice(-MAX_HISTORY_MESSAGES);
}

function sameMessage(left, right) {
  return String(left || "").replace(/\s+/g, " ").trim() === String(right || "").replace(/\s+/g, " ").trim();
}

function buildContextMessage({ message, history, systemPrompt }) {
  const trimmedPrompt = typeof systemPrompt === "string" ? systemPrompt.trim() : "";
  const safeHistory = sanitizeHistory(history);
  const priorUserMessages = safeHistory
    .filter((entry) => entry.role === "user")
    .map((entry) => entry.content);

  if (!trimmedPrompt) {
    return message;
  }

  if (sameMessage(priorUserMessages.at(-1), message)) {
    priorUserMessages.pop();
  }

  const parts = ["System instructions:", trimmedPrompt];

  if (priorUserMessages.length > 0) {
    parts.push(
      "",
      "Previous user messages:",
      ...priorUserMessages.map((content, index) => `${index + 1}. ${content}`)
    );
  }

  parts.push("", "Current user message:", message);

  return truncateEnd(parts.join("\n"), MAX_PROMPT_CHARS);
}

function buildUpstreamPayload({ conversationId, history, message, model, persona, systemPrompt }) {
  const safePersona = sanitizePersona(persona);
  const payload = {
    message: buildContextMessage({ message, history, systemPrompt }),
    reset: true
  };

  const safeConversationId = sanitizeConversationId(conversationId);
  if (safeConversationId) payload.conversation_id = safeConversationId;
  if (typeof model === "string" && model.trim()) payload.model = model.trim();
  if (safePersona) payload.persona = safePersona;

  return payload;
}

export async function handleChatProxy(req, res) {
  loadDotEnv();

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.AI_API_KEY;
  const endpoint = process.env.AI_ENDPOINT || DEFAULT_AI_ENDPOINT;

  if (!apiKey) {
    sendJson(res, 500, {
      error: "Konfigurasi AI Assistant belum siap. API key belum tersedia di server."
    });
    return;
  }

  let payload;

  try {
    payload = await readJsonBody(req);
  } catch (error) {
    const isTooLarge = error.message === "REQUEST_TOO_LARGE";
    sendJson(res, isTooLarge ? 413 : 400, {
      error: isTooLarge
        ? "Pesan terlalu panjang. Coba kirim pesan yang lebih singkat."
        : "Format pesan tidak valid."
    });
    return;
  }

  const message = typeof payload.message === "string" ? payload.message.trim() : "";
  const systemPrompt = typeof payload.systemPrompt === "string" ? payload.systemPrompt.trim() : "";

  if (!message) {
    sendJson(res, 400, { error: "Pesan tidak boleh kosong." });
    return;
  }

  try {
    const upstreamResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(
        buildUpstreamPayload({
          conversationId: payload.conversation_id || payload.conversationId,
          history: payload.history,
          message,
          model: payload.model,
          persona: payload.persona,
          systemPrompt
        })
      )
    });

    const data = await parseUpstreamResponse(upstreamResponse);

    if (!upstreamResponse.ok) {
      sendJson(res, upstreamResponse.status >= 500 ? 502 : upstreamResponse.status, {
        error: data.error || data.message || "AI Assistant sedang tidak bisa merespons."
      });
      return;
    }

    sendJson(res, 200, data);
  } catch {
    sendJson(res, 502, {
      error: "AI Assistant sedang tidak bisa terhubung. Coba lagi sebentar lagi."
    });
  }
}
