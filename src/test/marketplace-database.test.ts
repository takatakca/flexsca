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
