// Adds the business directory to the sitemap after `vite build`.
// Reads the public list of businesses (name of the page only) with the public browser key and writes
// dist/sitemaps/directory-N.xml plus a sitemap index. If the list cannot be read, the page sitemap is kept as it is.
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';

const SITE = 'https://flexs.ca';
const env = Object.fromEntries(readFileSync('.env', 'utf8').split('\n').filter(line => line.includes('=')).map(line => { const i = line.indexOf('='); return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^"|"$/g, '')]; }));
const url = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!existsSync('dist/sitemap.xml') || !url || !key) { console.log('build-sitemaps: nothing to do'); process.exit(0); }

const slugs = [];
try {
  let after = '';
  for (let page = 0; page < 400; page++) {
    const query = `${url}/rest/v1/business_listings?select=slug&status=in.(listed,claimed)&order=slug&limit=1000${after ? `&slug=gt.${encodeURIComponent(after)}` : ''}`;
    const response = await fetch(query, { headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new Error(`directory answered ${response.status}`);
    const rows = await response.json();
    for (const row of rows) if (/^[a-z0-9-]{3,160}$/.test(row.slug)) slugs.push(row.slug);
    if (rows.length < 1000) break;
    after = rows[rows.length - 1].slug;
  }
} catch (error) {
  console.log(`build-sitemaps: directory not added (${error.message}); the page sitemap is unchanged`);
  process.exit(0);
}

const today = new Date().toISOString().slice(0, 10);
mkdirSync('dist/sitemaps', { recursive: true });
renameSync('dist/sitemap.xml', 'dist/sitemaps/pages.xml');
const files = ['sitemaps/pages.xml'];
for (let start = 0, part = 1; start < slugs.length; start += 40000, part++) {
  const body = slugs.slice(start, start + 40000).map(slug => `<url><loc>${SITE}/business/${slug}</loc><changefreq>monthly</changefreq></url>`).join('\n');
  writeFileSync(`dist/sitemaps/directory-${part}.xml`, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`);
  files.push(`sitemaps/directory-${part}.xml`);
}
writeFileSync('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${files.map(file => `<sitemap><loc>${SITE}/${file}</loc><lastmod>${today}</lastmod></sitemap>`).join('\n')}\n</sitemapindex>\n`);
console.log(`build-sitemaps: ${slugs.length} business pages in ${files.length - 1} files`);
