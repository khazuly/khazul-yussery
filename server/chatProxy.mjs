import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const AICHAT_ORIGIN = "https://aichat.org";
const AICHAT_CHAT_URL = `${AICHAT_ORIGIN}/chat`;
const AICHAT_API_URL = `${AICHAT_ORIGIN}/api/chat`;
const AICHAT_USAGE_URL = `${AICHAT_ORIGIN}/api/chat/usage`;
const DEFAULT_AICHAT_MODEL = "openai/gpt-4o-mini";
const USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const MAX_BODY_SIZE = 32 * 1024;
const MAX_HISTORY_MESSAGES = 16;
const MAX_HISTORY_CONTENT_CHARS = 800;
const MAX_PROMPT_CHARS = 6000;
const SESSION_TTL_MS = 90 * 60 * 1000;
const SESSION_REFRESH_STATUSES = new Set([302, 401, 403, 419]);
const LIMIT_ROTATION_ATTEMPTS = 3;

let cachedAichatSession = null;
let pendingSessionRefresh = null;

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
    // Local .env is optional in production.
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

function buildContextMessage({ message, systemPrompt }) {
  const trimmedPrompt = typeof systemPrompt === "string" ? systemPrompt.trim() : "";

  if (!trimmedPrompt) {
    return truncateEnd(message, MAX_HISTORY_CONTENT_CHARS);
  }

  return truncateEnd(
    ["System instructions:", trimmedPrompt, "", "Current user message:", message].join("\n"),
    MAX_PROMPT_CHARS
  );
}

function parseSetCookieHeaders(headers) {
  if (typeof headers.getSetCookie === "function") {
    return headers.getSetCookie();
  }

  const combined = headers.get("set-cookie");
  if (!combined) return [];

  return combined.split(/,(?=\s*[^;,\s]+=)/g);
}

function cookiePairsFromSetCookie(headers) {
  return headers
    .map((cookie) => cookie.split(";")[0]?.trim())
    .filter((cookie) => cookie && cookie.includes("="));
}

function mergeCookies(cookieHeader, setCookieHeaders) {
  const cookies = new Map();

  String(cookieHeader || "")
    .split(";")
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .forEach((cookie) => {
      const separator = cookie.indexOf("=");
      if (separator === -1) return;
      cookies.set(cookie.slice(0, separator), cookie.slice(separator + 1));
    });

  cookiePairsFromSetCookie(setCookieHeaders).forEach((cookie) => {
    const separator = cookie.indexOf("=");
    if (separator === -1) return;
    cookies.set(cookie.slice(0, separator), cookie.slice(separator + 1));
  });

  return [...cookies.entries()].map(([key, value]) => `${key}=${value}`).join("; ");
}

function updateSessionCookies(session, response) {
  const setCookieHeaders = parseSetCookieHeaders(response.headers);
  if (setCookieHeaders.length === 0) return session;

  session.cookie = mergeCookies(session.cookie, setCookieHeaders);
  return session;
}

function extractCsrf(html) {
  const match = String(html || "").match(/<meta\s+name=["']csrf-token["']\s+content=["']([^"']+)["']/i);
  return match?.[1] || "";
}

function buildBrowserHeaders(session, extraHeaders = {}) {
  return {
    "User-Agent": USER_AGENT,
    "X-Requested-With": "XMLHttpRequest",
    "X-CSRF-TOKEN": session.csrf,
    Origin: AICHAT_ORIGIN,
    Referer: AICHAT_CHAT_URL,
    Cookie: session.cookie,
    ...extraHeaders
  };
}

async function fetchWithTimeout(url, options, timeoutMs = 45000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function createAichatSession() {
  const response = await fetchWithTimeout(
    AICHAT_CHAT_URL,
    {
      method: "GET",
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "User-Agent": USER_AGENT
      }
    },
    20000
  );

  const html = await response.text();
  const csrf = extractCsrf(html);
  const cookie = cookiePairsFromSetCookie(parseSetCookieHeaders(response.headers)).join("; ");

  if (!response.ok || !csrf || !cookie) {
    throw new Error("AICHAT_SESSION_FAILED");
  }

  return {
    csrf,
    cookie,
    createdAt: Date.now()
  };
}

async function getAichatSession({ force = false } = {}) {
  const current = cachedAichatSession;
  const isFresh = current && Date.now() - current.createdAt < SESSION_TTL_MS;

  if (!force && isFresh) return current;
  if (pendingSessionRefresh) return pendingSessionRefresh;

  pendingSessionRefresh = createAichatSession()
    .then((session) => {
      cachedAichatSession = session;
      return session;
    })
    .finally(() => {
      pendingSessionRefresh = null;
    });

  return pendingSessionRefresh;
}

function buildAichatMessages({ history, message, systemPrompt }) {
  const messages = sanitizeHistory(history);

  const lastMessage = messages[messages.length - 1];
  if (!messages.some((entry) => entry.role === "user") || !sameMessage(lastMessage?.content, message)) {
    messages.push({
      role: "user",
      content: truncateEnd(message, MAX_HISTORY_CONTENT_CHARS)
    });
  }

  let lastUserIndex = -1;
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].role === "user") {
      lastUserIndex = index;
      break;
    }
  }
  if (lastUserIndex !== -1) {
    messages[lastUserIndex] = {
      ...messages[lastUserIndex],
      content: buildContextMessage({ message: messages[lastUserIndex].content, systemPrompt })
    };
  }

  let contentSize = 0;
  const trimmedConversation = [];

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const entry = messages[index];
    const nextSize = contentSize + entry.content.length;
    if (trimmedConversation.length > 0 && nextSize > MAX_PROMPT_CHARS) break;

    contentSize = nextSize;
    trimmedConversation.unshift(entry);
  }

  return trimmedConversation;
}

function buildAichatPayload({ history, message, model, systemPrompt }) {
  const selectedModel =
    typeof model === "string" && model.trim()
      ? model.trim()
      : process.env.AICHAT_MODEL || DEFAULT_AICHAT_MODEL;

  return {
    model: selectedModel,
    messages: buildAichatMessages({ history, message, systemPrompt })
  };
}

function parseJsonText(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function parseAichatStream(text) {
  let content = "";
  let usage = null;

  String(text || "")
    .split(/\r?\n/)
    .forEach((line) => {
      if (!line.startsWith("data: ")) return;

      const data = line.slice(6).trim();
      if (!data || data === "[DONE]") return;

      const chunk = parseJsonText(data);
      if (!chunk) return;

      const delta = chunk.choices?.[0]?.delta?.content;
      const messageContent = chunk.choices?.[0]?.message?.content;

      if (typeof delta === "string") content += delta;
      if (typeof messageContent === "string") content += messageContent;
      if (chunk.usage) usage = chunk.usage;
    });

  return {
    content: content.trim(),
    usage
  };
}

function isAichatLimitError(upstream) {
  return upstream?.status === 429 || /limit|token/i.test(upstream?.error || "");
}

async function reportAichatUsage(session, usage) {
  const promptTokens = Number(usage?.prompt_tokens || 0);
  const completionTokens = Number(usage?.completion_tokens || 0);

  if (!promptTokens && !completionTokens) return;

  try {
    const response = await fetchWithTimeout(
      AICHAT_USAGE_URL,
      {
        method: "POST",
        headers: buildBrowserHeaders(session, {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }),
        body: JSON.stringify({
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens
        })
      },
      15000
    );

    updateSessionCookies(session, response);
  } catch {
    // The answer can still be returned even if usage reporting is unavailable.
  }
}

async function sendAichatRequest(session, payload) {
  const response = await fetchWithTimeout(AICHAT_API_URL, {
    method: "POST",
    redirect: "manual",
    headers: buildBrowserHeaders(session, {
      Accept: "text/event-stream, application/json, text/plain, */*",
      "Content-Type": "application/json"
    }),
    body: JSON.stringify(payload)
  });

  updateSessionCookies(session, response);

  const text = await response.text();

  if (!response.ok) {
    const data = parseJsonText(text) || {};
    return {
      ok: false,
      status: response.status,
      error: data.error || data.message || text || response.statusText
    };
  }

  return {
    ok: true,
    status: response.status,
    ...parseAichatStream(text)
  };
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

  const aichatPayload = buildAichatPayload({
    history: payload.history,
    message,
    model: payload.model,
    systemPrompt
  });

  try {
    let session = await getAichatSession();
    let upstream = await sendAichatRequest(session, aichatPayload);

    if (!upstream.ok && SESSION_REFRESH_STATUSES.has(upstream.status)) {
      session = await getAichatSession({ force: true });
      upstream = await sendAichatRequest(session, aichatPayload);
    }

    for (
      let rotation = 0;
      !upstream.ok && isAichatLimitError(upstream) && rotation < LIMIT_ROTATION_ATTEMPTS;
      rotation += 1
    ) {
      session = await getAichatSession({ force: true });
      upstream = await sendAichatRequest(session, aichatPayload);

      if (!upstream.ok && SESSION_REFRESH_STATUSES.has(upstream.status)) {
        session = await getAichatSession({ force: true });
        upstream = await sendAichatRequest(session, aichatPayload);
      }
    }

    if (!upstream.ok) {
      const isLimit = isAichatLimitError(upstream);

      sendJson(res, isLimit ? 429 : upstream.status >= 500 ? 502 : upstream.status, {
        error: isLimit
          ? "Limit token AI Assistant untuk sesi ini sudah habis. Coba lagi nanti."
          : upstream.error || "AI Assistant sedang tidak bisa merespons."
      });
      return;
    }

    if (!upstream.content) {
      sendJson(res, 502, {
        error: "AI Assistant belum mengirim jawaban yang bisa ditampilkan."
      });
      return;
    }

    await reportAichatUsage(session, upstream.usage);

    sendJson(res, 200, {
      reply: upstream.content,
      provider: "aichat.org",
      model: aichatPayload.model,
      usage: upstream.usage || null
    });
  } catch {
    sendJson(res, 502, {
      error: "AI Assistant sedang tidak bisa terhubung. Coba lagi sebentar lagi."
    });
  }
}
