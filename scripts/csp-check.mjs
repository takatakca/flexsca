// Loads the BUILT site (dist/) in a browser and fails on any content-security-policy violation.
// The policy is written into the page by the build (scripts/csp-meta.mjs), so this is the test that
// the policy does not block the site's own scripts, styles, images, map or backend calls.
// Usage: npm run build && node scripts/csp-check.mjs
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const html = readFileSync('dist/index.html', 'utf8');
const meta = /<meta http-equiv="Content-Security-Policy" content="([^"]+)"/.exec(html);
assert.ok(meta, 'dist/index.html carries no Content-Security-Policy');
assert.match(meta[1], /script-src 'self'(;|$)/, 'scripts must be limited to this site');
assert.doesNotMatch(meta[1], /unsafe-eval|script-src[^;]*unsafe-inline|script-src[^;]*\*/, 'the script policy must stay strict');
assert.ok(!existsSync('dist/.htaccess'), 'dist/ must not ship the Apache configuration');
console.log('PASS the build writes a strict policy into the page and ships no .htaccess');

const port = 4391;
const server = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: 'ignore', detached: true });
const stop = () => { try { process.kill(-server.pid); } catch { /* already gone */ } };
process.on('exit', stop);
const base = `http://127.0.0.1:${port}`;
for (let i = 0; i < 60; i++) { try { if ((await fetch(base)).ok) break; } catch { await new Promise(r => setTimeout(r, 250)); } }

const executablePath = process.env.CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : chromium.executablePath());
const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: '127.0.0.1,localhost' } : undefined;
const browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox'], proxy });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, ignoreHTTPSErrors: !!proxy });
await context.addInitScript(() => {
  window.__csp = [];
  document.addEventListener('securitypolicyviolation', e => window.__csp.push(`${e.violatedDirective} blocked ${e.blockedURI || 'inline'}`));
});
const page = await context.newPage();
const violations = [];
for (const path of ['/', '/?lang=fr', '/services', '/services/plumbing', '/post-job', '/directory', '/pro', '/help', '/terms', '/auth/login', '/auth/welcome', '/app/leads', '/my-requests']) {
  await page.goto(base + path, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.getElementById('root').innerText.trim().length > 40, null, { timeout: 15000 });
  for (const v of await page.evaluate(() => window.__csp)) violations.push(`${path}: ${v}`);
}
// The request form and its town suggestions are the busiest screen.
await page.goto(base + '/post-job/house-cleaning', { waitUntil: 'networkidle' });
for (const v of await page.evaluate(() => window.__csp)) violations.push(`/post-job/house-cleaning: ${v}`);

// Framed by another site: nothing is shown.
await page.setContent(`<iframe src="${base}/" style="width:800px;height:600px"></iframe>`);
const frame = page.frames().find(f => f.url().startsWith(base));
await page.waitForTimeout(1500);
const shown = frame ? await frame.evaluate(() => getComputedStyle(document.documentElement).display !== 'none' && document.getElementById('root').childElementCount > 0).catch(() => false) : false;
await browser.close();
stop();
assert.deepEqual(violations, [], 'content security policy violations');
console.log('PASS 14 pages of the built site load with no policy violation');
assert.equal(shown, false, 'the site rendered inside a foreign frame');
console.log('PASS the site shows nothing when another page frames it');
