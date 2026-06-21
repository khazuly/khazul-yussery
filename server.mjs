import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { handleChatProxy } from "./server/chatProxy.mjs";

const port = Number(process.env.PORT || 4173);
const distDir = resolve(process.cwd(), "dist");

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

function sendText(res, statusCode, text) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.end(text);
}

function getStaticPath(pathname) {
  const normalized = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const requestedPath = normalized === "/" ? "/index.html" : normalized;
  const filePath = join(distDir, requestedPath);

  if (!filePath.startsWith(distDir)) return null;

  return filePath;
}

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const filePath = getStaticPath(url.pathname);

  if (!filePath) {
    sendText(res, 403, "Forbidden");
    return;
  }

  const fallbackPath = join(distDir, "index.html");
  const pathToRead = existsSync(filePath) ? filePath : fallbackPath;

  try {
    const file = await readFile(pathToRead);
    const extension = extname(pathToRead);

    res.statusCode = 200;
    res.setHeader("Content-Type", contentTypes[extension] || "application/octet-stream");
    res.end(file);
  } catch {
    sendText(res, 404, "Build output not found. Run npm run build first.");
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (url.pathname === "/api/chat") {
    await handleChatProxy(req, res);
    return;
  }

  await serveStatic(req, res);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Portfolio server running at http://localhost:${port}`);
});
