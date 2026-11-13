// Step-by-step screen verification: open each route at phone size, screenshot it, read the
// screenshot back with OCR and compare with the page's own text. Flags console errors, failed
// requests, broken images, sideways overflow and wording that must not ship.
// Usage: node scripts/ocr-screen-audit.mjs <baseUrl> <outDir> [sessionJsonFile]
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const [base, out, sessionFile] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const PUBLIC = ['/', '/about', '/affiliates', '/pro', '/help', '/help/credits', '/cookies', '/services/plumbing', '/post-job', '/post-job/plumbing', '/auth/login', '/auth/welcome', '/auth/forgot-password', '/open-in-app', '/this-page-does-not-exist'];
const SIGNED_IN = ['/app/dashboard', '/app/leads', '/app/responses', '/app/reminders', '/app/notifications', '/app/settings', '/app/settings/profile', '/app/settings/account', '/app/credits', '/my-requests', '/support'];
const BANNED = [/headquarters in London|Founded in London/, /postcode/i, /£/, /lorem ipsum/i, /\bundefined\b/, /\bNaN\b/, /\[object /, /FLEX'S/, /\bBark\b/i, /Trustpilot/i, /\bTODO\b/, /4\.89\/560/];
const words = t => (t.toLowerCase().match(/[a-zà-ÿ]{4,}/g) ?? []);

const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: '127.0.0.1,localhost' } : undefined;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : chromium.executablePath()), args: ['--no-sandbox'], proxy });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, ignoreHTTPSErrors: Boolean(proxy) });
await context.route('https://images.unsplash.com/**', r => r.abort());
if (sessionFile) {
  const { key, session } = JSON.parse(readFileSync(sessionFile, 'utf8'));
  await context.addInitScript(([k, v]) => localStorage.setItem(k, v), [key, JSON.stringify(session)]);
}
const results = [];
for (const route of sessionFile ? SIGNED_IN : PUBLIC) {
  const page = await context.newPage();
  const errors = [], failed = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_FAILED|non-existent route/.test(m.text())) errors.push(m.text().slice(0, 200)); });
  page.on('response', r => { if (r.status() >= 400 && !r.url().includes('unsplash')) failed.push(`${r.status()} ${new URL(r.url()).pathname}`); });
  await page.goto(base + route, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const name = (sessionFile ? 'app' : 'public') + (route === '/' ? '-home' : route.replace(/\//g, '-'));
  const shot = `${out}/${name}.png`;
  await page.screenshot({ path: shot, fullPage: true });
  const dom = await page.locator('body').innerText();
  const facts = await page.evaluate(() => ({
    finalPath: location.pathname,
    overflow: document.documentElement.scrollWidth - window.innerWidth,
    brokenImages: [...document.images].filter(i => i.complete && i.naturalWidth === 0 && !i.src.includes('unsplash')).map(i => i.src),
    title: document.title,
    h1: document.querySelector('h1')?.textContent?.trim() ?? null,
  }));
  const ocr = execFileSync('tesseract', [shot, 'stdout', '-l', 'eng+fra', '--psm', '3'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 26 });
  writeFileSync(`${out}/${name}.dom.txt`, dom); writeFileSync(`${out}/${name}.ocr.txt`, ocr);
  const domWords = [...new Set(words(dom))], ocrWords = new Set(words(ocr));
  const recall = domWords.length ? domWords.filter(w => ocrWords.has(w)).length / domWords.length : 1;
  // Wording is judged on the page's real text. OCR alone misreads icons as symbols, so OCR-only hits are notes.
  const banned = BANNED.filter(rx => rx.test(dom)).map(String);
  const ocrOnly = BANNED.filter(rx => !rx.test(dom) && rx.test(ocr)).map(String);
  const problems = [];
  if (errors.length) problems.push(`errors: ${errors.join(' | ')}`);
  if (failed.length) problems.push(`failed requests: ${[...new Set(failed)].join(', ')}`);
  if (facts.overflow > 1) problems.push(`sideways overflow ${facts.overflow}px`);
  if (facts.brokenImages.length) problems.push(`broken images: ${facts.brokenImages.join(', ')}`);
  if (banned.length) problems.push(`banned wording: ${banned.join(' ')}`);
  if (dom.trim().length < 40) problems.push('page is almost empty');
  // The help index shows two-line previews of long answers, so most of its DOM text is deliberately cut off on screen.
  const clamped = await page.locator('.line-clamp-2, .line-clamp-3, .truncate').count();
  // Pages with very little text (empty states) are dominated by hidden accessibility labels, so recall is not meaningful there.
  if (domWords.length >= 15 && recall < (clamped > 3 ? 0.35 : 0.8)) problems.push(`OCR read only ${(recall * 100).toFixed(0)}% of the page words (possible unreadable text)`);
  results.push({ route, ...facts, domWords: domWords.length, ocrRecall: Number(recall.toFixed(3)), ocrOnlyNotes: ocrOnly, problems });
  console.log(`${problems.length ? 'CHECK' : 'OK   '} ${route.padEnd(30)} → ${facts.finalPath.padEnd(26)} OCR ${(recall * 100).toFixed(0)}%  ${problems.join(' ; ')}`);
  await page.close();
}
writeFileSync(`${out}/${sessionFile ? 'app' : 'public'}-report.json`, JSON.stringify({ base, at: new Date().toISOString(), results }, null, 2));
await browser.close();
process.exit(0);
