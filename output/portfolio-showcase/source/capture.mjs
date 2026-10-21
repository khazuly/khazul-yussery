import { openChrome } from "./chrome.mjs";
import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const out = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../assets",
);
await mkdir(out, { recursive: true });
process.env.CHROME_BIN ||= "/usr/bin/chromium";
process.env.CHROME_DIAGNOSTIC_FILE = path.join(out, "chrome-startup.log");
const chrome = await openChrome(1440, 1000);
const save = async (name, clip) => {
  const result = await chrome.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
    ...(clip ? { clip: { ...clip, scale: 1 } } : {}),
  });
  await writeFile(path.join(out, name), Buffer.from(result.data, "base64"));
  console.log("Captured", name);
};
async function settle() {
  await chrome.wait('document.readyState === "complete"');
  await chrome.evaluate("document.fonts.ready");
  await chrome.evaluate(
    `Promise.all([...document.images].filter(i=>i.loading !== 'lazy').map(i=>i.decode().catch(()=>{})))`,
  );
  await chrome.evaluate(
    `(()=>{const s=document.createElement('style');s.textContent='html{scroll-behavior:auto!important;scrollbar-width:none}::-webkit-scrollbar{display:none}.reveal{opacity:1!important;transform:none!important;filter:none!important}.chat-fab{visibility:hidden}*{animation:none!important;transition:none!important}';document.head.append(s)})()`,
  );
  await new Promise((r) => setTimeout(r, 800));
}
try {
  await chrome.metrics(1440, 1000, false);
  await chrome.send("Emulation.setEmulatedMedia", {
    features: [
      { name: "prefers-reduced-motion", value: "reduce" },
      { name: "prefers-color-scheme", value: "light" },
    ],
  });
  await chrome.send("Page.addScriptToEvaluateOnNewDocument", {
    source: 'try{localStorage.setItem("theme","light")}catch{}',
  });
  await chrome.send("Page.navigate", {
    url: process.env.PORTFOLIO_URL || "http://localhost:5173/",
  });
  await chrome.wait(
    'document.querySelector("h1") && document.querySelector(".portrait-frame img")?.complete',
  );
  await settle();
  const rects = await chrome.evaluate(
    `(()=>{const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y+scrollY,width:r.width,height:r.height}};return{pageHeight:document.documentElement.scrollHeight,project:rect(document.getElementById('project')),cards:[...document.querySelectorAll('.project-card')].map(rect),contact:rect(document.getElementById('contact'))}})()`,
  );
  await save("portfolio-hero.png");
  await save("portfolio-full.png", {
    x: 0,
    y: 0,
    width: 1440,
    height: rects.pageHeight,
  });
  await save("project-ayo-card.png", rects.cards[0]);
  await save("project-haruchan-card.png", rects.cards[1]);
  await writeFile(
    path.join(out, "capture-layout.json"),
    JSON.stringify(rects, null, 2),
  );
  await chrome.metrics(390, 844, true);
  await chrome.evaluate("scrollTo(0,0)");
  await settle();
  await save("portfolio-mobile.png");
  await chrome.metrics(1440, 1000, false);
  await chrome.send("Page.navigate", {
    url: "https://ayobelajarapp.vercel.app/",
  });
  await chrome.wait(
    'document.querySelector("h1") && document.title.includes("Ayo")',
  );
  await settle();
  await save("ayo-website.png");
  console.log("All captures complete");
} finally {
  await chrome.close();
}
