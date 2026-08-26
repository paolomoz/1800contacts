#!/usr/bin/env node
// scan-masked.mjs <src.png> <totalH> — section boundaries with fixed-chrome seams masked.
// Fixed chrome (sticky header at chunk tops, fixed bottom bar at chunk bottoms)
// recurs at deterministic y for vh=900. Mask those rows, report dominant-bg runs.
import { PNG } from 'pngjs';
import fs from 'fs';
const src = process.argv[2];
const vh = 900, headerH = 56, barH = 76;
const png = PNG.sync.read(fs.readFileSync(src));
const { width, height, data } = png;
const masked = new Array(height).fill(false);
for (let cy = 0; cy < height; cy += vh) {
  const actualY = Math.min(cy, Math.max(0, height - vh));
  if (actualY > 0) for (let y = actualY; y < actualY + headerH && y < height; y++) masked[y] = true; // sticky header
  const barTop = actualY + vh - barH;
  for (let y = barTop; y < actualY + vh && y < height; y++) if (y >= 0) masked[y] = true; // bottom bar
}
const bg = (y) => {
  const xs = [width * 0.5, width * 0.12, width * 0.88].map((v) => Math.floor(v));
  const c = {};
  for (const x of xs) { const i = (y * width + x) * 4; const q = `${Math.round(data[i] / 28)},${Math.round(data[i + 1] / 28)},${Math.round(data[i + 2] / 28)}`; c[q] = (c[q] || 0) + 1; }
  return Object.entries(c).sort((a, b) => b[1] - a[1])[0][0];
};
let prev = null, start = 0; const runs = [];
for (let y = 0; y < height; y++) {
  if (masked[y]) continue;
  const k = bg(y);
  if (k !== prev) { if (prev !== null) runs.push([start, y - 1, prev]); prev = k; start = y; }
}
runs.push([start, height - 1, prev]);
for (const [a, b, k] of runs) {
  if (b - a + 1 >= 30) {
    const [r, g, bl] = k.split(',').map((n) => parseInt(n, 10) * 28);
    console.log(`y ${String(a).padStart(4)}–${String(b).padStart(4)}  h=${String(b - a + 1).padStart(4)}  rgb~(${r},${g},${bl})`);
  }
}
