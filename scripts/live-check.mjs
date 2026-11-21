// Read-only check of the public website in a real browser. Writes nothing to the database.
// Usage: node scripts/live-check.mjs [https://flexs.ca]
import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';

const base = (process.argv[2] || process.env.WEBSITE_URL || 'https://flexs.ca').replace(/\/$/, '');
const executablePath = process.env.CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : chromium.executablePath());
const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
const browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox'], proxy });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, ignoreHTTPSErrors: !!proxy });
const failures = [];
const fail = (what, why) => { failures.push(`${what}: ${why}`); console.log(`FAIL ${what}: ${why}`); };

// 1. Every public page answers, shows one heading, fits the window and throws no script error.
const pages = ['/', '/post-job', '/services', '/services/plumbing', '/directory', '/pro', '/about', '/help', '/help/credits', '/terms', '/privacy', '/cookies', '/press', '/affiliates', '/auth/login', '/auth/welcome', '/auth/forgot-password'];
for (const route of pages) {
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 500) errors.push(`${response.status()} ${response.url()}`); });
  const response = await page.goto(base + route, { waitUntil: 'networkidle', timeout: 60000 }).catch(error => { errors.push(error.message); return null; });
  const info = await page.evaluate(() => ({ h1: document.querySelectorAll('h1').length, text: document.body.innerText.length, extra: document.documentElement.scrollWidth - window.innerWidth, notFound: /Page not found/i.test(document.body.innerText) }));
  if (!response || response.status() !== 200) fail(route, `status ${response?.status()}`);
  else if (info.notFound) fail(route, 'shows the not-found page');
  else if (info.h1 !== 1) fail(route, `${info.h1} main headings`);
  else if (info.text < 80) fail(route, 'almost empty');
  else if (info.extra > 0) fail(route, `overflows sideways by ${info.extra}px`);
  else if (errors.length) fail(route, errors[0].slice(0, 160));
  else console.log(`OK   ${route}`);
  await page.close();
}

// 2. Signed-out visitors are sent to sign-in, never shown a private page.
for (const route of ['/my-requests', '/app/leads', '/support']) {
  const page = await context.newPage();
  await page.goto(base + route, { waitUntil: 'networkidle', timeout: 60000 });
  if (!new URL(page.url()).pathname.startsWith('/auth/')) fail(route, `signed-out visitor stays on ${page.url()}`); else console.log(`OK   ${route} asks to sign in`);
  await page.close();
}

// 3. The directory finds businesses, and the request wizard opens.
const page = await context.newPage();
try {
  await page.goto(`${base}/directory?city=Laval&trade=Plumbing`, { waitUntil: 'networkidle', timeout: 60000 });
  const found = await page.getByRole('link', { name: /View profile/ }).count();
  if (found === 0) fail('directory', 'no business listed for plumbing in Laval'); else console.log(`OK   directory lists ${found} businesses for plumbing in Laval`);
  await page.goto(`${base}/services/plumbing`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.getByRole('button', { name: /Get Started/i }).first().click();
  await page.locator('[role="dialog"] h2').first().waitFor({ timeout: 15000 });
  console.log('OK   request wizard opens with its first question');
} catch (error) { fail('interaction', String(error.message).split('\n')[0].slice(0, 160)); }
await browser.close();

console.log(failures.length ? `\n${failures.length} problem(s) on ${base}` : `\nAll live checks passed on ${base}`);
process.exit(failures.length ? 1 : 0);
