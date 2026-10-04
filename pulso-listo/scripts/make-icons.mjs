// Regenerates the PWA icons (pure Node, no dependencies): `pnpm icons`.
// Output: apps/web/public/icons/{icon-192,icon-512,apple-touch-icon}.png (committed files).
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { crc32, deflateSync } from "node:zlib";

const BACKGROUND = [0x0b, 0x0d, 0x0c];
const SIGNAL = [0x3d, 0xdc, 0x84];
// ECG-style line, normalised to the icon square. Stays inside the maskable safe circle (r = 0.4).
const POINTS = [
  [0.12, 0.5],
  [0.32, 0.5],
  [0.4, 0.3],
  [0.48, 0.7],
  [0.56, 0.2],
  [0.64, 0.5],
  [0.88, 0.5],
];

function distanceToSegment(px, py, [ax, ay], [bx, by]) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const out = Buffer.alloc(8 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc32(body), 8 + data.length);
  return out;
}

function renderPng(size) {
  const half = (size * 0.03) / size;
  const rows = [];
  for (let y = 0; y < size; y += 1) {
    const row = Buffer.alloc(1 + size * 3);
    for (let x = 0; x < size; x += 1) {
      const nx = (x + 0.5) / size;
      const ny = (y + 0.5) / size;
      let distance = Number.POSITIVE_INFINITY;
      for (let i = 0; i < POINTS.length - 1; i += 1) {
        distance = Math.min(distance, distanceToSegment(nx, ny, POINTS[i], POINTS[i + 1]));
      }
      const coverage = Math.max(0, Math.min(1, (half - distance) / (1 / size) + 0.5));
      for (let c = 0; c < 3; c += 1) {
        row[1 + x * 3 + c] = Math.round(BACKGROUND[c] + (SIGNAL[c] - BACKGROUND[c]) * coverage);
      }
    }
    rows.push(row);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(Buffer.concat(rows))),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const outDir = resolve(import.meta.dirname, "../apps/web/public/icons");
mkdirSync(outDir, { recursive: true });
for (const [name, size] of [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["apple-touch-icon.png", 180],
]) {
  const target = resolve(outDir, name);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, renderPng(size));
}
