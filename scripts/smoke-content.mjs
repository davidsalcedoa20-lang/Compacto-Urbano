import { chromium } from 'playwright-core';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const base = process.env.TEST_BASE_URL || 'https://compacto-urbano.vercel.app';
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
if (!email || !password) throw new Error('Faltan ADMIN_EMAIL y ADMIN_PASSWORD.');
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_PUBLISHABLE_KEY) throw new Error('Faltan SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY para restaurar el contenido al final.');
const defaults = JSON.parse(readFileSync(new URL('../data/site-content.json', import.meta.url), 'utf8'));
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY);
const { data: auth, error: authError } = await supabase.auth.signInWithPassword({ email, password });
if (authError) throw authError;
const { data: before, error: beforeError } = await supabase.from('site_content').select('content_key,document');
if (beforeError) throw beforeError;
const originals = new Map((before || []).map(row => [row.content_key, row.document]));
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
if (process.env.VERCEL_OIDC_TOKEN) {
  const origin = new URL(base).origin;
  await page.route(`${origin}/**`, route => route.continue({ headers: { ...route.request().headers(), 'x-vercel-trusted-oidc-idp-token': process.env.VERCEL_OIDC_TOKEN } }));
}
const marker = 'Prueba temporal del panel';
async function admin(view) {
  await page.goto(`${base}/admin`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: view, exact: true }).click();
  const editor = ({ 'Carrusel principal': '#hero-editor', 'Línea de tiempo': '#timeline-editor', 'Servicios': '#services-editor', 'Contacto': '#contact-editor' })[view];
  if (editor) await page.locator(`${editor} .content-card`).first().waitFor({ state: 'attached', timeout: 20000 });
}
async function publish(key) {
  await page.locator(`[data-publish="${key}"]`).click();
  const label = ({ hero: 'Carrusel', timeline: 'Línea de tiempo', services: 'Servicios', contact: 'Contacto' })[key];
  await page.waitForFunction(expected => document.querySelector('#admin-message')?.textContent?.startsWith(`${expected} publicado.`), label, { timeout: 20000 });
}
try {
  await page.goto(`${base}/admin/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await page.waitForURL(url => url.pathname === '/admin');
  await page.locator('#hero-editor .content-card').first().waitFor({ state: 'attached' });

  await admin('Carrusel principal');
  const heroTitle = page.locator('#hero-editor [data-field="title"]').first();
  const oldHeroTitle = await heroTitle.inputValue();
  await heroTitle.fill(marker);
  await publish('hero');
  await page.goto(base);
  await page.locator('.hero-slide.is-active h1').getByText(marker).waitFor();
  await admin('Carrusel principal');
  await page.locator('#hero-editor [data-field="title"]').first().fill(oldHeroTitle);
  await publish('hero');
  await admin('Carrusel principal');
  await page.locator('#hero-editor [data-field="enabled"]').nth(1).uncheck();
  await publish('hero');
  await page.goto(base);
  await page.waitForFunction(() => document.querySelectorAll('.hero-slide').length === 2);
  await admin('Carrusel principal');
  await page.locator('#hero-editor [data-field="enabled"]').nth(1).check();
  await publish('hero');

  await admin('Línea de tiempo');
  const originalCount = await page.locator('#timeline-editor .content-card').count();
  await page.locator('#timeline-add').click();
  const addedCount = await page.locator('#timeline-editor .content-card').count();
  if (addedCount !== originalCount + 1) throw new Error(`Añadir proyecto: antes=${originalCount}, después=${addedCount}`);
  console.log(`Proyectos en editor: ${originalCount} → ${addedCount}`);
  const project = page.locator('#timeline-editor .content-card').last();
  await project.locator('[data-field="name"]').fill(marker);
  await project.locator('[data-field="type"]').fill('Residencial');
  await project.locator('[data-field="location"]').fill('Bogotá');
  await publish('timeline');
  await page.goto(base);
  await page.waitForFunction(total => document.querySelector('.timeline-counter')?.textContent.trim().endsWith(total), String(originalCount + 1).padStart(2, '0'), { timeout: 30000 });
  await admin('Línea de tiempo');
  await page.locator('#timeline-editor .content-card').last().locator('[data-op="remove"]').click();
  await publish('timeline');

  await admin('Servicios');
  const service = page.locator('#services-editor .content-card').first();
  const lead = service.locator('[data-field="description"]');
  const oldLead = await lead.inputValue();
  await lead.fill(marker);
  await publish('services');
  await page.goto(base);
  await page.locator('#inmobiliaria .service-hero-copy p').getByText(marker).waitFor();
  await admin('Servicios');
  await page.locator('#services-editor .content-card').first().locator('[data-field="description"]').fill(oldLead);
  await publish('services');
  await admin('Servicios');
  const gallery = page.locator('#services-editor .content-card').first();
  const secondPhoto = await gallery.locator('.gallery-editor-row').nth(1).locator('[data-field="image"]').inputValue();
  await gallery.locator('.gallery-editor-row').first().locator('[data-op="down"]').click();
  await publish('services');
  await page.goto(base);
  await page.waitForFunction(expected => document.querySelector('[data-gallery="inmobiliaria"] .mini-gallery-track img')?.getAttribute('src') === expected, secondPhoto);
  await admin('Servicios');
  await page.locator('#services-editor .content-card').first().locator('.gallery-editor-row').nth(1).locator('[data-op="up"]').click();
  await publish('services');

  await admin('Contacto');
  const contact = page.locator('#contact-editor [data-field="heading"]');
  const oldContact = await contact.inputValue();
  await contact.fill(marker);
  await publish('contact');
  await page.goto(base);
  await page.locator('.contact-cta h3').getByText(marker).waitFor();
  await admin('Contacto');
  await page.locator('#contact-editor [data-field="heading"]').fill(oldContact);
  await publish('contact');
  await admin('Contacto');
  const messageField = page.locator('#contact-editor [data-field="whatsappMessage"]');
  const oldMessage = await messageField.inputValue();
  await messageField.fill(marker);
  await publish('contact');
  await page.goto(base);
  await page.waitForFunction(value => document.querySelector('.nav-whatsapp')?.href.includes(encodeURIComponent(value)), marker);
  await admin('Contacto');
  await page.locator('#contact-editor [data-field="whatsappMessage"]').fill(oldMessage);
  await publish('contact');
  console.log('OK: carrusel, nuevo proyecto, servicios y contacto se publican y reflejan en la página; contenido original restaurado.');
} finally {
  await browser.close();
  const { data: after, error: afterError } = await supabase.from('site_content').select('content_key,document');
  if (afterError) throw afterError;
  const current = new Map((after || []).map(row => [row.content_key, row.document]));
  for (const key of ['hero', 'timeline', 'services', 'contact']) {
    const original = originals.get(key) || defaults[key];
    if (JSON.stringify(current.get(key)) === JSON.stringify(original)) continue;
    const { error } = await supabase.from('site_content').upsert({ content_key: key, document: original, updated_by: auth.user.id, updated_at: new Date().toISOString() });
    if (error) throw error;
  }
  await supabase.auth.signOut();
}
