// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const db = new PGlite();
const buyer = '11111111-1111-4111-8111-111111111111';
const pro = '22222222-2222-4222-8222-222222222222';
const other = '33333333-3333-4333-8333-333333333333';
let lead: string;
async function asRole(role: string, uid = '') {
  await db.exec(`RESET ROLE; SET ROLE ${role}; SELECT set_config('request.jwt.claim.sub', '${uid}', false);`);
}
async function scalar(sql: string) {
  const result = await db.query(sql);
  return Object.values(result.rows[0] ?? {})[0];
}

beforeAll(async () => {
  // Reproduce Supabase's platform schemas/grants; apply EVERY real migration.
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth; CREATE SCHEMA storage;
    CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,raw_user_meta_data jsonb DEFAULT '{}',email_confirmed_at timestamptz);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean);
    CREATE TABLE storage.objects(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),bucket_id text,name text);
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    CREATE FUNCTION storage.foldername(text) RETURNS text[] LANGUAGE sql AS $$ SELECT string_to_array($1,'/') $$;
    CREATE PUBLICATION supabase_realtime;
    GRANT USAGE ON SCHEMA public,auth TO anon,authenticated,service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon,authenticated,service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon,authenticated,service_role;
  `);
  for (const file of readdirSync('supabase/migrations').filter(f => f.endsWith('.sql')).sort()) {
    try { await db.exec(readFileSync(`supabase/migrations/${file}`, 'utf8')); }
    catch (e) { throw new Error(`Migration ${file}: ${e instanceof Error ? e.message : e}`); }
  }
  await db.exec(`INSERT INTO auth.users(id,email,email_confirmed_at) VALUES
    ('${buyer}','buyer@example.test',now()),('${pro}','pro@example.test',now()),('${other}','other@example.test',now());`);
  await asRole('anon');
  const category = await scalar('SELECT name FROM service_categories WHERE is_active LIMIT 1');
  const result = await db.query<{ id: string }>(`SELECT submit_lead($1,'Toronto, M1A1A1','Toronto','M1A1A1','Buyer','buyer@example.test','4165550123','Private details','{}',false,'44444444-4444-4444-8444-444444444444') AS id`, [category]);
  lead = result.rows[0].id;
}, 60_000);
afterAll(async () => { await db.close(); });

describe('marketplace database release integrity', () => {
  it('requires authentication for marketplace browsing', async () => {
    await asRole('anon');
    await expect(db.query('SELECT * FROM leads_safe')).rejects.toThrow();
  });
  it('lists new leads without leaking contacts, free text or exact address', async () => {
    await asRole('authenticated', pro);
    const { rows } = await db.query(`SELECT * FROM leads_safe WHERE id='${lead}'`);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ customer_email: null, customer_phone: null, details: null, answers: {}, postal_code: null, location_text: 'Toronto' });
    expect(await scalar(`SELECT count(*) FROM leads WHERE id='${lead}'`)).toBe(0);
  });
  it('cannot bypass payment by setting contacted or fabricating a purchase', async () => {
    await asRole('authenticated', pro);
    await db.exec(`INSERT INTO lead_agent_state(lead_id,agent_id) VALUES('${lead}','${pro}');`);
    await expect(db.exec(`UPDATE lead_agent_state SET contacted=true WHERE lead_id='${lead}'`)).rejects.toThrow();
    await expect(db.exec(`INSERT INTO lead_purchases(user_id,lead_id,cost) VALUES('${pro}','${lead}',1)`)).rejects.toThrow();
    expect(await scalar(`SELECT count(*) FROM leads WHERE id='${lead}'`)).toBe(0);
    expect(await scalar(`SELECT count(*) FROM lead_messages WHERE lead_id='${lead}'`)).toBe(0);
  });
  it('unlocks once, records purchase and transaction, and returns contacts', async () => {
    await asRole('authenticated', pro);
    const before = Number(await scalar(`SELECT balance FROM credit_wallets WHERE user_id='${pro}'`));
    const result = await scalar(`SELECT contact_lead('${lead}')`) as { credits_spent: number; customer_email: string };
    expect(result.customer_email).toBe('buyer@example.test');
    expect(Number(await scalar(`SELECT balance FROM credit_wallets WHERE user_id='${pro}'`))).toBe(before-result.credits_spent);
    const repeat = await scalar(`SELECT contact_lead('${lead}')`);
    expect(repeat).toMatchObject({ already_contacted: true, credits_spent: 0 });
    expect(await scalar(`SELECT count(*) FROM lead_purchases WHERE lead_id='${lead}'`)).toBe(1);
    expect(await scalar(`SELECT customer_email FROM leads_safe WHERE id='${lead}'`)).toBe('buyer@example.test');
  });
  it('isolates professional threads and disallows forged sender IDs', async () => {
    await asRole('authenticated', pro);
    await db.exec(`INSERT INTO lead_messages(lead_id,agent_id,sender_type,message) VALUES('${lead}','${pro}','pro','Private quote');`);
    await expect(db.exec(`INSERT INTO lead_messages(lead_id,agent_id,sender_type,message) VALUES('${lead}','${other}','pro','Forged quote')`)).rejects.toThrow();
    await asRole('authenticated', other);
    await db.query(`SELECT contact_lead('${lead}')`);
    expect(await scalar(`SELECT count(*) FROM lead_messages WHERE message='Private quote'`)).toBe(0);
    expect(await scalar(`SELECT first_to_respond FROM lead_agent_state WHERE lead_id='${lead}'`)).toBe(false);
  });
  it('claims only verified-email customer requests and queues attribution once', async () => {
    await asRole('authenticated', other);
    await db.query('SELECT claim_customer_leads()');
    expect(await scalar(`SELECT count(*) FROM leads WHERE customer_user_id='${other}'`)).toBe(0);
    await asRole('authenticated', buyer);
    expect(await scalar('SELECT claim_customer_leads()')).toBe(1);
    expect(await scalar('SELECT claim_customer_leads()')).toBe(0);
    expect(await scalar(`SELECT count(*) FROM leads WHERE customer_user_id='${buyer}'`)).toBe(1);
    await asRole('service_role');
    expect(await scalar('SELECT count(*) FROM takatak_attribution_outbox')).toBe(1);
  });
  it('does not allow browser access to payment fulfillment or attribution delivery', async () => {
    await asRole('authenticated', pro);
    await expect(db.query(`SELECT fulfill_credit_purchase('${pro}','invented',null,120,7900,'cad')`)).rejects.toThrow();
    await expect(db.query('SELECT claim_attribution_batch()')).rejects.toThrow();
  });
  it('checks recorded checkout values and fulfills a payment exactly once', async () => {
    await asRole('service_role');
    await db.exec(`INSERT INTO credit_purchases(user_id,stripe_checkout_session_id,credits,amount_cents) VALUES('${pro}','cs_test',20,1900);`);
    await expect(db.query(`SELECT fulfill_credit_purchase('${pro}','cs_test','pi_test',120,1900,'cad')`)).rejects.toThrow('Checkout does not match purchase');
    const before = Number(await scalar(`SELECT balance FROM credit_wallets WHERE user_id='${pro}'`));
    expect(await scalar(`SELECT fulfill_credit_purchase('${pro}','cs_test','pi_test',20,1900,'cad')`)).toBe(true);
    expect(await scalar(`SELECT fulfill_credit_purchase('${pro}','cs_test','pi_test',20,1900,'cad')`)).toBe(false);
    expect(Number(await scalar(`SELECT balance FROM credit_wallets WHERE user_id='${pro}'`))).toBe(before+20);
  });
  it('leases jobs and rejects stale completion attempts', async () => {
    await asRole('service_role');
    const { rows } = await db.query<{ id: string; lease_id: string }>('SELECT * FROM claim_attribution_batch(5)');
    expect(rows).toHaveLength(1);
    expect((await db.query('SELECT * FROM claim_attribution_batch(5)')).rows).toHaveLength(0);
    expect(await scalar(`SELECT complete_attribution('${rows[0].id}','55555555-5555-4555-8555-555555555555',200,true)`)).toBe(false);
    expect(await scalar(`SELECT complete_attribution('${rows[0].id}','${rows[0].lease_id}',200,true)`)).toBe(true);
  });
  it('creates a structured quote, notifies the buyer, and restricts acceptance', async () => {
    await asRole('authenticated', pro);
    await expect(db.query(`SELECT send_quote('${lead}','Invalid',100,50,'today')`)).rejects.toThrow('Invalid quote');
    const quote = await scalar(`SELECT send_quote('${lead}','Detailed proposal',100,150,'this_week')`);
    await asRole('authenticated', other);
    await expect(db.query(`SELECT decide_quote('${quote}','accepted')`)).rejects.toThrow('Request not found');
    await asRole('authenticated', buyer);
    expect(await scalar(`SELECT count(*) FROM responses WHERE lead_id='${lead}'`)).toBe(1);
    expect(await scalar(`SELECT count(*) FROM notifications WHERE user_id='${buyer}'`)).toBe(1);
    expect(await scalar(`SELECT decide_quote('${quote}','accepted')`)).toBe(true);
    expect(await scalar(`SELECT decide_quote('${quote}','accepted')`)).toBe(false);
    expect(await scalar(`SELECT archived FROM leads WHERE id='${lead}'`)).toBe(true);
    await asRole('authenticated', pro);
    expect(await scalar(`SELECT count(*) FROM notifications WHERE user_id='${pro}'`)).toBe(1);
    await expect(db.query(`SELECT send_quote('${lead}','Too late',100,150,'today')`)).rejects.toThrow('Quote not available');
  });
  it('requires server-managed administrator membership and refunds exactly once', async () => {
    await asRole('authenticated', pro);
    await expect(db.query('SELECT admin_lead_queue()')).rejects.toThrow('Forbidden');
    await expect(db.exec(`INSERT INTO platform_admins(user_id) VALUES('${pro}')`)).rejects.toThrow();
    const refundId = await scalar(`SELECT request_lead_refund('${lead}','The supplied contact information is invalid')`);
    const before = Number(await scalar(`SELECT balance FROM credit_wallets WHERE user_id='${pro}'`));
    await expect(db.query(`SELECT admin_decide_refund('${refundId}',true)`)).rejects.toThrow('Forbidden');
    await asRole('service_role');
    await db.exec(`INSERT INTO platform_admins(user_id) VALUES('${other}')`);
    const cost = Number(await scalar(`SELECT cost FROM lead_purchases WHERE lead_id='${lead}' AND user_id='${pro}'`));
    await asRole('authenticated', other);
    expect(await scalar(`SELECT admin_decide_refund('${refundId}',true)`)).toBe(true);
    expect(await scalar(`SELECT admin_decide_refund('${refundId}',true)`)).toBe(false);
    await asRole('authenticated', pro);
    expect(Number(await scalar(`SELECT balance FROM credit_wallets WHERE user_id='${pro}'`))).toBe(before+cost);
  });
  it('protects reputation and verification fields from merchant edits', async () => {
    await asRole('authenticated', pro);
    await db.exec(`INSERT INTO merchant_profiles(user_id) VALUES('${pro}')`);
    await db.exec(`UPDATE merchant_profiles SET business_name='Example business' WHERE user_id='${pro}'`);
    await expect(db.exec(`UPDATE merchant_profiles SET verified=true,rating=5 WHERE user_id='${pro}'`)).rejects.toThrow();
  });
  it('respects the provider private-location setting at the API boundary', async () => {
    await asRole('authenticated', pro);
    await db.exec(`INSERT INTO provider_profiles(user_id,company_name,city,province,location_private) VALUES('${pro}','Business','Private city','ON',true)`);
    await asRole('anon');
    expect(await scalar('SELECT count(*) FROM provider_profiles')).toBe(0);
    expect(await scalar(`SELECT city FROM provider_profiles_public WHERE user_id='${pro}'`)).toBeNull();
    expect(await scalar(`SELECT company_name FROM provider_profiles_public WHERE user_id='${pro}'`)).toBe('Business');
  });
  it('rolls back an unlock when credits are insufficient', async () => {
    await asRole('service_role');
    await db.exec(`UPDATE credit_wallets SET balance=0 WHERE user_id='${buyer}'; UPDATE leads SET archived=false,status='new' WHERE id='${lead}';`);
    await asRole('authenticated', buyer);
    await expect(db.query(`SELECT contact_lead('${lead}')`)).rejects.toThrow('INSUFFICIENT_CREDITS');
    expect(await scalar(`SELECT count(*) FROM lead_purchases WHERE user_id='${buyer}'`)).toBe(0);
    expect(await scalar(`SELECT balance FROM credit_wallets WHERE user_id='${buyer}'`)).toBe(0);
  });
  it('limits intake abuse by mailbox and rejects oversized personal data', async () => {
    await asRole('anon');
    const category = await scalar('SELECT name FROM service_categories WHERE is_active LIMIT 1');
    for (let n=0;n<3;n++) await db.query(`SELECT submit_lead($1,'Toronto',null,null,'Customer','limited@example.test')`,[category]);
    await expect(db.query(`SELECT submit_lead($1,'Toronto',null,null,'Customer','LIMITED@example.test')`,[category])).rejects.toThrow('Too many requests');
    await expect(db.query(`SELECT submit_lead($1,'Toronto',null,null,$2,'another@example.test')`,[category,'x'.repeat(101)])).rejects.toThrow('Invalid request details');
  });
  it('validates intake on the server and protects public review email', async () => {
    await asRole('anon');
    await expect(db.query(`SELECT submit_lead('Invented','Toronto',null,null,'Buyer','invalid')`)).rejects.toThrow();
    await asRole('service_role');
    await db.exec(`INSERT INTO provider_reviews(user_id,reviewer_name,reviewer_email,rating) VALUES('${pro}','Customer','private@example.test',5)`);
    await asRole('anon');
    expect(await scalar('SELECT count(*) FROM provider_reviews')).toBe(0);
    const { rows } = await db.query('SELECT * FROM provider_reviews_public');
    expect(rows).toHaveLength(1);
    expect(rows[0]).not.toHaveProperty('reviewer_email');
  });
});


describe('paginated marketplace search', () => {
  let searchLead: string;
  let secondLead: string;
  beforeAll(async () => {
    await asRole('service_role');
    const { rows } = await db.query<{id:string}>(`INSERT INTO leads(category,location_text,city,customer_name,customer_email,details,created_at,is_urgent)
      VALUES ('Search Fixture','Secret street','Ottawa','Privatecustomer','secretsearch@example.test','Secretphrase hidden description',now(),true),
      ('Search Fixture','Another secret street','Ottawa','Anotherprivate','othersearch@example.test','Other confidential description',now(),false)
      RETURNING id`);
    [searchLead,secondLead]=rows.map(r=>r.id);
  });
  it('requires authenticated access and bounds page sizes', async () => {
    await asRole('anon');
    await expect(db.query('SELECT search_marketplace_leads()')).rejects.toThrow();
    await asRole('authenticated',pro);
    await expect(db.query(`SELECT search_marketplace_leads('{}',0,51)`)).rejects.toThrow('Invalid search parameters');
    await expect(db.query(`SELECT search_marketplace_leads('{}',-1,20)`)).rejects.toThrow('Invalid search parameters');
  });
  it('returns stable nonoverlapping pages and a complete result count', async () => {
    await asRole('authenticated',pro);
    const first=await scalar(`SELECT search_marketplace_leads('{"services":["Search Fixture"]}',0,1)`) as {total:number;leads:{id:string}[];services:string[]};
    const second=await scalar(`SELECT search_marketplace_leads('{"services":["Search Fixture"]}',1,1)`) as typeof first;
    expect(first.total).toBe(2); expect(first.leads).toHaveLength(1); expect(second.leads).toHaveLength(1);
    expect(first.leads[0].id).not.toBe(second.leads[0].id);
    expect(first.services).toContain('Search Fixture');
  });
  it('does not disclose private details through search results or counts', async () => {
    await asRole('authenticated',pro);
    for(const keyword of ['Secretphrase','Privatecustomer','secretsearch']) {
      const {rows}=await db.query<{result:{total:number}}>('SELECT search_marketplace_leads($1::jsonb) AS result',[JSON.stringify({keyword})]);
      expect(rows[0].result.total).toBe(0);
    }
  });
  it('applies urgent and yesterday filters before pagination', async () => {
    await asRole('authenticated',pro);
    const urgent=await scalar(`SELECT search_marketplace_leads('{"services":["Search Fixture"],"urgentOnly":true}')`) as {total:number;leads:{id:string}[]};
    expect(urgent.total).toBe(1); expect(urgent.leads[0].id).toBe(searchLead);
    const yesterday=await scalar(`SELECT search_marketplace_leads('{"services":["Search Fixture"],"timeRange":"yesterday"}')`) as {total:number};
    expect(yesterday.total).toBe(0);
  });
  it('isolates archive filters to the current professional', async () => {
    await asRole('authenticated',pro);
    await db.exec(`INSERT INTO lead_agent_state(lead_id,agent_id) VALUES('${secondLead}','${pro}'); UPDATE lead_agent_state SET is_archived=true WHERE lead_id='${secondLead}'`);
    const archived=await scalar(`SELECT search_marketplace_leads('{"services":["Search Fixture"],"archived":true}')`) as {total:number;leads:{id:string}[]};
    expect(archived.total).toBe(1); expect(archived.leads[0].id).toBe(secondLead);
    await asRole('authenticated',other);
    const otherArchive=await scalar(`SELECT search_marketplace_leads('{"services":["Search Fixture"],"archived":true}')`) as {total:number};
    expect(otherArchive.total).toBe(0);
  });
});

describe('verified customer reviews', () => {
  let request: string;
  let review: string;
  beforeAll(async () => {
    await asRole('service_role');
    request=String(await scalar(`INSERT INTO leads(category,location_text,customer_name,customer_user_id) VALUES('Review Fixture','Toronto','Customer PrivateSurname','${buyer}') RETURNING id`));
  });
  it('rejects anonymous, unrelated, and premature reviews', async () => {
    await asRole('anon');
    await expect(db.query(`SELECT submit_customer_review('${request}',5,'Great professional experience')`)).rejects.toThrow();
    await asRole('authenticated',other);
    await expect(db.query(`SELECT customer_review_status('${request}')`)).rejects.toThrow('Request not found');
    await expect(db.query(`SELECT submit_customer_review('${request}',5,'Great professional experience')`)).rejects.toThrow('Request not found');
    await asRole('authenticated',buyer);
    expect(await scalar(`SELECT customer_review_status('${request}')`)).toBeNull();
    await expect(db.query(`SELECT submit_customer_review('${request}',5,'Great professional experience')`)).rejects.toThrow('Accept a professional quote');
  });
  it('records one immutable review for a confirmed customer and accepted quote', async () => {
    await asRole('service_role');
    await db.exec(`INSERT INTO responses(lead_id,pro_id,message,status) VALUES('${request}','${pro}','Accepted quote','accepted')`);
    await asRole('authenticated',buyer);
    await expect(db.query(`SELECT submit_customer_review('${request}',6,'Great professional experience')`)).rejects.toThrow('Invalid review');
    await expect(db.query(`SELECT submit_customer_review('${request}',5,'Short')`)).rejects.toThrow('Invalid review');
    review=String(await scalar(`SELECT submit_customer_review('${request}',4,'A thoughtful professional experience')`));
    expect(await scalar(`SELECT submit_customer_review('${request}',1,'Duplicate submission with different text')`)).toBe(review);
    const status=await scalar(`SELECT customer_review_status('${request}')`) as {providerId:string;review:{rating:number}};
    expect(status.providerId).toBe(pro); expect(status.review.rating).toBe(4);
    await asRole('authenticated',pro);
    expect(await scalar(`SELECT count(*) FROM notifications WHERE lead_id='${request}'`)).toBe(1);
  });
  it('requires a currently confirmed email even for a request owner', async () => {
    await asRole('service_role');
    await db.exec(`RESET ROLE; UPDATE auth.users SET email_confirmed_at=NULL WHERE id='${buyer}'`);
    await asRole('authenticated',buyer);
    await expect(db.query(`SELECT submit_customer_review('${request}',4,'A thoughtful professional experience')`)).rejects.toThrow('Request not found');
    await expect(db.query(`SELECT customer_review_status('${request}')`)).rejects.toThrow('Request not found');
    await asRole('service_role');
    await db.exec(`RESET ROLE; UPDATE auth.users SET email_confirmed_at=now() WHERE id='${buyer}'`);
  });
  it('prevents the professional deleting verified reviews and hides customer identifiers publicly', async () => {
    await asRole('authenticated',pro);
    await db.exec(`DELETE FROM provider_reviews WHERE id='${review}'`);
    expect(await scalar(`SELECT count(*) FROM provider_reviews WHERE id='${review}'`)).toBe(1);
    await asRole('anon');
    const {rows}=await db.query(`SELECT * FROM provider_reviews_public WHERE id='${review}'`);
    expect(rows[0]).toMatchObject({verified:true,source:'flexs',reviewer_name:'Customer'});
    expect(rows[0]).not.toHaveProperty('lead_id'); expect(rows[0]).not.toHaveProperty('reviewer_email');
  });
});

describe('follow-up workflow and due notifications', () => {
  let reminder: string;
  const requestKey='99999999-9999-4999-8999-999999999999';
  let when: string;
  it('validates dates and notes, and disallows raw browser inserts', async () => {
    await asRole('anon');
    await expect(db.query('SELECT collect_due_follow_ups()')).rejects.toThrow();
    await asRole('authenticated',pro);
    await expect(db.query(`SELECT create_follow_up('${lead}',now()-interval '1 hour')`)).rejects.toThrow('Invalid reminder');
    await expect(db.query(`SELECT create_follow_up('${lead}',now()+interval '400 days')`)).rejects.toThrow('Invalid reminder');
    await expect(db.query(`SELECT create_follow_up('${lead}',now()+interval '1 hour',repeat('x',2001))`)).rejects.toThrow('Invalid reminder');
    await expect(db.exec(`INSERT INTO reminders(user_id,lead_id,remind_at) VALUES('${pro}','${lead}',now())`)).rejects.toThrow();
  });
  it('creates a reminder for an unlocked, unassigned request exactly once', async () => {
    await asRole('authenticated',pro);
    when=new Date(Date.now()+3600000).toISOString();
    const args=[lead,when,'Follow up privately',requestKey];
    const first=await db.query<{id:string}>('SELECT create_follow_up($1,$2,$3,$4) AS id',args);
    reminder=first.rows[0].id;
    const repeated=await db.query<{id:string}>('SELECT create_follow_up($1,$2,$3,$4) AS id',args);
    expect(repeated.rows[0].id).toBe(reminder);
    expect(await scalar(`SELECT count(*) FROM reminders WHERE request_id='${requestKey}'`)).toBe(1);
    await expect(db.query('SELECT create_follow_up($1,$2,$3,$4)',[lead,when,'Changed request',requestKey])).rejects.toThrow('Reminder request already used');
    await expect(db.exec(`UPDATE reminders SET user_id='${other}' WHERE id='${reminder}'`)).rejects.toThrow();
  });
  it('collects only owned due reminders and never duplicates a notification', async () => {
    await asRole('service_role');
    await db.exec(`UPDATE reminders SET remind_at=now()-interval '1 minute' WHERE id='${reminder}';
      INSERT INTO reminders(user_id,lead_id,remind_at,note) VALUES('${other}','${lead}',now()-interval '1 minute','Other private note');`);
    await asRole('authenticated',pro);
    expect(await scalar('SELECT collect_due_follow_ups()')).toBe(1);
    expect(await scalar('SELECT collect_due_follow_ups()')).toBe(0);
    expect(await scalar(`SELECT count(*) FROM notifications WHERE title='A follow-up reminder is due'`)).toBe(1);
    expect(await scalar(`SELECT count(*) FROM reminders WHERE user_id='${other}'`)).toBe(0);
    await asRole('authenticated',other);
    expect(await scalar('SELECT collect_due_follow_ups()')).toBe(1);
  });
  it('skips completed reminders and protects notification delivery fields', async () => {
    await asRole('service_role');
    const id=String(await scalar(`INSERT INTO reminders(user_id,lead_id,remind_at,status) VALUES('${pro}','${lead}',now()-interval '1 hour','done') RETURNING id`));
    await asRole('authenticated',pro);
    expect(await scalar('SELECT collect_due_follow_ups()')).toBe(0);
    await expect(db.exec(`UPDATE reminders SET notified_at=now() WHERE id='${id}'`)).rejects.toThrow();
    await db.exec(`UPDATE reminders SET status='done' WHERE id='${reminder}'`);
    expect(await scalar(`SELECT status FROM reminders WHERE id='${reminder}'`)).toBe('done');
  });
});

describe('provider quote and credit reporting', () => {
  let request: string;
  it('requires authentication and validates reporting dates', async () => {
    await asRole('anon');
    await expect(db.query('SELECT provider_sales_summary()')).rejects.toThrow();
    await asRole('authenticated',pro);
    await expect(db.query(`SELECT provider_sales_summary(now()+interval '1 day')`)).rejects.toThrow('Invalid reporting period');
  });
  it('counts quoted requests once and isolates estimates between providers', async () => {
    await asRole('service_role');
    request=String(await scalar(`INSERT INTO leads(category,location_text) VALUES('Reporting Fixture','Toronto') RETURNING id`));
    await db.exec(`INSERT INTO responses(lead_id,pro_id,message,price_min,status) VALUES
      ('${request}','${pro}','First pending quote',200,'sent'),('${request}','${pro}','Second pending quote',300,'sent'),
      ('${request}','${other}','Other private quote',91000,'accepted');`);
    await asRole('authenticated',pro);
    const summary=await scalar('SELECT provider_sales_summary()') as {quotedRequests:number;acceptedRequests:number;pendingQuotes:number;pricedAccepted:number;estimatedMin:number;estimatedMax:number};
    expect(summary).toMatchObject({quotedRequests:3,acceptedRequests:2,pendingQuotes:2,pricedAccepted:1,estimatedMin:100,estimatedMax:150});
    await asRole('authenticated',other);
    const otherSummary=await scalar('SELECT provider_sales_summary()') as typeof summary;
    expect(otherSummary).toMatchObject({quotedRequests:1,acceptedRequests:1,estimatedMin:91000,estimatedMax:91000});
  });
  it('reports actual owned credit movements and excludes older quote cohorts', async () => {
    await asRole('authenticated',pro);
    const summary=await scalar('SELECT provider_sales_summary()') as {creditsSpent:number;creditsRefunded:number};
    expect(summary.creditsSpent).toBe(Number(await scalar(`SELECT COALESCE(sum(-delta),0) FROM credit_transactions WHERE reason='spend_lead' AND delta<0`)));
    expect(summary.creditsRefunded).toBe(Number(await scalar(`SELECT COALESCE(sum(delta),0) FROM credit_transactions WHERE reason='refund' AND delta>0`)));
    await asRole('service_role');
    await db.exec(`UPDATE responses SET created_at=now()-interval '40 days' WHERE pro_id='${pro}' AND lead_id='${request}'`);
    await asRole('authenticated',pro);
    const recent=await scalar(`SELECT provider_sales_summary(now()-interval '30 days')`) as {quotedRequests:number;pendingQuotes:number};
    expect(recent).toMatchObject({quotedRequests:2,pendingQuotes:0});
  });
});

describe('saved in-app notification preferences', () => {
  it('persists only the current account preferences', async () => {
    await asRole('authenticated',pro);
    await db.query('SELECT set_notification_preferences(false,false)');
    expect(await scalar(`SELECT messages FROM notification_preferences WHERE user_id='${pro}'`)).toBe(false);
    await expect(db.exec(`INSERT INTO notification_preferences(user_id) VALUES('${other}')`)).rejects.toThrow();
    await asRole('authenticated',other);
    expect(await scalar(`SELECT count(*) FROM notification_preferences WHERE user_id='${pro}'`)).toBe(0);
    await asRole('anon');
    await expect(db.query('SELECT set_notification_preferences(true,true)')).rejects.toThrow();
  });
  it('mutes future recipient message notices without suppressing the private conversation', async () => {
    await asRole('authenticated',pro);
    const before=Number(await scalar(`SELECT count(*) FROM notifications`));
    expect(await scalar(`SELECT can_customer_message_lead('${lead}','${pro}')`)).toBe(false);
    await asRole('authenticated',buyer);
    await expect(db.exec(`INSERT INTO lead_messages(lead_id,agent_id,sender_type,message) VALUES('${lead}','${buyer}','customer','An unpaid fabricated conversation')`)).rejects.toThrow();
    await db.exec(`INSERT INTO lead_messages(lead_id,agent_id,sender_type,message) VALUES('${lead}','${pro}','customer','A message with notifications muted')`);
    await asRole('authenticated',pro);
    expect(Number(await scalar('SELECT count(*) FROM notifications'))).toBe(before);
    expect(await scalar(`SELECT count(*) FROM lead_messages WHERE message='A message with notifications muted'`)).toBe(1);
    await db.query('SELECT set_notification_preferences(true,false)');
    await asRole('authenticated',buyer);
    await db.exec(`INSERT INTO lead_messages(lead_id,agent_id,sender_type,message) VALUES('${lead}','${pro}','customer','An unmuted message')`);
    await asRole('authenticated',pro);
    expect(Number(await scalar('SELECT count(*) FROM notifications'))).toBe(before+1);
  });
  it('retains due reminders while muted and delivers once after re-enabling', async () => {
    await asRole('service_role');
    await db.exec(`INSERT INTO reminders(user_id,lead_id,remind_at) VALUES('${pro}','${lead}',now()-interval '1 minute')`);
    await asRole('authenticated',pro);
    expect(await scalar('SELECT collect_due_follow_ups()')).toBe(0);
    await db.query('SELECT set_notification_preferences(true,true)');
    expect(await scalar('SELECT collect_due_follow_ups()')).toBe(1);
    expect(await scalar('SELECT collect_due_follow_ups()')).toBe(0);
  });
});

describe('private support tickets', () => {
  let ticket: string;
  const key='12121212-1212-4212-8212-121212121212';
  it('validates requests and creates one private conversation per submission', async () => {
    await asRole('anon');
    await expect(db.query(`SELECT create_support_ticket('Help','general','A private support request','${key}')`)).rejects.toThrow();
    await asRole('authenticated',buyer);
    await expect(db.query(`SELECT create_support_ticket('x','general','A private support request','${key}')`)).rejects.toThrow('Invalid support request');
    ticket=String(await scalar(`SELECT create_support_ticket('Account help','account','A private support request','${key}')`));
    expect(await scalar(`SELECT create_support_ticket('Account help','account','A private support request','${key}')`)).toBe(ticket);
    expect(await scalar('SELECT count(*) FROM support_tickets')).toBe(1);
    expect(await scalar('SELECT count(*) FROM support_messages')).toBe(1);
    await expect(db.query(`SELECT create_support_ticket('Account help','account','Changed private support request','${key}')`)).rejects.toThrow('Support request already used');
  });
  it('prevents unrelated users reading, replying, changing status, or forging staff messages', async () => {
    await asRole('authenticated',pro);
    expect(await scalar('SELECT count(*) FROM support_tickets')).toBe(0);
    expect(await scalar('SELECT count(*) FROM support_messages')).toBe(0);
    await expect(db.query(`SELECT reply_support_ticket('${ticket}','An unauthorized reply',gen_random_uuid())`)).rejects.toThrow('Ticket not found');
    await expect(db.query(`SELECT set_support_ticket_status('${ticket}','closed')`)).rejects.toThrow('Ticket not found');
    await expect(db.exec(`INSERT INTO support_messages(ticket_id,author_id,is_staff,message,request_id) VALUES('${ticket}','${pro}',true,'Forged staff message',gen_random_uuid())`)).rejects.toThrow();
  });
  it('deduplicates staff replies, audits them, and privately links a notice to the owner ticket', async () => {
    await asRole('authenticated',other); // Membership was bootstrapped by the admin test.
    expect(await scalar('SELECT count(*) FROM support_tickets')).toBe(1);
    const id=String(await scalar(`SELECT reply_support_ticket('${ticket}','A helpful support reply','34343434-3434-4343-8343-343434343434')`));
    expect(await scalar(`SELECT reply_support_ticket('${ticket}','A helpful support reply','34343434-3434-4343-8343-343434343434')`)).toBe(id);
    expect(await scalar(`SELECT is_staff FROM support_messages WHERE id='${id}'`)).toBe(true);
    await asRole('service_role');
    expect(await scalar(`SELECT count(*) FROM operation_audit WHERE action='support_reply' AND target_id='${ticket}'`)).toBe(1);
    await asRole('authenticated',buyer);
    expect(await scalar(`SELECT count(*) FROM notifications WHERE support_ticket_id='${ticket}'`)).toBe(1);
  });
  it('supports owner replies and close/reopen without exposing other conversations', async () => {
    await asRole('authenticated',buyer);
    const id=String(await scalar(`SELECT reply_support_ticket('${ticket}','Thank you for the help',gen_random_uuid())`));
    expect(await scalar(`SELECT is_staff FROM support_messages WHERE id='${id}'`)).toBe(false);
    await db.query(`SELECT set_support_ticket_status('${ticket}','closed')`);
    await expect(db.query(`SELECT reply_support_ticket('${ticket}','A reply to a closed ticket',gen_random_uuid())`)).rejects.toThrow('Ticket is closed');
    await db.query(`SELECT set_support_ticket_status('${ticket}','open')`);
    expect(await scalar(`SELECT status FROM support_tickets WHERE id='${ticket}'`)).toBe('open');
    await asRole('authenticated',pro);
    expect(await scalar(`SELECT count(*) FROM notifications WHERE support_ticket_id='${ticket}'`)).toBe(0);
  });
  it('caps repeated support submissions per account', async () => {
    await asRole('authenticated',buyer);
    for(let n=0;n<4;n++)await db.query(`SELECT create_support_ticket('Another issue','general','Another private support request',gen_random_uuid())`);
    await expect(db.query(`SELECT create_support_ticket('Another issue','general','Another private support request',gen_random_uuid())`)).rejects.toThrow('Too many support requests');
  });
});

describe('administrator integration operations',()=>{
  let event:string;
  it('denies delivery evidence and replay to ordinary accounts and anonymous callers',async()=>{
    await asRole('anon');
    await expect(db.query('SELECT admin_attribution_health()')).rejects.toThrow();
    await asRole('authenticated',pro);
    await expect(db.query('SELECT admin_attribution_health()')).rejects.toThrow('Administrator access required');
    await expect(db.query(`SELECT admin_retry_attribution('${lead}')`)).rejects.toThrow('Administrator access required');
    await expect(db.query('SELECT * FROM takatak_attribution_outbox')).rejects.toThrow();
  });
  it('shows actual delivery evidence without customer contact or document fields',async()=>{
    await asRole('authenticated',other);
    const health=await scalar('SELECT admin_attribution_health()') as {delivered:number;recent:{id:string}[]};
    expect(health.delivered).toBe(1);event=health.recent[0].id;
    for(const privateField of ['customer_email','customer_phone','customer_name','lead_id','attribution_id','document'])expect(JSON.stringify(health)).not.toContain(privateField);
    await expect(db.query(`SELECT admin_retry_attribution('${event}')`)).rejects.toThrow('Event already delivered');
  });
  it('refuses replay while a worker holds the event lease',async()=>{
    await asRole('service_role');
    await db.query(`UPDATE takatak_attribution_outbox SET delivered_at=NULL,attempts=12,leased_until=now()+interval '1 minute',lease_id=gen_random_uuid() WHERE id='${event}'`);
    await asRole('authenticated',other);
    await expect(db.query(`SELECT admin_retry_attribution('${event}')`)).rejects.toThrow('Event is being delivered');
    const health=await scalar('SELECT admin_attribution_health()');expect(health).toMatchObject({exhausted:1,leased:1,delivered:0});
  });
  it('releases exhausted work once, keeps its external identifier, and audits the actor',async()=>{
    await asRole('service_role');await db.query(`UPDATE takatak_attribution_outbox SET leased_until=now()-interval '1 minute' WHERE id='${event}'`);
    await asRole('authenticated',other);
    expect(await scalar(`SELECT admin_retry_attribution('${event}')`)).toBe(true);
    expect(await scalar(`SELECT admin_retry_attribution('${event}')`)).toBe(false);
    await asRole('postgres');
    expect(await scalar(`SELECT count(*) FROM operation_audit WHERE action='attribution_retry' AND target_id='${event}' AND actor_id='${other}'`)).toBe(1);
    await asRole('authenticated',other);
    const health=await scalar('SELECT admin_attribution_health()') as {pending:number;exhausted:number;recent:{id:string;attempts:number;leased:boolean|null}[]};
    expect(health).toMatchObject({pending:1,exhausted:0});expect(health.recent[0]).toMatchObject({id:event,attempts:0,leased:null});
  });
  it('allows the service worker to reclaim replayed work and protects missing events',async()=>{
    await asRole('service_role');
    const {rows}=await db.query<{id:string;lease_id:string}>('SELECT * FROM claim_attribution_batch(5)');expect(rows).toHaveLength(1);expect(rows[0].id).toBe(event);
    expect(await scalar(`SELECT complete_attribution('${event}','${rows[0].lease_id}',200,true)`)).toBe(true);
    await asRole('authenticated',other);
    await expect(db.query(`SELECT admin_retry_attribution('00000000-0000-4000-8000-000000000000')`)).rejects.toThrow('Event not found');
  });
});
