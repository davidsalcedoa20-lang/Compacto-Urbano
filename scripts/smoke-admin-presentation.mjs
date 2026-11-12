import { chromium } from 'playwright-core';
import { createClient } from '@supabase/supabase-js';

const { TEST_BASE_URL: base, SUPABASE_URL: url, SUPABASE_PUBLISHABLE_KEY: key, ADMIN_EMAIL: email, ADMIN_PASSWORD: password, VERCEL_OIDC_TOKEN: token } = process.env;
if (!base || !url || !key || !email || !password) throw new Error('Faltan variables de prueba.');
const supabase = createClient(url, key, { auth: { persistSession: false } });
const { data: signed, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
if (loginError || !signed.user) throw loginError || new Error('No fue posible iniciar sesión de prueba.');
const { data: original, error: readError } = await supabase.from('site_content').select('document').eq('content_key', 'contact').single();
if (readError || !original?.document) throw readError || new Error('No se encontró contacto para restaurar.');
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
  await page.getByRole('button', { name: 'Textos y tipografía' }).click();
  await page.locator('#presentation-editor .presentation-row').first().waitFor({ timeout: 20000 });
  await page.locator('#presentation-search').fill('Nuestros servicios');
  const row = page.locator('#presentation-editor .presentation-row').first();
  await row.locator('textarea').fill('Servicios de prueba temporal');
  await page.locator('[data-font="bodyFont"]').selectOption('verdana');
  await page.locator('[data-font="headingFont"]').selectOption('trebuchet');
  await page.locator('[data-publish="presentation"]').click();
  await page.getByText('Textos y tipografía publicado.', { exact: false }).waitFor({ timeout: 20000 });
  const { data: saved, error } = await supabase.from('site_content').select('document').eq('content_key', 'contact').single();
  if (error || saved?.document?.presentation?.overrides?.['Nuestros servicios'] !== 'Servicios de prueba temporal') throw error || new Error('Supabase no devolvió el texto publicado.');
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Servicios de prueba temporal' }).waitFor({ timeout: 20000 });
  console.log('OK: editor, publicación en Supabase y página pública funcionan.');
} finally {
  const { error } = await supabase.from('site_content').upsert({ content_key: 'contact', document: original.document, updated_by: signed.user.id, updated_at: new Date().toISOString() });
  await browser.close();
  if (error) throw new Error(`No fue posible restaurar el contenido de contacto: ${error.message}`);
}
