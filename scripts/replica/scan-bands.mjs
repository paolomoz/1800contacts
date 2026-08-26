#!/usr/bin/env node
// scan-bands.mjs <src.png> — reports runs of dominant row color to locate section boundaries.
import { PNG } from 'pngjs';
import fs from 'fs';
const src = process.argv[2];
const png = PNG.sync.read(fs.readFileSync(src));
const { width, height, data } = png;
// sample the dominant color of each row (mode over a few x samples)
const key = (y) => {
  const xs = [width * 0.5, width * 0.15, width * 0.85].map((v) => Math.floor(v));
  const counts = {};
  for (const x of xs) {
    const i = (y * width + x) * 4;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    // quantize
    const q = `${Math.round(r / 24)},${Math.round(g / 24)},${Math.round(b / 24)}`;
    counts[q] = (counts[q] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
};
let prev = null, start = 0;
const runs = [];
for (let y = 0; y < height; y += 1) {
  const k = key(y);
  if (k !== prev) {
    if (prev !== null) runs.push([start, y - 1, prev]);
    prev = k; start = y;
  }
}
runs.push([start, height - 1, prev]);
// merge tiny runs into neighbors for readability, print runs >= 12px
for (const [a, b, k] of runs) {
  if (b - a + 1 >= 12) {
    const [r, g, bl] = k.split(',').map((n) => parseInt(n, 10) * 24);
    console.log(`y ${String(a).padStart(4)}–${String(b).padStart(4)}  h=${String(b - a + 1).padStart(4)}  rgb~(${r},${g},${bl})`);
  }
}
