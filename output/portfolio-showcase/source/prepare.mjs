import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage } from "@napi-rs/canvas";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assets = path.join(root, "assets");
for (const [file, width, height] of [
  ["portfolio-hero.png", 1440, 1000],
  ["ayo-website.png", 1440, 1000],
  ["portfolio-mobile.png", 390, 844],
]) {
  const image = await loadImage(path.join(assets, file));
  const c = createCanvas(width, height);
  c.getContext("2d").drawImage(image, 0, 0, width, height, 0, 0, width, height);
  await fs.writeFile(
    path.join(assets, file.replace(".png", "-viewport.png")),
    c.toBuffer("image/png"),
  );
}
const css = await fs.readFile(
  path.join(assets, "Manrope-google-fonts.css"),
  "utf8",
);
for (const weight of [500, 600, 700, 800]) {
  const section = css.match(
    new RegExp("font-weight: " + weight + ";[\\s\\S]*?url\\(([^)]+)\\)"),
  );
  const name = path.join(assets, `Manrope-${weight}.ttf`);
  try {
    await fs.access(name);
  } catch {
    const r = await fetch(section[1], { signal: AbortSignal.timeout(15000) });
    if (!r.ok) throw Error("Font download failed");
    await fs.writeFile(name, Buffer.from(await r.arrayBuffer()));
  }
}
const provenance = {
  createdAt: new Date().toISOString(),
  generativeMedia: false,
  watermark: {
    text: "@khazulys",
    placement: "Top-right, within safe area",
    coverage: "All 900 frames",
    opacity: 0.72,
  },
  portfolio: {
    source:
      "Local React app /public/khazul-yussery, captured through headless Chromium CDP",
    capture: "capture.mjs",
    modifications:
      "Light mode, reduced motion, hidden floating assistant and scrollbar for clean capture; no UI replacement",
  },
  application: {
    source: "https://ayobelajarapp.vercel.app/",
    screens: [
      "app-beranda.webp",
      "app-angka.webp",
      "app-membaca.webp",
      "app-menulis.webp",
    ],
    origin: "/assets/screens/{beranda,angka,membaca,menulis}.webp",
    modifications: "Scaled and composited in device frames",
  },
  music: {
    title: "Night Owl",
    artist: "Broke For Free",
    releaseDate: "2011-01-18",
    source:
      "https://commons.wikimedia.org/wiki/File:Broke_For_Free_-_01_-_Night_Owl.ogg",
    download:
      "https://upload.wikimedia.org/wikipedia/commons/6/68/Broke_For_Free_-_01_-_Night_Owl.ogg",
    license: "CC BY 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by/3.0/",
    modifications:
      "30-second excerpt from 00:30, faded and normalized; synchronized with video",
  },
  typography: {
    family: "Manrope",
    source: "https://fonts.google.com/specimen/Manrope",
    license: "SIL Open Font License 1.1; included in Manrope-OFL.txt",
  },
};
await fs.writeFile(
  path.join(root, "asset-sources.json"),
  JSON.stringify(provenance, null, 2) + "\n",
);
await fs.writeFile(
  path.join(root, "CREDITS.txt"),
  `Music: "Night Owl" — Broke For Free\nSource: ${provenance.music.source}\nLicensed under CC BY 3.0: https://creativecommons.org/licenses/by/3.0/\nChanges: 30-second excerpt from 00:30, fades, loudness normalization, synchronization with visuals.\n\nWebsites, photograph, and application screenshots: Khazul Yussery.\nTypography: Manrope, SIL Open Font License 1.1 (included).\nDevice frames, lighting, compositing, and motion: drawn and animated in code.\nNo generative AI images, video, music, or voice-over used.\n`,
);
console.log("Viewport crops, fonts and source credits prepared");
