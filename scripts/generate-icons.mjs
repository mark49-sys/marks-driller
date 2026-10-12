// One-off, deterministic icon generator: public/mark-driller.jpg -> public/icons/*.png
// Run with: npm run icons
// sharp strips EXIF/GPS/ICC metadata by default (withMetadata is intentionally not called).
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'public', 'mark-driller.jpg');
const outDir = path.join(root, 'public', 'icons');

// Brand blue sampled from the artwork edge; used as padding for the maskable safe zone.
const PADDING_BG = { r: 11, g: 70, b: 200, alpha: 1 };

const source = await readFile(sourcePath);

// Validate it is a real JPEG (magic bytes FF D8 FF) and square.
if (!(source[0] === 0xff && source[1] === 0xd8 && source[2] === 0xff)) {
  throw new Error('public/mark-driller.jpg is not a valid JPEG.');
}
const meta = await sharp(source).metadata();
if (meta.format !== 'jpeg' || !meta.width || !meta.height) {
  throw new Error('Unsupported source image.');
}
if (meta.width !== meta.height) {
  throw new Error(`Source must be square, got ${meta.width}x${meta.height}.`);
}

await mkdir(outDir, { recursive: true });

// Full suite of standard PWA icons
const pwaSizes = [48, 72, 96, 128, 144, 152, 192, 256, 384, 512];
for (const size of pwaSizes) {
  await sharp(source)
    .resize(size, size, { fit: 'cover', position: 'centre', kernel: 'lanczos3' })
    .flatten({ background: PADDING_BG })
    .png({ compressionLevel: 9 })
    .toFile(path.join(outDir, `icon-${size}.png`));
}

// Maskable icons: 192 and 512 scaled into the 80% safe zone
for (const maskSize of [192, 512]) {
  const inner = Math.round(maskSize * 0.8);
  const innerBuf = await sharp(source)
    .resize(inner, inner, { fit: 'cover', position: 'centre', kernel: 'lanczos3' })
    .toBuffer();
  await sharp({
    create: { width: maskSize, height: maskSize, channels: 4, background: PADDING_BG },
  })
    .composite([{ input: innerBuf, gravity: 'centre' }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(outDir, `icon-maskable-${maskSize}.png`));
}

// Favicons & Apple Touch Icon
await sharp(source).resize(32, 32).flatten({ background: PADDING_BG }).png().toFile(path.join(outDir, 'favicon-32.png'));
await sharp(source).resize(48, 48).flatten({ background: PADDING_BG }).png().toFile(path.join(outDir, 'favicon-48.png'));
await sharp(source).resize(180, 180).flatten({ background: PADDING_BG }).png().toFile(path.join(outDir, 'apple-touch-icon-180.png'));

// Deterministic Windows multi-resolution favicon.ico (16, 24, 32, 48, 64, 128, 256)
const icoSizes = [16, 24, 32, 48, 64, 128, 256];
const icoFrames = [];
for (const s of icoSizes) {
  const buf = await sharp(source)
    .resize(s, s, { fit: 'cover', position: 'centre', kernel: 'lanczos3' })
    .flatten({ background: PADDING_BG })
    .png({ compressionLevel: 9 })
    .toBuffer();
  icoFrames.push({ size: s, buf });
}

const icoCount = icoFrames.length;
const icoHeaderSize = 6 + icoCount * 16;
let icoOffset = icoHeaderSize;

const icoHeader = Buffer.alloc(6);
icoHeader.writeUInt16LE(0, 0); // reserved
icoHeader.writeUInt16LE(1, 2); // type 1 = ICO
icoHeader.writeUInt16LE(icoCount, 4);

const icoEntries = [];
for (const item of icoFrames) {
  const entry = Buffer.alloc(16);
  entry.writeUInt8(item.size >= 256 ? 0 : item.size, 0); // width
  entry.writeUInt8(item.size >= 256 ? 0 : item.size, 1); // height
  entry.writeUInt8(0, 2); // colors
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bpp
  entry.writeUInt32LE(item.buf.length, 8); // size
  entry.writeUInt32LE(icoOffset, 12); // offset
  icoEntries.push(entry);
  icoOffset += item.buf.length;
}

const icoFile = Buffer.concat([icoHeader, ...icoEntries, ...icoFrames.map((f) => f.buf)]);
await writeFile(path.join(root, 'public', 'favicon.ico'), icoFile);
const distDir = path.join(root, 'dist');
if (existsSync(distDir)) {
  await writeFile(path.join(distDir, 'favicon.ico'), icoFile);
}

// Shortcut icons (96x96)
await sharp(source).resize(96, 96).png().toFile(path.join(outDir, 'shortcut-cbt.png'));
await sharp(source).resize(96, 96).png().toFile(path.join(outDir, 'shortcut-materials.png'));

// ---- Logo derivatives (UI chrome, loaders, emails, social previews) ----
for (const size of [96, 192, 256, 512, 1024]) {
  const base = sharp(source).resize(size, size, { kernel: 'lanczos3' }).sharpen({ sigma: size <= 256 ? 0.6 : 0.3 });
  await base.clone().webp({ quality: size <= 256 ? 90 : 84, effort: 6 }).toFile(path.join(outDir, `logo-full-${size}.webp`));
  await base.clone().png({ compressionLevel: 9, palette: true, quality: 90 }).toFile(path.join(outDir, `logo-full-${size}.png`));
}

// Open Graph / Twitter share image (1200x630), poster centred on brand blue.
const ogInner = await sharp(source).resize(630, 630, { kernel: 'lanczos3' }).toBuffer();
await sharp({
  create: { width: 1200, height: 630, channels: 4, background: PADDING_BG },
})
  .composite([{ input: ogInner, gravity: 'centre' }])
  .png({ compressionLevel: 9, palette: true, quality: 85 })
  .toFile(path.join(outDir, 'og-image-1200x630.png'));

// Rich PWA Install Screenshots (Desktop wide: 1280x720, Mobile narrow: 720x1280)
const wideLogoBuf = await sharp(source).resize(440, 440).png().toBuffer();
const wideSvgOverlay = Buffer.from(`
<svg width="1280" height="720" viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#0f2b6a" />
      <stop offset="60%" stop-color="#071338" />
      <stop offset="100%" stop-color="#03081e" />
    </radialGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#f59e0b" />
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#bg)" />
  <circle cx="980" cy="360" r="230" fill="none" stroke="url(#gold)" stroke-width="4" opacity="0.6"/>
  <text x="100" y="240" fill="#f8fafc" font-family="Segoe UI, Roboto, sans-serif" font-weight="900" font-size="52" letter-spacing="-1">Mark<tspan fill="#f59e0b">Driller</tspan></text>
  <rect x="100" y="260" width="160" height="28" rx="6" fill="#1e3a8a" stroke="#3b82f6" stroke-width="1.5" />
  <text x="180" y="279" fill="#93c5fd" font-family="Segoe UI, Roboto, sans-serif" font-weight="700" font-size="13" letter-spacing="2" text-anchor="middle">CBT PLATFORM</text>
  <text x="100" y="340" fill="#fbbf24" font-family="Segoe UI, Roboto, sans-serif" font-weight="700" font-size="28">Learn smarter. Drill deeper. Hit the mark.</text>
  <text x="100" y="390" fill="#94a3b8" font-family="Segoe UI, Roboto, sans-serif" font-weight="400" font-size="20">Standard CBT Mock Simulations for JAMB/UTME, WAEC, and NECO Candidates</text>
  <rect x="100" y="440" width="220" height="52" rx="10" fill="#d97706" />
  <text x="210" y="473" fill="#ffffff" font-family="Segoe UI, Roboto, sans-serif" font-weight="700" font-size="18" text-anchor="middle">Start Practising Free</text>
</svg>
`);

await sharp({
  create: { width: 1280, height: 720, channels: 4, background: { r: 3, g: 8, b: 30, alpha: 1 } },
})
  .composite([
    { input: wideSvgOverlay, top: 0, left: 0 },
    { input: wideLogoBuf, top: 140, left: 760 },
  ])
  .png({ compressionLevel: 9, palette: true, quality: 85 })
  .toFile(path.join(outDir, 'screenshot-wide.png'));

const narrowLogoBuf = await sharp(source).resize(360, 360).png().toBuffer();
const narrowSvgOverlay = Buffer.from(`
<svg width="720" height="1280" viewBox="0 0 720 1280" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="nbg" cx="50%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#0f2b6a" />
      <stop offset="60%" stop-color="#071338" />
      <stop offset="100%" stop-color="#03081e" />
    </radialGradient>
    <linearGradient id="ngold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#f59e0b" />
    </linearGradient>
  </defs>
  <rect width="720" height="1280" fill="url(#nbg)" />
  <circle cx="360" cy="380" r="190" fill="none" stroke="url(#ngold)" stroke-width="4" opacity="0.6"/>
  <text x="360" y="640" fill="#f8fafc" font-family="Segoe UI, Roboto, sans-serif" font-weight="900" font-size="48" letter-spacing="-1" text-anchor="middle">Mark<tspan fill="#f59e0b">Driller</tspan></text>
  <rect x="270" y="665" width="180" height="30" rx="8" fill="#1e3a8a" stroke="#3b82f6" stroke-width="1.5" />
  <text x="360" y="686" fill="#93c5fd" font-family="Segoe UI, Roboto, sans-serif" font-weight="700" font-size="14" letter-spacing="2" text-anchor="middle">CBT PLATFORM</text>
  <text x="360" y="750" fill="#fbbf24" font-family="Segoe UI, Roboto, sans-serif" font-weight="700" font-size="24" text-anchor="middle">Drill down. Hit the mark.</text>
  <text x="360" y="800" fill="#94a3b8" font-family="Segoe UI, Roboto, sans-serif" font-weight="400" font-size="18" text-anchor="middle">JAMB / WAEC / NECO Practice</text>
  <rect x="200" y="860" width="320" height="56" rx="14" fill="#d97706" />
  <text x="360" y="895" fill="#ffffff" font-family="Segoe UI, Roboto, sans-serif" font-weight="700" font-size="20" text-anchor="middle">Launch CBT Room</text>
</svg>
`);

await sharp({
  create: { width: 720, height: 1280, channels: 4, background: { r: 3, g: 8, b: 30, alpha: 1 } },
})
  .composite([
    { input: narrowSvgOverlay, top: 0, left: 0 },
    { input: narrowLogoBuf, top: 200, left: 180 },
  ])
  .png({ compressionLevel: 9, palette: true, quality: 85 })
  .toFile(path.join(outDir, 'screenshot-narrow.png'));

console.log('Icons and manifest screenshots successfully generated in public/icons');
