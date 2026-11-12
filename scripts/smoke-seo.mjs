import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const handler = require('../api/seo.js');

const originalFetch = globalThis.fetch;
const originalUrl = process.env.SUPABASE_URL;
const originalKey = process.env.SUPABASE_PUBLISHABLE_KEY;
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_PUBLISHABLE_KEY = 'test-publishable-key';
globalThis.fetch = async () => ({ ok: true, json: async () => [{ document: { seo: { home: { title: 'Nuevo título & ubicación', description: 'Descripción <segura> para Google.', indexable: false } } } }] });

function response() {
  return { statusCode: 200, headers: {}, setHeader(key, value) { this.headers[key.toLowerCase()] = value; }, end(body) { this.body = body; } };
}
try {
  const home = response();
  await handler({ url: '/api/seo?slug=home', query: { slug: 'home' } }, home);
  assert.equal(home.statusCode, 200);
  assert.match(home.body, /<title>Nuevo título &amp; ubicación<\/title>/);
  assert.match(home.body, /<meta name="description" content="Descripción &lt;segura&gt; para Google\.">/);
  assert.match(home.body, /<link rel="canonical" href="https:\/\/compactourbano\.com\/">/);
  assert.match(home.body, /<meta name="robots" content="noindex,follow">/);
  assert.equal(home.headers['x-robots-tag'], 'noindex, follow');
  const service = response();
  await handler({ url: '/api/seo?slug=inmobiliaria', query: { slug: 'inmobiliaria' } }, service);
  assert.equal(service.statusCode, 200);
  assert.match(service.body, /<link rel="canonical" href="https:\/\/compactourbano\.com\/servicios\/inmobiliaria\.html">/);
  assert.match(service.body, /data-seo-managed="true"/);
  const missing = response();
  await handler({ url: '/api/seo?slug=missing', query: { slug: 'missing' } }, missing);
  assert.equal(missing.statusCode, 404);
  console.log('OK: HTML SEO, URL canónica, noindex, escape HTML y respaldo por página.');
} finally {
  globalThis.fetch = originalFetch;
  if (originalUrl === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = originalUrl;
  if (originalKey === undefined) delete process.env.SUPABASE_PUBLISHABLE_KEY; else process.env.SUPABASE_PUBLISHABLE_KEY = originalKey;
}
