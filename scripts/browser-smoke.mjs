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
let submitted, sentQuote, publishedReview, recoveryRequest, updatedPassword;
const followUps=[], notices=[];
let preference={messages:true,reminders:true}, accountName="Fixture Customer", emailChange, checkoutRequest;
let unlocked = false, quoteStatus = "sent";
let searches = [], failSearch = false;
const errors = [];
const page = await browser.newPage();
page.on('pageerror', e => errors.push(e.message));
await page.route('https://images.unsplash.com/**', route => route.abort());
await page.route('**/auth/v1/**',route=>{ errors.push(`Unexpected auth fixture route: ${new URL(route.request().url()).pathname}`); return route.fulfill({status:500,json:{message:'Unmocked auth request'}}); });
await page.route('**/auth/v1/user**', route => { if(route.request().method()==='PUT') { const input=route.request().postDataJSON(); if(input.password) updatedPassword=input; if(input.email) emailChange=input; } return route.fulfill({status:200,json:{id:userId,email:'customer@example.test',app_metadata:{},user_metadata:{},aud:'authenticated',email_confirmed_at:new Date().toISOString()}}); });
await page.route('**/auth/v1/recover**', route => { recoveryRequest={body:route.request().postDataJSON(),url:route.request().url()}; return route.fulfill({status:200,json:{}}); });
await page.route('**/auth/v1/logout**', route => route.fulfill({status:204,body:''}));
await page.route('**/functions/v1/create-checkout-session',route=>{
  if(route.request().method()==='POST') checkoutRequest=route.request().postDataJSON();
  return route.fulfill({status:200,json:{url:'https://checkout.stripe.com/fixture-checkout'},headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*'}});
});
await page.route('https://checkout.stripe.com/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<h1>Fixture checkout</h1>'}));
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
  if (path === 'customer_review_status') body=quoteStatus==='accepted' ? {providerId:userId,companyName:'Fixture Cleaning',review:publishedReview ? {id:'ffffffff-ffff-4fff-8fff-ffffffffffff',rating:publishedReview.p_rating,text:publishedReview.p_text} : null} : null;
  if (path === 'submit_customer_review') { publishedReview=route.request().postDataJSON(); body='ffffffff-ffff-4fff-8fff-ffffffffffff'; }
  if (path === 'responses') body=sentQuote ? [{id:'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',lead_id:leadId,pro_id:userId,message:sentQuote.p_message,price_min:sentQuote.p_price_min,price_max:sentQuote.p_price_max,availability:null,status:quoteStatus,created_at:new Date().toISOString()}] : [];
  if (path === 'decide_quote') { quoteStatus=route.request().postDataJSON().p_decision; body=true; }
  if (path === 'create_follow_up') {
    const input=route.request().postDataJSON();
    followUps.push({id:'99999999-9999-4999-8999-999999999999',lead_id:input.p_lead_id,remind_at:input.p_remind_at,note:input.p_note,status:'open',created_at:new Date().toISOString(),request_id:input.p_request_id});
    body=followUps.at(-1).id;
  }
  if (path === 'collect_due_follow_ups') {
    body=0;
    for(const item of followUps) if(item.status==='open' && !item.notified && new Date(item.remind_at)<=new Date()) {
      item.notified=true; body++;
      notices.push({id:'88888888-8888-4888-8888-888888888888',lead_id:item.lead_id,title:'A follow-up reminder is due',read_at:null,created_at:new Date().toISOString()});
    }
  }
  if (path === 'reminders') {
    if(route.request().method()==='PATCH') { Object.assign(followUps[0],route.request().postDataJSON()); body=[]; }
    else body=followUps;
    total=1;
  }
  if (path === 'notifications') {
    if(route.request().method()==='PATCH') Object.assign(notices[0],route.request().postDataJSON());
    body=notices;total=notices.filter(n=>!n.read_at).length;
  }
  if (path === 'provider_sales_summary') body={quotedRequests:3,acceptedRequests:1,pendingQuotes:2,declinedQuotes:0,pricedAccepted:1,estimatedMin:100,estimatedMax:150,creditsSpent:6,creditsRefunded:0};
  if (path === 'credit_wallets') body = { balance: 20 };
  if (path === 'provider_reviews') body = [{id:'66666666-6666-4666-8666-666666666666',rating:5,reviewer_name:'Verified Customer',review_text:'Fixture verified feedback',verified:true,source:'flexs',created_at:new Date().toISOString()}];
  if (path === 'provider_profiles') body={user_id:userId,company_name:'Fixture Cleaning',location_private:true,city:'Toronto',province:'ON'};
  if (path === 'notification_preferences') body=preference;
  if (path === 'set_notification_preferences') { const input=route.request().postDataJSON(); preference={messages:input.p_messages,reminders:input.p_reminders}; body=null; }
  if (path === 'profiles') {
    if(route.request().method()==='PATCH') { accountName=route.request().postDataJSON().display_name;body=[]; }
    else body={display_name:accountName,onboarding_completed:true};
  }
  if (path === 'credit_transactions') body=[{id:'77777777-7777-4777-8777-777777777777',delta:-6,reason:'spend_lead',lead_id:leadId,created_at:new Date().toISOString()}];
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
  await page.getByRole('link',{name:/Contacts unlocked/}).getByText('2',{exact:true}).waitFor();
  await page.getByRole('link',{name:/Follow-ups due/}).getByText('1',{exact:true}).waitFor();
  assert.equal(await page.getByText('Marketplace opportunities',{exact:true}).count(),1);
  console.log('PASS provider overview displays API-driven credits and marketplace metrics');
  await page.getByText('33%',{exact:true}).waitFor();
  await page.getByLabel('Quote activity period',{exact:true}).selectOption('all');
  await page.getByText('$100 – $150',{exact:true}).waitFor();
  console.log('PASS provider quote reporting displays request acceptance and CAD estimates');
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
  await page.goto('http://127.0.0.1:4173/app/reminders');
  await page.getByRole('button',{name:'New reminder',exact:true}).click();
  await page.getByRole('combobox').click();
  await page.getByRole('option',{name:/House Cleaning/}).click();
  await page.getByLabel('Reminder date and time',{exact:true}).fill(new Date(Date.now()+86400000).toISOString().slice(0,16));
  await page.getByPlaceholder('Add a note (optional)',{exact:true}).fill('Discuss the cleaning quote');
  const followUpResponse=page.waitForResponse(r=>r.url().endsWith('/rpc/create_follow_up'));
  await page.getByRole('button',{name:'Create reminder',exact:true}).click();
  await followUpResponse;
  await page.getByRole('dialog').waitFor({state:'hidden'});
  await page.getByText('Discuss the cleaning quote',{exact:true}).waitFor();
  assert.equal(followUps[0].lead_id,leadId);
  assert.ok(followUps[0].request_id);
  followUps[0].remind_at=new Date(Date.now()-60000).toISOString();
  await page.goto('http://127.0.0.1:4173/app/notifications');
  await page.getByRole('link',{name:'A follow-up reminder is due',exact:true}).waitFor();
  await page.reload();
  await page.getByRole('link',{name:'A follow-up reminder is due',exact:true}).waitFor();
  assert.equal(notices.length,1);
  await page.getByRole('button',{name:'Updates, 1 unread',exact:true}).waitFor();
  await page.getByRole('button',{name:'Mark read',exact:true}).click();
  await page.getByRole('button',{name:'Updates',exact:true}).waitFor();
  assert.ok(notices[0].read_at);
  console.log('PASS unread update badge refreshes when a notification is read');
  await page.goto('http://127.0.0.1:4173/app/reminders');
  await page.getByRole('button',{name:'Mark reminder done',exact:true}).click();
  await page.getByText('Done',{exact:true}).waitFor();
  console.log('PASS reminder creation from an empty list, due notification deduplication, and completion');
  await page.goto('http://127.0.0.1:4173/app/responses');
  await page.getByRole('heading',{name:'House Cleaning',exact:true}).waitFor();
  console.log('PASS newly unlocked conversations remain visible without a custom status');
  await page.goto('http://127.0.0.1:4173/my-requests');
  await page.getByRole('button',{name:'View request',exact:true}).click();
  await page.waitForURL(`**/my-requests/${leadId}`);
  await page.getByRole('heading',{name:'House Cleaning',exact:true}).waitFor();
  await page.getByRole('button',{name:'Accept quote',exact:true}).click();
  await page.getByText('accepted',{exact:true}).waitFor();
  console.log('PASS customer quote acceptance refreshes status');
  await page.getByRole('heading',{name:'Review Fixture Cleaning',exact:true}).waitFor();
  await page.getByLabel('Rating',{exact:true}).selectOption('4');
  await page.getByLabel('Your experience',{exact:true}).fill('A clear and helpful professional experience.');
  await page.getByRole('button',{name:'Publish review',exact:true}).click();
  await page.getByRole('heading',{name:'Your published review',exact:true}).waitFor();
  assert.equal(publishedReview.p_rating,4);
  assert.equal(publishedReview.p_lead_id,leadId);
  await page.getByText('4 / 5 · Verified FLEXS customer',{exact:true}).waitFor();
  console.log('PASS accepted quote enables a verified customer review and refreshes published feedback');
  console.log('PASS customer dashboard opens the existing request instead of creating a new one');
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:4173/app/dashboard');
  await page.getByRole('heading',{name:'Your next opportunity starts here.'}).waitFor();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'Mobile dashboard must not overflow');
  await page.screenshot({path:'/tmp/flexsca-dashboard-mobile.png',fullPage:true});
  await page.goto('http://127.0.0.1:4173/app/settings');
  await page.getByRole('switch',{name:'Message notifications',exact:true}).click();
  await page.getByRole('switch',{name:'Message notifications',exact:true}).waitFor();
  await page.waitForFunction(()=>document.querySelector('[aria-label="Message notifications"]')?.getAttribute('aria-checked')==='false');
  await page.reload();
  await page.waitForFunction(()=>document.querySelector('[aria-label="Message notifications"]')?.getAttribute('aria-checked')==='false');
  assert.equal(preference.messages,false);
  console.log('PASS notification preferences are saved and survive a reload');
  await page.getByRole('button',{name:'Reviews All your reviews in one place',exact:true}).click();
  await page.getByRole('heading',{name:'Customer reviews',exact:true}).waitFor();
  await page.getByText('Verified FLEXS customer',{exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Delete imported review',exact:true}).count(),0);
  assert.equal(await page.getByRole('link',{name:'View public profile',exact:true}).getAttribute('href'),`/profile/${userId}`);
  console.log('PASS review settings open the requested section and protect verified feedback');
  await page.goto('http://127.0.0.1:4173/app/settings');
  await page.getByRole('button').filter({hasText:'Account details'}).click();
  await page.waitForURL('**/app/settings/account');
  await page.getByLabel('Account name',{exact:true}).fill('Updated Fixture Customer');
  const profileSaved=page.waitForResponse(r=>r.url().includes('/rest/v1/profiles') && r.request().method()==='PATCH');
  await page.getByRole('button',{name:'Save account name',exact:true}).click();
  await profileSaved;
  assert.equal(accountName,'Updated Fixture Customer');
  await page.getByLabel('New email address',{exact:true}).fill('updated@example.test');
  const emailResponse=page.waitForResponse(r=>new URL(r.url()).pathname.endsWith('/auth/v1/user') && r.request().method()==='PUT');
  await page.getByRole('button',{name:'Request email change',exact:true}).click();
  await emailResponse;
  assert.equal(emailChange.email,'updated@example.test');
  console.log('PASS account settings save the name and request an Auth-confirmed email change');
  await page.goto('http://127.0.0.1:4173/app/settings/credits');
  await page.getByText('Current balance',{exact:true}).waitFor();
  await page.getByText('Lead unlocked',{exact:true}).waitFor();
  await page.getByRole('button',{name:/20 credits \$19/}).click();
  await page.waitForURL('https://checkout.stripe.com/fixture-checkout');
  assert.equal(checkoutRequest.packageId,'pack_20');
  assert.equal(checkoutRequest.origin,'http://127.0.0.1:4173');
  console.log('PASS credit wallet displays history and starts a fixture Stripe checkout without charging');
  await page.goto('http://127.0.0.1:4173/auth/login?next=%2Fmy-requests');
  await page.getByPlaceholder('Email',{exact:true}).fill('customer@example.test');
  await page.getByRole('button',{name:'Forgot your password?',exact:true}).click();
  await page.getByRole('heading',{name:'Reset your password',exact:true}).waitFor();
  await page.getByRole('button',{name:'Send reset link',exact:true}).click();
  await page.getByRole('heading',{name:'Check your email',exact:true}).waitFor();
  assert.equal(recoveryRequest.body.email,'customer@example.test');
  const redirect=new URL(new URL(recoveryRequest.url).searchParams.get('redirect_to'));
  assert.equal(redirect.pathname,'/auth/reset-password');
  assert.equal(redirect.searchParams.get('next'),'/my-requests');
  await page.goto('http://127.0.0.1:4173/auth/reset-password?next=%2Fmy-requests');
  await page.getByLabel('New password',{exact:true}).fill('Fixture password 2026!');
  await page.getByLabel('Confirm new password',{exact:true}).fill('Mismatch password');
  await page.getByRole('button',{name:'Update password',exact:true}).click();
  await page.getByRole('alert').filter({hasText:'The passwords do not match.'}).waitFor();
  assert.equal(updatedPassword,undefined);
  await page.getByLabel('Confirm new password',{exact:true}).fill('Fixture password 2026!');
  await page.getByRole('button',{name:'Update password',exact:true}).click();
  await page.getByRole('heading',{name:'Password updated',exact:true}).waitFor();
  assert.equal(updatedPassword.password,'Fixture password 2026!');
  await page.getByRole('link',{name:'Go to login',exact:true}).click();
  await page.waitForURL('**/auth/login?next=%2Fmy-requests');
  await page.goto('http://127.0.0.1:4173/auth/reset-password');
  await page.getByRole('link',{name:'Request a new reset link',exact:true}).waitFor();
  console.log('PASS password recovery request, confirmation validation, password update, logout, and expired-link fallback');
  assert.deepEqual(errors,[]);
  console.log('PASS mobile layout and no uncaught browser errors');
} finally {
  await browser.close();
  try {process.kill(-server.pid,'SIGTERM');} catch {}
}
