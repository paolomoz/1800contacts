#!/usr/bin/env node
// crop.mjs <src.png> <outDir> [bandHeight=700] [overlap=40]
// Slices a tall stitched capture into vertical bands for full-res reading.
import { PNG } from 'pngjs';
import fs from 'fs';
import path from 'path';

const [src, outDir, bandArg, ovArg] = process.argv.slice(2);
if (!src || !outDir) { console.error('usage: crop.mjs <src.png> <outDir> [band=700] [overlap=40]'); process.exit(1); }
const band = parseInt(bandArg || '700', 10);
const overlap = parseInt(ovArg || '40', 10);
fs.mkdirSync(outDir, { recursive: true });

const png = PNG.sync.read(fs.readFileSync(src));
const { width, height } = png;
let idx = 0;
for (let y = 0; y < height; y += band) {
  const y0 = Math.max(0, y - (idx === 0 ? 0 : overlap));
  const h = Math.min(band + (idx === 0 ? 0 : overlap), height - y0);
  const out = new PNG({ width, height: h });
  for (let row = 0; row < h; row += 1) {
    const srcStart = ((y0 + row) * width) * 4;
    const dstStart = (row * width) * 4;
    png.data.copy(out.data, dstStart, srcStart, srcStart + width * 4);
  }
  const name = path.join(outDir, `band-${String(idx).padStart(2, '0')}_y${y0}-${y0 + h}.png`);
  fs.writeFileSync(name, PNG.sync.write(out));
  console.log(name);
  idx += 1;
}
