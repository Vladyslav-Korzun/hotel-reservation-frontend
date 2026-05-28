import sharp from 'sharp';
import { readdirSync, mkdirSync, statSync, renameSync } from 'fs';
import { join } from 'path';

const configs = [
  { dir: 'public/images/hero',   width: 1920, quality: 78 },
  { dir: 'public/images/hotels', width: 900,  quality: 75 },
  { dir: 'public/images/rooms',  width: 800,  quality: 75 },
];

function walkDir(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      files.push(...walkDir(full));
    } else if (/\.(jpe?g|png|webp)$/i.test(e.name)) {
      files.push(full);
    }
  }
  return files;
}

for (const { dir, width, quality } of configs) {
  mkdirSync(dir, { recursive: true });
  for (const input of walkDir(dir)) {
    const tmp    = input + '.tmp';
    const before = statSync(input).size;
    await sharp(input).resize({ width, withoutEnlargement: true }).jpeg({ quality, mozjpeg: true }).toFile(tmp);
    renameSync(tmp, input);
    const after = statSync(input).size;
    console.log(`${input}: ${(before/1024).toFixed(0)}KB → ${(after/1024).toFixed(0)}KB`);
  }
}
