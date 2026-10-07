import { existsSync } from "node:fs";
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

// UI integration fixtures: never submit real leads or send emails/payments.
const server = spawn('npm', ['run','dev','--','--host','127.0.0.1','--port','4173','--strictPort'], { stdio: 'ignore', detached: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : chromium.executablePath()), headless: true, args: ['--no-sandbox'] });
const leadId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const userId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const category = { id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', name: 'House Cleaning', slug: 'house-cleaning', icon: '🧹', parent_slug: null, is_active: true, base_credit_cost: 6, questions: [{ id: 'rooms', label: 'Which rooms need cleaning?', type: 'checkbox', options: ['Kitchen','Bathroom'], required: true }] };
let submitted, sentQuote;
let unlocked = false, quoteStatus = "sent";
let searches = [], failSearch = false;
const errors = [];
const page = await browser.newPage();
page.on('pageerror', e => errors.push(e.message));
await page.route('https://images.unsplash.com/**', route => route.abort());
await page.route('**/auth/v1/user', route => route.fulfill({status:200,json:{id:userId,email:'customer@example.test',app_metadata:{},user_metadata:{},aud:'authenticated',email_confirmed_at:new Date().toISOString()}}));
await page.route('**/rest/v1/**', async route => {
  const url = new URL(route.request().url());
  const path = url.pathname.split('/').at(-1);
  let body = [], total;
  if (path === 'service_categories') body = url.searchParams.has('parent_slug') ? [] : route.request().headers().accept?.includes('object') ? category : [category];
  if (path === 'submit_lead') { submitted = route.request().postDataJSON(); body = leadId; }
  if (path === 'leads_safe') {
    const record = { id:leadId,category:category.name,city:'Toronto',location_text:'Toronto',credits_cost:6,created_at:new Date().toISOString(),last_activity_at:new Date().toISOString(),is_urgent:false,has_additional_details:true,answers:{},status:'new',details:unlocked ? 'Customer details' : null,customer_name:unlocked ? 'Customer' : 'C***',customer_email:unlocked ? 'customer@example.test' : null,customer_phone:null };
    body = route.request().headers().accept?.includes('object') ? record : [record]; total = 7;
  }
  if (path === 'lead_agent_state') {
    const state = {lead_id:leadId,agent_id:userId,contacted:unlocked,is_archived:false,is_unread:false,first_to_respond:true,custom_status_id:null};
    body = route.request().headers().accept?.includes('object') ? state : [state]; total = 2;
  }
  if (path === 'search_marketplace_leads') {
    const query=route.request().postDataJSON(); searches.push(query);
    if(failSearch) { failSearch=false; await route.fulfill({status:503,json:{message:'Temporary search outage'}}); return; }
    const filtered=Boolean(query.p_filters.keyword) || query.p_filters.archived;
    body={leads:[{id:leadId,category:category.name,location_text:'Toronto',city:'Toronto',postal_code:null,customer_name:'C***',customer_phone:null,details:null,status:'new',created_at:new Date().toISOString(),last_activity_at:new Date().toISOString(),credits_cost:6,is_urgent:false,has_additional_details:true,answers:{},is_unread:true,is_archived:query.p_filters.archived,contacted:false,first_to_respond:false,custom_status_id:null}],total:filtered ? 1 : 21,services:[category.name],credits:[6]};
  }
  if (path === 'contact_lead') { unlocked=true; body={already_contacted:false,credits_spent:6,customer_name:'Customer',customer_email:'customer@example.test',customer_phone:null}; }
  if (path === 'send_quote') { sentQuote=route.request().postDataJSON(); body='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'; }
  if (path === 'responses') body=sentQuote ? [{id:'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',lead_id:leadId,pro_id:userId,message:sentQuote.p_message,price_min:sentQuote.p_price_min,price_max:sentQuote.p_price_max,availability:null,status:quoteStatus,created_at:new Date().toISOString()}] : [];
  if (path === 'decide_quote') { quoteStatus=route.request().postDataJSON().p_decision; body=true; }
  if (path === 'reminders') total = 1;
  if (path === 'credit_wallets') body = { balance: 20 };
  if (path === 'provider_reviews') body = [{rating:5}];
  if (path === 'is_platform_admin') body = false;
  if (path === 'claim_customer_leads') body = 1;
  if (path === 'leads') body = url.searchParams.has('id') ? {id:leadId,category:category.name,location_text:'Toronto',status:'new',details:'Customer request details',created_at:new Date().toISOString(),archived:false} : [{id:leadId,category:category.name,location_text:'Toronto',status:'new',created_at:new Date().toISOString(),archived:false}];
  if (path === 'customer_request_providers') body = [];
  await route.fulfill({ status:200, json:body, headers:{'access-control-allow-origin':'*', 'access-control-expose-headers':'content-range', ...(total !== undefined ? {'content-range':`0-0/${total}`} : {})} });
});
try {
  for(let i=0;i<100;i++) {
    try { const r=await fetch('http://127.0.0.1:4173/'); if(r.ok)break; } catch {}
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  await page.goto('http://127.0.0.1:4173/?ttclid=dddddddd-dddd-4ddd-8ddd-dddddddddddd');
  await page.getByRole('link',{name:'Find a Pro',exact:true}).first().click();
  await page.getByRole('button',{name:/House Cleaning/}).click();
  await page.getByRole('button',{name:'Kitchen',exact:true}).click();
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.getByPlaceholder('Full name').fill('Test Customer');
  await page.getByPlaceholder('your@email.com').fill('customer@example.test');
  await page.getByPlaceholder('City, Postal Code').fill('Toronto, M1A1A1');
  await page.getByRole('button',{name:'Get free quotes'}).click();
  await page.getByRole('heading',{name:/Request submitted/}).waitFor();
  assert.deepEqual(submitted.p_answers,{rooms:['Kitchen']});
  assert.equal(submitted.p_attribution_id,'dddddddd-dddd-4ddd-8ddd-dddddddddddd');
  console.log('PASS customer questionnaire → validated intake → success; checkbox answers and opaque attribution preserved');
  category.questions = [];
  await page.goto('http://127.0.0.1:4173/services/house-cleaning');
  await page.getByRole('button',{name:'Get Started',exact:true}).click();
  const serviceDialog = page.getByRole('dialog',{name:'Post a service request'});
  await serviceDialog.getByRole('heading',{name:'How can professionals contact you?',exact:true}).waitFor();
  await serviceDialog.getByPlaceholder('Full name',{exact:true}).fill('Modal Customer');
  await serviceDialog.getByPlaceholder('Email address',{exact:true}).fill('modal@example.test');
  await serviceDialog.getByRole('button',{name:'Continue',exact:true}).click();
  await serviceDialog.getByPlaceholder('Enter postcode or town',{exact:true}).fill('Toronto');
  await serviceDialog.getByRole('button',{name:'Continue',exact:true}).click();
  await serviceDialog.getByRole('button',{name:'Continue',exact:true}).click();
  await serviceDialog.getByPlaceholder('Tell professionals exactly what you need...').fill('A cleaning request from the service page');
  await serviceDialog.getByRole('button',{name:'Submit request',exact:true}).click();
  await page.getByRole('heading',{name:/Request submitted/}).waitFor();
  assert.equal(submitted.p_customer_name,'Modal Customer');
  assert.equal(submitted.p_customer_email,'modal@example.test');
  console.log('PASS service-page intake collects required customer details, including categories without questions');
  const claims = Buffer.from(JSON.stringify({sub:userId,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url');
  await page.evaluate(({userId,claims})=>localStorage.setItem('sb-vcaphsvudlseemkalawz-auth-token',JSON.stringify({access_token:`header.${claims}.signature`,refresh_token:'ui-fixture',token_type:'bearer',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,user:{id:userId,email:'customer@example.test',app_metadata:{},user_metadata:{},aud:'authenticated',created_at:new Date().toISOString()}})),{userId,claims});
  await page.goto('http://127.0.0.1:4173/app/leads');
  await page.getByText('21 Matching leads',{exact:true}).waitFor();
  const nextSearch=page.waitForResponse(r=>r.url().endsWith('/rpc/search_marketplace_leads') && r.request().postDataJSON().p_page===1);
  await page.getByRole('button',{name:'Next',exact:true}).click();
  await nextSearch;
  await page.getByText('Page 2 of 2',{exact:true}).waitFor();
  assert.equal(searches.at(-1).p_page,1);
  await page.getByRole('button',{name:'Filter requests',exact:true}).click();
  await page.getByRole('textbox',{name:'Search keywords'}).fill('Toronto');
  await page.getByRole('button',{name:'Apply filter',exact:true}).click();
  await page.getByText('1 Matching lead',{exact:true}).waitFor();
  assert.equal(searches.at(-1).p_page,0);
  assert.equal(searches.at(-1).p_filters.keyword,'Toronto');
  const archiveSearch=page.waitForResponse(r=>r.url().endsWith('/rpc/search_marketplace_leads') && r.request().postDataJSON().p_filters.archived===true);
  await page.getByRole('button',{name:'Archived',exact:true}).click();
  await archiveSearch;
  await page.getByText('Your archived requests',{exact:true}).waitFor();
  assert.equal(searches.at(-1).p_filters.archived,true);
  console.log('PASS marketplace pagination, server filters, and archive views');
  failSearch=true;
  await page.reload();
  await page.getByRole('alert').filter({hasText:'Unable to load requests'}).waitFor();
  await page.getByRole('button',{name:'Try again',exact:true}).click();
  await page.getByText('21 Matching leads',{exact:true}).waitFor();
  console.log('PASS marketplace errors remain visible and retry recovers');
  await page.goto('http://127.0.0.1:4173/app/dashboard');
  await page.getByRole('heading',{name:'Your next opportunity starts here.'}).waitFor();
  await page.getByText('20',{exact:true}).waitFor();
  await page.getByText('7',{exact:true}).waitFor();
  await page.getByText('2',{exact:true}).waitFor();
  await page.getByText('1',{exact:true}).waitFor();
  assert.equal(await page.getByText('Marketplace opportunities',{exact:true}).count(),1);
  console.log('PASS provider overview displays API-driven credits and marketplace metrics');
  await page.goto(`http://127.0.0.1:4173/app/leads/${leadId}`);
  await page.getByRole('button',{name:'Contact C***',exact:true}).waitFor();
  assert.equal(await page.getByRole('link',{name:'customer@example.test',exact:true}).count(),0);
  await page.getByRole('button',{name:'Contact C***',exact:true}).click();
  await page.getByRole('link',{name:'customer@example.test',exact:true}).waitFor();
  await page.getByRole('button',{name:'Send quote',exact:true}).click();
  const dialog=page.getByRole('dialog');
  await dialog.getByPlaceholder('Write your response to the customer…').fill('A detailed cleaning quote');
  await dialog.getByPlaceholder('Min',{exact:true}).fill('100');
  await dialog.getByPlaceholder('Max',{exact:true}).fill('150');
  const quoteResponse = page.waitForResponse(response => response.url().endsWith('/rpc/send_quote'));
  await dialog.getByRole('button',{name:'Send quote',exact:true}).click();
  await quoteResponse;
  await dialog.waitFor({state:'hidden'});
  await page.getByText('A detailed cleaning quote',{exact:true}).first().waitFor();
  assert.equal(sentQuote.p_price_min,100);
  assert.equal(sentQuote.p_price_max,150);
  console.log('PASS provider contact unlock refreshes revealed details and sends a structured quote');
  await page.goto('http://127.0.0.1:4173/my-requests');
  await page.getByRole('button',{name:'View request',exact:true}).click();
  await page.waitForURL(`**/my-requests/${leadId}`);
  await page.getByRole('heading',{name:'House Cleaning',exact:true}).waitFor();
  await page.getByRole('button',{name:'Accept quote',exact:true}).click();
  await page.getByText('accepted',{exact:true}).waitFor();
  console.log('PASS customer quote acceptance refreshes status');
  console.log('PASS customer dashboard opens the existing request instead of creating a new one');
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:4173/app/dashboard');
  await page.getByRole('heading',{name:'Your next opportunity starts here.'}).waitFor();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'Mobile dashboard must not overflow');
  await page.screenshot({path:'/tmp/flexsca-dashboard-mobile.png',fullPage:true});
  assert.deepEqual(errors,[]);
  console.log('PASS mobile layout and no uncaught browser errors');
} finally {
  await browser.close();
  try {process.kill(-server.pid,'SIGTERM');} catch {}
}
