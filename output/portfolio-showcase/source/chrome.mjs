import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { join } from "node:path";
import assert from "node:assert/strict";
export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function launchChrome(width = 390, height = 844) {
  const profile = await mkdtemp(join(tmpdir(), "khazul-capture-"));
  const process = spawn(
    globalThis.process.env.CHROME_BIN ?? "google-chrome",
    [
      "--headless",
      "--no-sandbox",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-component-update",
      "--disable-sync",
      "--disable-background-networking",
      "--no-zygote",
      "--disable-gpu",
      "--disable-software-rasterizer",
      "--disable-gpu-sandbox",
      "--disable-breakpad",
      "--disable-crash-reporter",
      "--ignore-gpu-blocklist",
      "--disable-dev-shm-usage",
      "--autoplay-policy=no-user-gesture-required",
      "--remote-debugging-port=0",
      `--user-data-dir=${profile}`,
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "pipe"] },
  );
  let diagnostic = "";
  process.stderr.on("data", (chunk) => {
    diagnostic = (diagnostic + chunk).slice(-12000);
  });
  let socket;
  try {
    let port;
    for (let n = 0; n < 600; n++) {
      try {
        port = (
          await readFile(join(profile, "DevToolsActivePort"), "utf8")
        ).split("\n")[0];
        if (/^[0-9]+$/.test(port || "")) break;
      } catch {}
      if (process.exitCode !== null) break;
      await delay(100);
    }
    if (!port) {
      diagnostic =
        `Exit code: ${process.exitCode}; signal: ${process.signalCode}\n` +
        diagnostic;
      await writeFile(
        globalThis.process.env.CHROME_DIAGNOSTIC_FILE ||
          "output/chrome-startup.log",
        diagnostic,
      );
      throw Error("Chrome did not start: " + diagnostic);
    }
    const targets = await (
      await fetch(`http://127.0.0.1:${port}/json/list`)
    ).json();
    socket = new WebSocket(
      targets.find((t) => t.type === "page").webSocketDebuggerUrl,
    );
    await new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve, { once: true });
      socket.addEventListener("error", reject, { once: true });
    });
    let next = 0;
    const pending = new Map(),
      events = [];
    socket.addEventListener("message", ({ data }) => {
      const m = JSON.parse(data);
      if (m.id) {
        const cb = pending.get(m.id);
        pending.delete(m.id);
        if (m.error) cb?.reject(Error(JSON.stringify(m.error)));
        else cb?.resolve(m.result);
      } else events.push(m);
    });
    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const id = ++next;
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(new Error("CDP timeout: " + method));
        }, 12000);
        pending.set(id, {
          resolve: (value) => {
            clearTimeout(timer);
            resolve(value);
          },
          reject: (error) => {
            clearTimeout(timer);
            reject(error);
          },
        });
        socket.send(JSON.stringify({ id, method, params }));
      });
    async function evaluate(expression) {
      const r = await send("Runtime.evaluate", {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      assert.ok(!r.exceptionDetails, JSON.stringify(r.exceptionDetails));
      return r.result.value;
    }
    async function wait(expression) {
      for (let i = 0; i < 160; i++) {
        if (await evaluate(expression)) return;
        await delay(100);
      }
      throw Error("State timed out: " + expression);
    }
    async function metrics(w, h, mobile = true) {
      await send("Emulation.setDeviceMetricsOverride", {
        width: w,
        height: h,
        deviceScaleFactor: 1,
        mobile,
      });
      await delay(120);
    }
    async function click(selector, text = "") {
      const point = await evaluate(
        `(()=>{const e=[...document.querySelectorAll(${JSON.stringify(selector)})].find(e=>!e.disabled&&(e.getAttribute('aria-label')===${JSON.stringify(text)}||e.textContent.replace(/\\s+/g,' ').trim()===${JSON.stringify(text)}||e.textContent.includes(${JSON.stringify(text)})));if(!e)throw Error('Control missing: '+${JSON.stringify(selector + " " + text)});e.scrollIntoView({block:'center',behavior:'instant'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`,
      );
      await send("Input.dispatchMouseEvent", { type: "mouseMoved", ...point });
      await send("Input.dispatchMouseEvent", {
        type: "mousePressed",
        button: "left",
        clickCount: 1,
        ...point,
      });
      await send("Input.dispatchMouseEvent", {
        type: "mouseReleased",
        button: "left",
        clickCount: 1,
        ...point,
      });
      await delay(180);
    }
    console.log("Chrome CDP socket ready");
    await send("Page.enable");
    console.log("Page enabled");
    await send("Runtime.enable");
    await send("Network.enable");
    await metrics(width, height);
    return {
      send,
      evaluate,
      wait,
      metrics,
      click,
      events,
      async close() {
        socket.close();
        process.kill("SIGTERM");
        await delay(100);
        await rm(profile, {
          recursive: true,
          force: true,
          maxRetries: 10,
          retryDelay: 100,
        });
      },
    };
  } catch (error) {
    socket?.close();
    process.kill("SIGTERM");
    await rm(profile, {
      recursive: true,
      force: true,
      maxRetries: 10,
      retryDelay: 100,
    });
    throw error;
  }
}

export async function openChrome(width = 390, height = 844) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await launchChrome(width, height);
    } catch (error) {
      if (attempt || !String(error.message).includes("Chrome did not start"))
        throw error;
      await delay(500);
    }
  }
}
