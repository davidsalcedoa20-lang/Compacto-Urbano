import { chromium } from 'playwright-core';

const base = process.env.TEST_BASE_URL || 'https://compactourbano.com';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
page.on('pageerror', error => console.error('PAGE ERROR:', error.message));
if (process.env.VERCEL_OIDC_TOKEN) {
  const origin = new URL(base).origin;
  await page.route(`${origin}/**`, route => route.continue({ headers: { ...route.request().headers(), 'x-vercel-trusted-oidc-idp-token': process.env.VERCEL_OIDC_TOKEN } }));
}
const presentation = { bodyFont: 'verdana', headingFont: 'trebuchet', overrides: { 'Nuestros servicios': 'Servicios para tu proyecto', 'Gestión Inmobiliaria': 'Asesoría inmobiliaria' } };
await page.route('**/rest/v1/site_content*', route => {
  if (!route.request().url().includes('content_key=eq.contact')) return route.continue();
  return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ document: { presentation } }]) });
});
try {
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  try { await page.getByRole('heading', { name: 'Servicios para tu proyecto' }).waitFor({ timeout: 20000 }); }
  catch (error) { console.error('DIAGNÓSTICO:', await page.locator('.section-title h2').allTextContents(), await page.locator('script[src*="presentation"]').count()); throw error; }
  const homeFont = await page.locator('body').evaluate(el => getComputedStyle(el).fontFamily);
  if (!homeFont.includes('Verdana')) throw new Error(`La tipografía general no cambió: ${homeFont}`);
  const headingFont = await page.locator('.section-title h2').evaluate(el => getComputedStyle(el).fontFamily);
  if (!headingFont.includes('Trebuchet')) throw new Error(`La tipografía de títulos no cambió: ${headingFont}`);
  await page.locator('.site-nav a[href="#servicios"]').hover();
  const navStyle = await page.locator('.site-nav a[href="#servicios"]').evaluate(el => ({ background: getComputedStyle(el).backgroundColor, border: getComputedStyle(el).borderColor }));
  if (navStyle.background === 'rgba(0, 0, 0, 0)' || navStyle.border === 'rgba(0, 0, 0, 0)') throw new Error('El enlace no se resalta en azul.');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.siteContent);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (overflow > 1) throw new Error(`El diseño se desborda ${overflow}px en móvil.`);
  await page.goto(`${base}/servicios/inmobiliaria.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => [...document.querySelectorAll('[data-svc-nav]')].some(node => node.textContent.trim() === 'Asesoría inmobiliaria'), null, { timeout: 20000 });
  const serviceFont = await page.locator('body').evaluate(el => getComputedStyle(el).fontFamily);
  if (!serviceFont.includes('Verdana')) throw new Error(`La tipografía no cambió en el servicio: ${serviceFont}`);
  console.log('OK: textos, tipografía y resaltado azul funcionan en inicio y página de servicio.');
} finally { await browser.close(); }
