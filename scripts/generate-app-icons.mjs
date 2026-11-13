// Renders the FLEXS mark into the web-app icons and the source images that
// `npx capacitor-assets generate` turns into Android/iOS icons and splash screens.
import sharp from "sharp";

const NAVY = "#203b74";
const mark = (scale, dx, dy) => `<g transform="translate(${dx} ${dy}) scale(${scale})"><path d="M38 15h-6c-7 0-11 4-11 11v5h-5v7h5v16h9V38h8v-7h-8v-5c0-3 1-4 4-4h4z" fill="white"/><circle cx="47" cy="48" r="5" fill="#fdba74"/></g>`;
const svg = (size, body) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${body}</svg>`);
const square = size => svg(size, `<rect width="${size}" height="${size}" fill="${NAVY}"/>${mark(size / 64, 0, 0)}`);
// Maskable/adaptive icons are cropped to a circle: keep the mark inside the centre 60%.
const padded = (size, background) => svg(size, `${background ? `<rect width="${size}" height="${size}" fill="${NAVY}"/>` : ""}${mark((size * 0.6) / 64, size * 0.2, size * 0.2)}`);
const splash = size => svg(size, `<rect width="${size}" height="${size}" fill="${NAVY}"/>${mark((size * 0.18) / 64, size * 0.41, size * 0.41)}`);

const out = [
  ["public/icons/icon-192.png", square(192)],
  ["public/icons/icon-512.png", square(512)],
  ["public/icons/icon-maskable-512.png", padded(512, true)],
  ["public/icons/apple-touch-icon.png", square(180)],
  ["assets/icon-only.png", square(1024)],
  ["assets/icon-foreground.png", padded(1024, false)],
  ["assets/icon-background.png", svg(1024, `<rect width="1024" height="1024" fill="${NAVY}"/>`)],
  ["assets/splash.png", splash(2732)],
  ["assets/splash-dark.png", splash(2732)],
];
for (const [file, source] of out) await sharp(source).png().toFile(file);
console.log(`Wrote ${out.length} images`);
