import { chromium } from 'playwright-core';
import { createClient } from '@supabase/supabase-js';

const { TEST_BASE_URL: base, SUPABASE_URL: url, SUPABASE_PUBLISHABLE_KEY: key, ADMIN_EMAIL: email, ADMIN_PASSWORD: password, VERCEL_OIDC_TOKEN: token } = process.env;
if (!base || !url || !key || !email || !password) throw new Error('Faltan variables de prueba.');
const supabase = createClient(url, key, { auth: { persistSession: false } });
const { data: signed, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
if (loginError || !signed.user) throw loginError || new Error('No fue posible iniciar sesión.');
const { data: original, error: readError } = await supabase.from('site_content').select('document').eq('content_key', 'contact').single();
if (readError || !original?.document) throw readError || new Error('No se encontró el documento original.');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
if (token) {
  const origin = new URL(base).origin;
  await page.route(`${origin}/**`, route => route.continue({ headers: { ...route.request().headers(), 'x-vercel-trusted-oidc-idp-token': token } }));
}
try {
  await page.goto(`${base}/admin/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await page.waitForURL(value => value.pathname === '/admin', { timeout: 20000 });
  await page.getByRole('button', { name: 'SEO de Google' }).click();
  const title = 'Compacto Urbano SEO prueba temporal';
  const description = 'Descripción SEO temporal para comprobar que Google recibe el HTML inicial.';
  await page.locator('[data-seo-page="home"][data-seo-field="title"]').fill(title);
  await page.locator('[data-seo-page="home"][data-seo-field="description"]').fill(description);
  await page.locator('[data-publish="seo"]').click();
  await page.getByText('SEO publicado.', { exact: false }).waitFor({ timeout: 20000 });
  const { data: saved, error } = await supabase.from('site_content').select('document').eq('content_key', 'contact').single();
  if (error || saved?.document?.seo?.home?.title !== title) throw error || new Error('Supabase no devolvió el SEO publicado.');
  const response = await page.goto(`${base}/?seo-test=${Date.now()}`, { waitUntil: 'domcontentloaded' });
  const html = await response.text();
  if (!html.includes(`<title>${title}</title>`) || !html.includes(`content="${description}"`)) throw new Error('La respuesta HTML inicial no contiene el SEO publicado.');
  console.log('OK: panel, Supabase y HTML inicial publican título y descripción SEO.');
} finally {
  const { error } = await supabase.from('site_content').upsert({ content_key: 'contact', document: original.document, updated_by: signed.user.id, updated_at: new Date().toISOString() });
  await browser.close();
  if (error) throw new Error(`No fue posible restaurar el SEO original: ${error.message}`);
}
