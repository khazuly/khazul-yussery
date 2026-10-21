import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, execFileSync } from "node:child_process";
import { once } from "node:events";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assets = path.join(root, "assets");
const W = 1080,
  H = 1920,
  FPS = 30,
  FRAMES = 900;
for (const [file, family] of [
  ["Manrope.ttf", "Manrope"],
  ["Manrope-500.ttf", "Manrope"],
  ["Manrope-600.ttf", "Manrope"],
  ["Manrope-700.ttf", "Manrope"],
  ["Manrope-800.ttf", "Manrope"],
])
  GlobalFonts.registerFromPath(path.join(assets, file), family);
const images = {};
for (const [name, file] of Object.entries({
  hero: "portfolio-hero-viewport.png",
  full: "portfolio-full.png",
  website: "ayo-website-viewport.png",
  haruchan: "project-haruchan-card.png",
  home: "app-beranda.webp",
  numbers: "app-angka.webp",
  reading: "app-membaca.webp",
  writing: "app-menulis.webp",
  mobile: "portfolio-mobile-viewport.png",
}))
  images[name] = await loadImage(path.join(assets, file));
const layout = JSON.parse(
  await fs.readFile(path.join(assets, "capture-layout.json"), "utf8"),
);
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = (v) => {
  v = clamp(v);
  return v * v * (3 - 2 * v);
};
const out = (v) => 1 - Math.pow(1 - clamp(v), 3);
const lerp = (a, b, p) => a + (b - a) * p;
let g;
const textBoxes = [];
function rr(x, y, w, h, r, fill, stroke) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  if (fill) {
    g.fillStyle = fill;
    g.fill();
  }
  if (stroke) {
    g.strokeStyle = stroke;
    g.lineWidth = 1;
    g.stroke();
  }
}
function text(
  s,
  x,
  y,
  size = 30,
  color = "#183d32",
  weight = 500,
  align = "left",
  track = 0,
) {
  g.font = `${weight} ${size}px Manrope`;
  g.fillStyle = color;
  g.textAlign = align;
  g.textBaseline = "alphabetic";
  const width = g.measureText(s).width + Math.max(0, s.length - 1) * track;
  if (track) {
    let left =
      x - (align === "right" ? width : align === "center" ? width / 2 : 0);
    g.textAlign = "left";
    for (const ch of s) {
      g.fillText(ch, left, y);
      left += g.measureText(ch).width + track;
    }
  } else g.fillText(s, x, y);
  if (size >= 24 && y < 1621) {
    textBoxes.push({
      text: s,
      x: x - (align === "right" ? width : align === "center" ? width / 2 : 0),
      top: y - size,
      width,
      height: size + 8,
    });
  }
}
function line(x, y, x2, y2, color = "#cddbd1", width = 1) {
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x2, y2);
  g.strokeStyle = color;
  g.lineWidth = width;
  g.stroke();
}
function dot(x, y, r, color) {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fillStyle = color;
  g.fill();
}
function pill(label, x, y, w, filled = false) {
  rr(
    x,
    y,
    w,
    54,
    27,
    filled ? "#183d32" : "#ffffffc9",
    filled ? null : "#cbd9d0",
  );
  text(
    label,
    x + w / 2,
    y + 35,
    21,
    filled ? "#f3f8f4" : "#365d4e",
    600,
    "center",
  );
}
function background(t, warm = false, dark = false) {
  const gradient = g.createLinearGradient(0, 0, W, H);
  gradient.addColorStop(0, dark ? "#142c25" : warm ? "#f8f5ec" : "#f6f8f4");
  gradient.addColorStop(1, dark ? "#214b3b" : warm ? "#e6eee0" : "#e3ede5");
  g.fillStyle = gradient;
  g.fillRect(0, 0, W, H);
  const glow = g.createRadialGradient(
    680 + Math.sin(t * 0.1) * 45,
    980,
    40,
    650,
    1000,
    700,
  );
  glow.addColorStop(0, dark ? "#6a9d5e18" : "#ffffffb3");
  glow.addColorStop(1, "#ffffff00");
  g.fillStyle = glow;
  g.fillRect(0, 0, W, H);
  g.save();
  g.globalAlpha = dark ? 0.08 : 0.1;
  for (let x = 90; x <= 990; x += 100)
    line(x, 650, x, 1430, dark ? "#9cbca9" : "#83a28b");
  for (let y = 650; y <= 1430; y += 100)
    line(90, y, 990, y, dark ? "#9cbca9" : "#83a28b");
  g.restore();
}
function header(dark = false) {
  const ink = dark ? "#e7f3e9" : "#183d32";
  text("ky.", 90, 219, 38, ink, 800);
  text(
    "PORTFOLIO / SELECTED WORK",
    174,
    211,
    14,
    dark ? "#b4c9bc" : "#567162",
    600,
    "left",
    1.5,
  );
  line(90, 241, 990, 241, dark ? "#476352" : "#cad8cd");
}
function kicker(label, number, dark = false) {
  const c = dark ? "#a7d4b7" : "#39785c";
  text(number, 90, 292, 17, c, 700, "left", 1.5);
  text(label, 145, 292, 17, c, 700, "left", 2);
}
function headline(a, b, t, { size = 88, dark = false } = {}) {
  const p = out(t / 0.75);
  g.save();
  g.translate(0, 20 * (1 - p));
  const ink = dark ? "#eff7ee" : "#183d32";
  text(a, 90, 397, size, ink, 600);
  text(b, 90, 497, size, ink, 600);
  g.restore();
}
function subtitle(s, dark = false) {
  text(s, 94, 555, 26, dark ? "#bad3c0" : "#56715f", 500);
}
function shadow(cx, cy, w, alpha = 0.2) {
  g.save();
  g.translate(cx, cy);
  g.scale(w / 2, 30);
  const grad = g.createRadialGradient(0, 0, 0, 0, 0, 1);
  grad.addColorStop(0, `rgba(22,54,38,${alpha})`);
  grad.addColorStop(1, "rgba(22,54,38,0)");
  g.fillStyle = grad;
  g.fillRect(-1, -1, 2, 2);
  g.restore();
}

// Screen textures are actual captures. Only hardware and studio lighting are drawn.
const view = createCanvas(1440, 1000),
  vg = view.getContext("2d");
function viewport(scroll = 0) {
  vg.fillStyle = "#fafbf9";
  vg.fillRect(0, 0, 1440, 1000);
  vg.drawImage(images.full, 0, scroll, 1440, 1000, 0, 0, 1440, 1000);
  if (scroll > 0) vg.drawImage(images.full, 0, 0, 1440, 84, 0, 0, 1440, 84);
  return view;
}
function haruchanViewport(zoom = 1, pan = 0) {
  vg.fillStyle = "#fafbf9";
  vg.fillRect(0, 0, 1440, 1000);
  vg.drawImage(images.hero, 0, 0, 1440, 84, 0, 0, 1440, 84);
  const iw = images.haruchan.width,
    ih = images.haruchan.height;
  const width = 1240 * zoom;
  const height = (width * ih) / iw;
  vg.save();
  vg.beginPath();
  vg.rect(0, 84, 1440, 916);
  vg.clip();
  vg.drawImage(
    images.haruchan,
    100 - pan,
    250 - (height - 498) * 0.5,
    width,
    height,
  );
  vg.restore();
  return view;
}
function laptopTexture(screen, label) {
  const c = createCanvas(1536, 1150),
    p = c.getContext("2d");
  const prev = g;
  g = p;
  let metal = p.createLinearGradient(30, 0, 1510, 1040);
  metal.addColorStop(0, "#c2c8c6");
  metal.addColorStop(0.12, "#eff1f0");
  metal.addColorStop(0.5, "#697571");
  metal.addColorStop(0.92, "#c9cfcc");
  metal.addColorStop(1, "#535e5a");
  rr(42, 12, 1452, 1022, 34, metal, "#717e76");
  rr(50, 20, 1436, 1005, 28, "#151d19");
  dot(768, 31, 3, "#43534a");
  p.save();
  p.beginPath();
  p.roundRect(65, 45, 1406, 962, 17);
  p.clip();
  p.fillStyle = "#e8eeea";
  p.fillRect(65, 45, 1406, 962);
  p.drawImage(screen, 0, 0, 1440, 1000, 65, 77, 1406, 930);
  p.fillStyle = "#e8eeea";
  p.fillRect(65, 45, 1406, 33);
  dot(86, 61, 4, "#b58a7b");
  dot(101, 61, 4, "#c0af7a");
  dot(116, 61, 4, "#83a58d");
  rr(435, 51, 665, 20, 5, "#f8faf8");
  text(label, 767, 65, 11, "#677b6e", 500, "center");
  p.restore();
  const shine = p.createLinearGradient(60, 40, 1470, 950);
  shine.addColorStop(0, "#ffffff0a");
  shine.addColorStop(0.5, "#ffffff00");
  shine.addColorStop(1, "#ffffff07");
  rr(65, 45, 1406, 962, 17, shine);
  const base = p.createLinearGradient(0, 1028, 0, 1138);
  base.addColorStop(0, "#d8dfda");
  base.addColorStop(0.3, "#f5f6f3");
  base.addColorStop(0.8, "#a4afa7");
  base.addColorStop(1, "#5c6b62");
  p.beginPath();
  p.moveTo(42, 1028);
  p.lineTo(1494, 1028);
  p.lineTo(1530, 1112);
  p.quadraticCurveTo(1528, 1138, 1490, 1138);
  p.lineTo(46, 1138);
  p.quadraticCurveTo(6, 1138, 6, 1112);
  p.closePath();
  p.fillStyle = base;
  p.fill();
  line(43, 1031, 1492, 1031, "#6f8074", 3);
  rr(600, 1030, 335, 32, 0, "#9caaa0");
  line(10, 1111, 1527, 1111, "#ffffff99", 2);
  rr(640, 1069, 255, 42, 7, "#c8d1ca", "#98a69c");
  g = prev;
  return c;
}
function phoneTexture(image) {
  const c = createCanvas(440, 950),
    p = c.getContext("2d");
  const prev = g;
  g = p;
  const edge = p.createLinearGradient(0, 0, 440, 0);
  edge.addColorStop(0, "#cbd3cd");
  edge.addColorStop(0.03, "#64746b");
  edge.addColorStop(0.12, "#1f2b24");
  edge.addColorStop(0.88, "#101c15");
  edge.addColorStop(0.98, "#7c8c81");
  edge.addColorStop(1, "#d1d9d2");
  rr(5, 3, 430, 944, 53, edge, "#aebdb2");
  rr(12, 9, 416, 931, 48, "#122219");
  rr(18, 30, 404, 884, 35, "#f9fbf8");
  p.save();
  p.beginPath();
  p.roundRect(22, 34, 396, 876, 31);
  p.clip();
  p.drawImage(image, 0, 0, image.width, image.height, 22, 34, 396, 876);
  p.restore();
  rr(183, 15, 67, 5, 3, "#061009");
  dot(267, 18, 4, "#38534b");
  dot(267, 18, 1.7, "#8fa8ad");
  rr(174, 927, 92, 4, 2, "#576c5d");
  rr(1, 173, 5, 57, 2, "#8c9e91");
  rr(1, 245, 5, 96, 2, "#8c9e91");
  rr(434, 222, 5, 82, 2, "#a0afa4");
  const gleam = p.createLinearGradient(0, 0, 440, 950);
  gleam.addColorStop(0, "#ffffff0d");
  gleam.addColorStop(0.48, "#ffffff00");
  gleam.addColorStop(1, "#ffffff07");
  rr(12, 9, 416, 931, 48, gleam);
  g = prev;
  return c;
}
const textures = {
  hero: laptopTexture(images.hero, "Khazul Yussery / Portfolio"),
  website: laptopTexture(images.website, "ayobelajarapp.vercel.app"),
  haruchan: laptopTexture(
    haruchanViewport(),
    "Khazul Yussery / Project / Haruchan Warming",
  ),
};
for (const name of ["home", "numbers", "reading", "writing", "mobile"])
  textures[name] = phoneTexture(images[name]);
// Perspective is produced by an orthographic camera, not an invented screenshot.
function device(tex, cx, cy, width, tilt = 0, shear = 0, opacity = 1) {
  g.save();
  g.globalAlpha *= opacity;
  g.translate(cx, cy);
  g.rotate(tilt);
  g.transform(1, shear, 0, 1, 0, 0);
  const h = (width * tex.height) / tex.width;
  g.drawImage(tex, -width / 2, -h / 2, width, h);
  g.restore();
}
function detail(label, title1, title2, x, y) {
  rr(x, y, 220, 125, 19, "#ffffffd9", "#cddbd0");
  text(label, x + 22, y + 33, 13, "#679078", 700, "left", 1.5);
  text(title1, x + 22, y + 72, 25, "#234e39", 600);
  if (title2) text(title2, x + 22, y + 104, 21, "#62836d", 500);
}
const scenes = [
  {
    start: 0,
    end: 3,
    id: "portfolio-intro",
    caption: "KHAZUL YUSSERY / WEB PORTFOLIO",
  },
  {
    start: 3,
    end: 7,
    id: "portfolio-projects",
    caption: "DARI PORTOFOLIO KE PROJECT NYATA",
  },
  { start: 7, end: 10, id: "ayo-website", caption: "AYOBELAJARAPP.VERCEL.APP" },
  {
    start: 10,
    end: 12.7,
    id: "ayo-home",
    caption: "APLIKASI ANDROID / AYO BELAJAR CALISTUNG",
  },
  {
    start: 12.7,
    end: 15.3,
    id: "ayo-numbers",
    caption: "BELAJAR MENGENAL ANGKA",
  },
  {
    start: 15.3,
    end: 17.2,
    id: "ayo-reading",
    caption: "MENGENAL HURUF DAN MEMBACA",
  },
  {
    start: 17.2,
    end: 19,
    id: "ayo-writing",
    caption: "MENULIS / PANDUAN SUARA / OFFLINE",
  },
  {
    start: 19,
    end: 23,
    id: "haruchan",
    caption: "HARUCHAN WARMING / BOT & AUTOMATION",
  },
  {
    start: 23,
    end: 26,
    id: "haruchan-detail",
    caption: "TELEGRAM / WHATSAPP / AI PERSONA",
  },
  {
    start: 26,
    end: 30,
    id: "contact",
    caption: "TERBUKA UNTUK IDE DAN KOLABORASI",
  },
];
function scene(i, t) {
  const s = scenes[i],
    u = t - s.start,
    p = clamp(u / (s.end - s.start));
  const dark = i === 7 || i === 8;
  const warm = i >= 2 && i <= 6;
  background(t, warm, dark);
  header(dark);
  if (i === 0) {
    kicker("INDEPENDENT LEARNER & BUILDER", "01");
    headline("Khazul", "Yussery.", u, { size: 106 });
    subtitle("Rasa ingin tahu. Menjadi karya nyata.");
    shadow(540, 1400, 900, 0.17);
    const scale = 0.94 + 0.06 * out(u / 2);
    device(
      textures.hero,
      540,
      1053 + 45 * (1 - out(u)),
      950 * scale,
      -0.027 + 0.012 * p,
      -0.025,
    );
  } else if (i === 1) {
    kicker("MEMBANGUN DARI IDE", "01");
    headline("Dari ide,", "jadi project.", u, { size: 94 });
    subtitle("Belajar. Mencoba. Terus mengembangkan.");
    const scroll = lerp(0, layout.cards[0].y - 230, ease((u - 0.2) / 3.3));
    const tex = laptopTexture(viewport(scroll), "Khazul Yussery / Portfolio");
    shadow(540, 1410, 920, 0.18);
    device(tex, 540, 1065, 980 + 22 * p, -0.015 + 0.025 * p, -0.015);
  } else if (i === 2) {
    kicker("PROJECT TERBARU", "02");
    headline("Ayo Belajar", "Calistung.", u, { size: 87 });
    subtitle("Aplikasi Android untuk belajar sambil bermain.");
    shadow(540, 1400, 900, 0.16);
    device(
      textures.website,
      540,
      1060 + 20 * (1 - out(u)),
      948 + 24 * p,
      0.022 - 0.012 * p,
      0.018,
    );
    pill("ayobelajarapp.vercel.app", 300, 1428, 480);
  } else if (i >= 3 && i <= 6) {
    kicker("AYO BELAJAR CALISTUNG", "02");
    const head = [
      ["Belajar", "sambil bermain."],
      ["Sedikit demi sedikit,", "mulai mengenal angka."],
      ["Dari huruf,", "menjadi kata."],
      ["Jari kecil.", "Langkah besar."],
    ][i - 3];
    headline(...head, u, { size: i === 4 ? 64 : 84 });
    subtitle(
      i === 3
        ? "Hangat, berwarna, dan berbahasa Indonesia."
        : i === 4
          ? "Kenali bentuknya. Coba pilih jawabannya."
          : i === 5
            ? "Latihan membaca dengan panduan suara."
            : "Menulis, mencoba, dan mengulang lagi.",
    );
    const name = ["home", "numbers", "reading", "writing"][i - 3];
    shadow(585, 1452, 620, 0.22);
    if (i === 3) {
      device(textures.numbers, 350, 1080, 280, -0.105, 0.018, 0.6);
      device(
        textures.home,
        650 - 20 * p,
        1050,
        378 + 9 * p,
        0.035 - 0.015 * p,
        -0.018,
      );
      detail("DIRANCANG UNTUK", "Rasa ingin", "tahu si kecil.", 94, 760);
    } else if (i === 4) {
      device(
        textures[name],
        565 + 12 * p,
        1050,
        398 + 10 * p,
        -0.035 + 0.02 * p,
        -0.015,
      );
      detail("LATIHAN", "Mengenal", "angka 1–5", 90, 820);
    } else if (i === 5) {
      device(
        textures[name],
        585 - 15 * p,
        1045,
        399 + 8 * p,
        0.03 - 0.015 * p,
        0.012,
      );
      detail("PANDUAN SUARA", "Dengar.", "Coba. Ulangi.", 90, 845);
    } else {
      device(
        textures[name],
        570 + 10 * p,
        1040,
        402 + 6 * p,
        -0.025 + 0.01 * p,
        -0.012,
      );
      detail("BELAJAR OFFLINE", "Bisa latihan", "tanpa internet.", 90, 835);
    }
  } else if (i === 7) {
    kicker("PROJECT AUTOMATION", "03", true);
    headline("Haruchan", "Warming.", u, { size: 96, dark: true });
    subtitle("Telegram / WhatsApp automation", true);
    shadow(540, 1400, 920, 0.3);
    device(
      textures.haruchan,
      540,
      1060 + 16 * (1 - out(u)),
      960 + 28 * p,
      -0.025 + 0.018 * p,
      -0.018,
    );
  } else if (i === 8) {
    kicker("BOT · WORKFLOW · AI", "03", true);
    headline("Menghubungkan", "banyak kemungkinan.", u, {
      size: 65,
      dark: true,
    });
    subtitle("Integrasi bot, automation, dan AI persona.", true);
    const image = images.haruchan;
    const x = 90,
      y = 685,
      w = 900,
      h = 620;
    g.save();
    g.shadowColor = "#00160e60";
    g.shadowBlur = 45;
    g.shadowOffsetY = 24;
    rr(x, y, w, h, 24, "#1e4c39");
    g.shadowColor = "transparent";
    g.beginPath();
    g.roundRect(x, y, w, h, 24);
    g.clip();
    const zoom = lerp(1, 1.08, ease(p));
    const cropW = (image.width * 0.475) / zoom;
    const cropH = (cropW * h) / w;
    g.drawImage(image, 0, (image.height - cropH) / 2, cropW, cropH, x, y, w, h);
    g.restore();
    pill("Telegram + WhatsApp", 90, 1360, 350);
    pill("AI persona", 465, 1360, 220);
    pill("API key", 710, 1360, 180);
  } else {
    kicker("MARI MULAI PERCAKAPAN", "04");
    headline("Punya ide?", "Mari terhubung.", u, { size: 86 });
    subtitle("Khazul Yussery · Belajar dan membangun.");
    rr(90, 605, 520, 78, 14, "#183d32");
    text("t.me/khazulyss", 125, 656, 32, "#f0f8ef", 600);
    text("↗", 570, 657, 34, "#a8d8b9", 500, "right");
    shadow(540, 1405, 850, 0.19);
    device(textures.hero, 435, 1090, 745 + 12 * out(u / 2), -0.035, -0.025);
    device(textures.home, 835, 1125, 247 + 5 * p, 0.045, 0.01);
  }
}
const layers = [createCanvas(W, H), createCanvas(W, H)];
const final = createCanvas(W, H),
  finalCtx = final.getContext("2d");
function renderFrame(frame) {
  const t = frame / FPS;
  const idx = scenes.findIndex((s) => t >= s.start && t < s.end);
  textBoxes.length = 0;
  g = layers[0].getContext("2d");
  g.resetTransform();
  g.globalAlpha = 1;
  scene(idx, t);
  finalCtx.drawImage(layers[0], 0, 0);
  const transition = idx > 0 ? clamp((t - scenes[idx].start) / 0.32) : 1;
  if (transition < 1) {
    g = layers[1].getContext("2d");
    g.resetTransform();
    g.globalAlpha = 1;
    scene(idx - 1, scenes[idx].start - 1 / FPS);
    finalCtx.save();
    finalCtx.globalAlpha = 1 - ease(transition);
    finalCtx.drawImage(layers[1], 0, -10 * ease(transition));
    finalCtx.restore();
  }
  g = finalCtx;
  const dark = (idx === 7 || idx === 8) && transition > 0.5;
  g.save();
  g.globalAlpha = 0.72;
  text("@khazulys", 990, 212, 26, dark ? "#eff7ee" : "#183d32", 700, "right");
  g.restore();
  line(90, 1520, 990, 1520, dark ? "#6c8876" : "#bacdc0");
  line(
    90,
    1520,
    90 + 900 * clamp(t / 30),
    1520,
    dark ? "#bbdfc3" : "#276c4c",
    3,
  );
  text(
    scenes[idx].caption,
    90,
    1561,
    15,
    dark ? "#c3d9c9" : "#577561",
    600,
    "left",
    1.2,
  );
  text(
    `${String(Math.floor(t)).padStart(2, "0")} / 30`,
    990,
    1561,
    15,
    dark ? "#c3d9c9" : "#577561",
    600,
    "right",
  );
  text(
    "Music: Night Owl — Broke For Free · CC BY 3.0",
    90,
    1605,
    18,
    dark ? "#a9c6b2" : "#708876",
    500,
  );
  return final;
}
await fs.mkdir(path.join(root, "stills"), { recursive: true });
const previews = [
  { frame: 45, name: "01-portfolio" },
  { frame: 165, name: "02-projects" },
  { frame: 255, name: "03-ayo-website" },
  { frame: 345, name: "04-ayo-home" },
  { frame: 420, name: "05-ayo-angka" },
  { frame: 487, name: "06-ayo-membaca" },
  { frame: 540, name: "07-ayo-menulis" },
  { frame: 630, name: "08-haruchan" },
  { frame: 735, name: "09-haruchan-detail" },
  { frame: 855, name: "10-contact" },
];
const audit = [];
for (const p of previews) {
  const canvas = renderFrame(p.frame);
  audit.push({
    scene: p.name,
    frame: p.frame,
    overflows: textBoxes.filter(
      (b) =>
        b.x < 85 ||
        b.x + b.width > 995 ||
        b.top < 175 ||
        b.top + b.height > 1625,
    ),
  });
  await fs.writeFile(
    path.join(root, "stills", p.name + ".jpg"),
    canvas.encodeSync("jpeg", 92),
  );
}
await fs.writeFile(
  path.join(root, "layout-audit.json"),
  JSON.stringify(audit, null, 2),
);
const overflow = audit.filter((a) => a.overflows.length);
if (overflow.length)
  throw Error("Text safe-area overflow: " + JSON.stringify(overflow));
await fs.writeFile(
  path.join(root, "poster.jpg"),
  renderFrame(345).encodeSync("jpeg", 95),
);
const sheet = createCanvas(1350, 960),
  sg = sheet.getContext("2d");
sg.fillStyle = "#102b20";
sg.fillRect(0, 0, 1350, 960);
for (const [i, p] of previews.entries()) {
  const img = await loadImage(path.join(root, "stills", p.name + ".jpg"));
  sg.drawImage(img, (i % 5) * 270, Math.floor(i / 5) * 480, 270, 480);
}
await fs.writeFile(
  path.join(root, "storyboard.jpg"),
  sheet.encodeSync("jpeg", 93),
);
await fs.writeFile(
  path.join(root, "timeline.json"),
  JSON.stringify(
    {
      width: W,
      height: H,
      fps: FPS,
      frames: FRAMES,
      duration: 30,
      transitionFrames: 10,
      scenes,
    },
    null,
    2,
  ),
);
console.log("Stills, poster, storyboard and layout audit ready");
if (process.argv.includes("--stills")) process.exit(0);
// RGBA frames are streamed without intermediate frame files to keep disk use bounded.
const rangeArg = process.argv.find((arg) => arg.startsWith("--range="));
const [startFrame, endFrame] = rangeArg
  ? rangeArg.slice(8).split(":").map(Number)
  : [0, FRAMES];
if (
  !Number.isInteger(startFrame) ||
  !Number.isInteger(endFrame) ||
  startFrame < 0 ||
  endFrame > FRAMES ||
  startFrame >= endFrame
)
  throw Error("Invalid frame range");
const video = path.join(
  root,
  rangeArg ? `video-segment-${startFrame}-${endFrame}.mp4` : "video-silent.mp4",
);
const encoder = spawn(
  "ffmpeg",
  [
    "-hide_banner",
    "-loglevel",
    "warning",
    "-y",
    "-f",
    "rawvideo",
    "-pixel_format",
    "rgba",
    "-video_size",
    `${W}x${H}`,
    "-framerate",
    "30",
    "-i",
    "pipe:0",
    "-an",
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-crf",
    "18",
    "-pix_fmt",
    "yuv420p",
    "-r",
    "30",
    "-fps_mode",
    "cfr",
    "-frames:v",
    String(endFrame - startFrame),
    "-movflags",
    "+faststart",
    video,
  ],
  { stdio: ["pipe", "ignore", "inherit"] },
);
let encodeError;
encoder.on("error", (e) => (encodeError = e));
encoder.stdin.on("error", (e) => (encodeError = e));
const started = Date.now();
for (let f = startFrame; f < endFrame; f++) {
  if (encodeError) throw encodeError;
  const canvas = renderFrame(f);
  if (!encoder.stdin.write(Buffer.from(canvas.data())))
    await once(encoder.stdin, "drain");
  if (f % 60 === 0)
    console.log(
      `Rendered ${f}/900 frames (${Math.round((Date.now() - started) / 1000)}s)`,
    );
}
encoder.stdin.end();
const [code] = await once(encoder, "close");
if (code !== 0) throw Error("FFmpeg video encoding failed: " + code);
if (rangeArg) {
  console.log("Segment encoded: " + video);
  process.exit(0);
}
console.log("Video encoded; mixing licensed music");
// Linear loudness normalization preserves the original recording; no audio is synthesized.
const music = path.join(assets, "night-owl.ogg"),
  audio = path.join(root, "music-mix.wav");
const analysis = spawn(
  "ffmpeg",
  [
    "-hide_banner",
    "-ss",
    "30",
    "-t",
    "30",
    "-i",
    music,
    "-af",
    "afade=t=in:st=0:d=0.4,afade=t=out:st=29:d=1,loudnorm=I=-16:TP=-1:LRA=11:print_format=json",
    "-f",
    "null",
    "-",
  ],
  { stdio: ["ignore", "ignore", "pipe"] },
);
let stats = "";
analysis.stderr.on("data", (d) => (stats += d));
const [analysisCode] = await once(analysis, "close");
if (analysisCode !== 0) throw Error("Music analysis failed");
const measured = JSON.parse(stats.match(/\{[\s\S]*\}/)[0]);
await fs.writeFile(
  path.join(root, "loudness-source.json"),
  JSON.stringify(measured, null, 2),
);
const filter = `afade=t=in:st=0:d=0.4,afade=t=out:st=29:d=1,loudnorm=I=-16:TP=-1:LRA=11:measured_I=${measured.input_i}:measured_TP=${measured.input_tp}:measured_LRA=${measured.input_lra}:measured_thresh=${measured.input_thresh}:offset=${measured.target_offset}:linear=true,aresample=48000`;
execFileSync(
  "ffmpeg",
  [
    "-hide_banner",
    "-loglevel",
    "warning",
    "-y",
    "-ss",
    "30",
    "-t",
    "30",
    "-i",
    music,
    "-af",
    filter,
    "-ar",
    "48000",
    "-ac",
    "2",
    audio,
  ],
  { stdio: "inherit" },
);
execFileSync(
  "ffmpeg",
  [
    "-hide_banner",
    "-loglevel",
    "warning",
    "-y",
    "-i",
    video,
    "-i",
    audio,
    "-map",
    "0:v:0",
    "-map",
    "1:a:0",
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-af",
    "volume=-0.2dB",
    "-b:a",
    "256k",
    "-ar",
    "48000",
    "-t",
    "30",
    "-movflags",
    "+faststart",
    "-metadata",
    "title=Khazul Yussery — Portfolio & Selected Projects",
    "-metadata",
    "artist=Khazul Yussery",
    "-metadata",
    "comment=Music: Night Owl by Broke For Free. CC BY 3.0 https://creativecommons.org/licenses/by/3.0/ ; 30-second excerpt, faded and normalized. No generative AI media.",
    "-metadata",
    "copyright=Music licensed CC BY 3.0; see CREDITS.txt",
    path.join(root, "khazul-yussery-portfolio-30s.mp4"),
  ],
  { stdio: "inherit" },
);
console.log(
  `Finished ${FRAMES} frames in ${Math.round((Date.now() - started) / 1000)}s`,
);
