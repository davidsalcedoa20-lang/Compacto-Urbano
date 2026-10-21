import { chromium } from 'playwright-core';

const base = process.env.TEST_BASE_URL || 'https://compacto-urbano.vercel.app';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
if (process.env.VERCEL_OIDC_TOKEN) {
  const origin = new URL(base).origin;
  await page.route(`${origin}/**`, route => route.continue({ headers: { ...route.request().headers(), 'x-vercel-trusted-oidc-idp-token': process.env.VERCEL_OIDC_TOKEN } }));
}
const contact = {
  address: 'Dirección de prueba 123, Bogotá', email: 'prueba@example.com', phone: '+57 300 111 2233',
  whatsapp: '573001112233', whatsappMessage: 'Mensaje de prueba', heading: 'Prueba', text: 'Prueba'
};
await page.route('**/rest/v1/site_content*', route => {
  if (!route.request().url().includes('content_key=eq.contact')) return route.continue();
  return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ document: contact }]) });
});
try {
  for (const service of ['inmobiliaria', 'interventoria', 'propiedad_horizontal']) {
    await page.goto(`${base}/servicios/${service}.html`, { waitUntil: 'domcontentloaded' });
    await page.getByText(contact.address, { exact: true }).waitFor({ timeout: 20000 });
    await page.waitForFunction(() => document.querySelector('.footer-contact a[href^="tel:"]')?.getAttribute('href') === 'tel:+573001112233');
    await page.waitForFunction(() => document.querySelector('.footer-contact a[href^="mailto:"]')?.getAttribute('href') === 'mailto:prueba@example.com');
    await page.waitForFunction(() => document.querySelector('#cotizarModal .whatsapp-card')?.href.startsWith('https://wa.me/573001112233?'));
  }
  console.log('OK: dirección, correo, teléfono y WhatsApp se sincronizan en las tres páginas de servicios.');
} finally {
  await browser.close();
}
