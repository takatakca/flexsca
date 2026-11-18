// Screenshot a route at the Figma phone artboard width (440 px) for side-by-side comparison with a frame export.
// Usage: node scripts/figma-compare.mjs <baseUrl> <route> <out.png> [sessionJsonFile]
import { chromium } from 'playwright-core';
import { existsSync, readFileSync } from 'node:fs';
const [base, route, out, sessionFile] = process.argv.slice(2);
const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: '127.0.0.1,localhost' } : undefined;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : chromium.executablePath()), args: ['--no-sandbox'], proxy });
const context = await browser.newContext({ viewport: { width: 440, height: 956 }, deviceScaleFactor: 1, ignoreHTTPSErrors: Boolean(proxy) });
if (sessionFile) { const { key, session } = JSON.parse(readFileSync(sessionFile, 'utf8')); await context.addInitScript(([k, v]) => localStorage.setItem(k, v), [key, JSON.stringify(session)]); }
const page = await context.newPage(); const errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.goto(base + route, { waitUntil: 'networkidle' }); await page.waitForTimeout(800);
await page.screenshot({ path: out, fullPage: true });
console.log(JSON.stringify({ route, overflow: await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), errors }));
await browser.close();
