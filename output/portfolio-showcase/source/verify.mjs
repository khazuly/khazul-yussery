import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { createCanvas, loadImage } from "@napi-rs/canvas";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const video = path.join(root, "khazul-yussery-portfolio-30s.mp4");
const info = JSON.parse(
  execFileSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-count_frames",
      "-show_streams",
      "-show_format",
      "-of",
      "json",
      video,
    ],
    { encoding: "utf8" },
  ),
);
const v = info.streams.find((s) => s.codec_type === "video"),
  a = info.streams.find((s) => s.codec_type === "audio");
assert.equal(v.width, 1080);
assert.equal(v.height, 1920);
assert.equal(v.avg_frame_rate, "30/1");
assert.equal(v.r_frame_rate, "30/1");
assert.equal(Number(v.nb_read_frames), 900);
assert.equal(v.pix_fmt, "yuv420p");
assert.equal(v.codec_name, "h264");
assert.ok(Math.abs(Number(v.duration) - 30) < 0.001);
assert.equal(a.codec_name, "aac");
assert.equal(Number(a.sample_rate), 48000);
assert.equal(a.channels, 2);
assert.ok(Math.abs(Number(a.duration) - 30) < 0.03);
assert.ok(Math.abs(Number(info.format.duration) - 30) < 0.03);
const audit = JSON.parse(
  await fs.readFile(path.join(root, "layout-audit.json")),
);
assert.ok(audit.every((s) => s.overflows.length === 0));
// Review the decoded MP4, including the first/last frame and every transition.
const times = [
  0, 0.3, 1.5, 2.98, 3.15, 5.5, 7.15, 8.5, 10.15, 11.5, 12.85, 14, 15.45, 16.3,
  17.35, 18, 19.15, 21, 23.15, 24.5, 26.15, 28.5, 29.95,
];
const reviewDir = path.join(root, "review");
await fs.mkdir(reviewDir, { recursive: true });
const thumbnails = [];
for (const [idx, time] of times.entries()) {
  const png = execFileSync(
    "ffmpeg",
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-ss",
      String(time),
      "-i",
      video,
      "-frames:v",
      "1",
      "-vf",
      "scale=270:480",
      "-f",
      "image2pipe",
      "-c:v",
      "png",
      "pipe:1",
    ],
    { maxBuffer: 8 * 1024 * 1024 },
  );
  const image = await loadImage(png);
  const c = createCanvas(270, 480),
    g = c.getContext("2d");
  g.drawImage(image, 0, 0);
  const pixels = g.getImageData(0, 0, 270, 480).data;
  let luma = 0,
    visible = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    const y =
      pixels[i] * 0.2126 + pixels[i + 1] * 0.7152 + pixels[i + 2] * 0.0722;
    luma += y;
    if (y > 12 && y < 245) visible++;
  }
  assert.ok(luma / (270 * 480) > 30, "Frame is black at " + time);
  assert.ok(visible / (270 * 480) > 0.1, "Frame appears blank at " + time);
  // Watermark occupies x~859..990, y~186..212 in the full-size frame.
  const mark = g.getImageData(214, 45, 35, 10).data;
  let watermarkContrast = 0;
  for (let k = 0; k < mark.length; k += 4) {
    watermarkContrast +=
      Math.abs(mark[k] - mark[(k + 4) % mark.length]) +
      Math.abs(mark[k + 1] - mark[(k + 5) % mark.length]);
  }
  assert.ok(watermarkContrast > 200, "Watermark appears missing at " + time);
  thumbnails.push({ time, image });
  await fs.writeFile(
    path.join(
      reviewDir,
      `${String(idx).padStart(2, "0")}-${time.toFixed(2)}.png`,
    ),
    png,
  );
}
const sheet = createCanvas(1620, 2000),
  g = sheet.getContext("2d");
g.fillStyle = "#142b20";
g.fillRect(0, 0, sheet.width, sheet.height);
for (const [i, { time, image }] of thumbnails.entries()) {
  const x = (i % 6) * 270,
    y = Math.floor(i / 6) * 500;
  g.drawImage(image, x, y, 270, 480);
  g.fillStyle = "#e8f3e9";
  g.font = "12px sans-serif";
  g.fillText(`${time.toFixed(2)}s`, x + 10, y + 495);
}
await fs.writeFile(
  path.join(root, "review-decoded.jpg"),
  sheet.encodeSync("jpeg", 90),
);
const loudnessRun = spawnSync(
  "ffmpeg",
  [
    "-hide_banner",
    "-i",
    video,
    "-af",
    "loudnorm=I=-16:TP=-1:LRA=11:print_format=json",
    "-f",
    "null",
    "-",
  ],
  { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 },
);
assert.equal(loudnessRun.status, 0, "Loudness measurement failed");
const loudness = JSON.parse(loudnessRun.stderr.match(/\{[\s\S]*\}/)[0]);
assert.ok(
  Math.abs(Number(loudness.input_i) + 16) < 0.5,
  "Unexpected integrated loudness: " + loudness.input_i,
);
assert.ok(
  Number(loudness.input_tp) <= -1,
  "True peak exceeds -1 dBTP: " + loudness.input_tp,
);
const bytes = await fs.readFile(video);
assert.ok(
  bytes.indexOf(Buffer.from("moov")) < bytes.indexOf(Buffer.from("mdat")),
  "MP4 is not faststart",
);
const report = {
  passed: true,
  width: v.width,
  height: v.height,
  frames: Number(v.nb_read_frames),
  fps: v.avg_frame_rate,
  videoDuration: Number(v.duration),
  audioDuration: Number(a.duration),
  formatDuration: Number(info.format.duration),
  videoCodec: v.codec_name,
  pixelFormat: v.pix_fmt,
  audioCodec: a.codec_name,
  sampleRate: a.sample_rate,
  integratedLUFS: Number(loudness.input_i),
  truePeakDBTP: Number(loudness.input_tp),
  safeAreaAuditPassed: true,
  watermark:
    "@khazulys present in all sampled frames including start, transitions and ending",
  decodedFramesReviewed: times,
  bytes: bytes.length,
};
await fs.writeFile(
  path.join(root, "verification.json"),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
