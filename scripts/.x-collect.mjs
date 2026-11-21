import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';
const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: '127.0.0.1,localhost' } : undefined;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'], proxy });
const c = await b.newContext({ viewport: { width: 1280, height: 900 }, ignoreHTTPSErrors: !!proxy });
await c.addInitScript(() => localStorage.setItem('flexs.lang','fr'));
const base='http://127.0.0.1:4174'; const seen=new Set(); const queue=['/','/post-job/success','/auth/check-email','/auth/reset-password','/open-in-app','/does-not-exist','/auth/forgot-password','/terms?for=professionals']; const all=new Set();
const grab=async p=>{ for(const t of await p.evaluate(()=>window.__flexsUntranslated?.()||[])) all.add(t); };
while(queue.length && seen.size<150){ const r=queue.shift(); if(seen.has(r)) continue; seen.add(r); const p=await c.newPage();
  await p.goto(base+r,{waitUntil:'networkidle'}).catch(()=>{}); await p.waitForTimeout(600);
  // open menus and the wizard where present
  const gs=p.getByRole('button',{name:/Get Started/i}).first(); if(await gs.count()){ await gs.click().catch(()=>{}); for(let i=0;i<12;i++){ await p.waitForTimeout(700); const d=p.locator('[role=dialog]').first(); if(!(await d.count())) break; await grab(p); const opt=d.locator('button:visible').filter({hasNotText:/^(Continue|Next|Submit|Back|Skip)/i}).filter({hasText:/\w{3,}/}).first(); const f=d.locator('input:visible:not([type=radio]):not([type=checkbox]),textarea:visible'); if(await f.count()){ for(const el of await f.all()){ const t=await el.getAttribute('type'); if(!(await el.inputValue())) await el.fill(t==='email'?'a@example.com':t==='tel'?'5145550100':'Montréal').catch(()=>{}); } } else if(await opt.count()) await opt.click().catch(()=>{}); const n=d.getByRole('button',{name:/^(Continue|Next)/i}).last(); if(await n.count()) await n.click({timeout:2000}).catch(()=>{}); else break; if(/Describe your request/i.test(await d.innerText().catch(()=>''))) { await grab(p); break; } } }
  await grab(p);
  const links=await p.evaluate(()=>[...document.querySelectorAll('a[href^="/"]')].map(a=>a.getAttribute('href').split('#')[0]));
  for(const h of links){ if(/^\/business\//.test(h) && [...seen,...queue].filter(x=>x.startsWith('/business/')).length>=2) continue; if(/^\/services\//.test(h) && [...seen,...queue].filter(x=>x.startsWith('/services/')).length>=8) continue; if(/^\/directory\?/.test(h) && [...seen,...queue].filter(x=>x.startsWith('/directory?')).length>=2) continue; if(!seen.has(h)&&!queue.includes(h)) queue.push(h); }
  await p.close(); }
writeFileSync(process.argv[2],JSON.stringify([...all])); console.log('pages',seen.size,'strings',all.size); await b.close();
