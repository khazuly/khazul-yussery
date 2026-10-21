# Khazul Yussery — Portfolio & Selected Projects

Video vertikal berdurasi 30 detik, 1080 × 1920, 30 fps. Watermark `@khazulys` tampil dari awal sampai akhir. Tidak menggunakan gambar, video, musik, atau voice-over generatif AI.

## File hasil

- `khazul-yussery-portfolio-30s.mp4`: hasil final dengan backsound.
- `poster.jpg`: poster Ayo Belajar Calistung.
- `storyboard.jpg`: sepuluh adegan dalam satu gambar.
- `review-decoded.jpg`: sampel frame hasil decode MP4, termasuk transisi.
- `verification.json`: hasil pemeriksaan codec, durasi, frame rate, audio, dan area aman.
- `asset-sources.json` dan `CREDITS.txt`: asal aset dan kredit.
- `source/`: kode capture, compositing, animasi, render, dan pemeriksaan.

## Musik dan kredit untuk caption publikasi

“Night Owl” — Broke For Free. Lisensi CC BY 3.0:
https://creativecommons.org/licenses/by/3.0/

Sumber rekaman:
https://commons.wikimedia.org/wiki/File:Broke_For_Free_-_01_-_Night_Owl.ogg

Perubahan: cuplikan 30 detik mulai 00:30, fade-in/out, normalisasi volume, dan sinkronisasi dengan video. Sertakan kredit tersebut saat memublikasikan video. Kredit juga tertanam di video dan metadata file.

## Menjalankan ulang

Diperlukan Node.js 22+, FFmpeg/ffprobe dengan libx264, dan Chromium untuk capture baru. Semua screenshot dan rekaman asli sudah disertakan agar render dapat diulang tanpa mengakses website.

Dari root repository:

```sh
npm install --prefix output/portfolio-showcase/source
node output/portfolio-showcase/source/prepare.mjs
node output/portfolio-showcase/source/render.mjs --stills
node output/portfolio-showcase/source/render.mjs
node output/portfolio-showcase/source/verify.mjs
```

`prepare.mjs` mengunduh font yang belum tersedia. Render memakai screenshot asli dan rekaman musik yang sudah tersimpan. Tidak memerlukan API AI.

Untuk capture baru, jalankan web portofolio dengan `npm run dev -- --port 5173` lalu, di terminal lain:

```sh
CHROME_BIN=/usr/bin/chromium node output/portfolio-showcase/source/capture.mjs
node output/portfolio-showcase/source/prepare.mjs
```

`PORTFOLIO_URL` dapat diisi untuk mengganti URL capture. Browser menggunakan software rendering tanpa zygote agar dapat berjalan di lingkungan Alpine/proot. Capture membekukan animasi halaman dan menyembunyikan scrollbar/tombol chat; isi UI tidak direka ulang.

`render.mjs` menggambar perangkat dan pencahayaan dengan Canvas, menganimasikan tampilan asli, lalu mengalirkan tepat 900 frame RGBA ke FFmpeg. Musik dinormalisasi dua tahap sebelum di-encode menjadi AAC. Tidak mengubah aplikasi web atau backend.
