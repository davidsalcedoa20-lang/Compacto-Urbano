import { chromium } from 'playwright-core';
import { resolve } from 'node:path';

const base = process.env.TEST_BASE_URL || 'https://compacto-urbano.vercel.app';
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
if (!email || !password) throw new Error('Faltan ADMIN_EMAIL y ADMIN_PASSWORD.');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
if (process.env.VERCEL_OIDC_TOKEN) {
  const origin = new URL(base).origin;
  await page.route(`${origin}/**`, route => route.continue({
    headers: { ...route.request().headers(), 'x-vercel-trusted-oidc-idp-token': process.env.VERCEL_OIDC_TOKEN }
  }));
}
try {
  await page.goto(`${base}/admin`, { waitUntil: 'domcontentloaded' });
  await page.waitForURL('**/admin/login', { timeout: 20000 });
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await page.waitForURL(url => url.pathname === '/admin', { timeout: 20000 });
  await page.locator('.image-card').first().waitFor({ timeout: 20000 });
  const imageCount = await page.locator('.image-card').count();
  if (imageCount !== 53) throw new Error(`El panel muestra ${imageCount} imágenes, se esperaban 53.`);
  for (let index = 0; index < 3; index++) {
    const image = page.locator('.image-card img').nth(index);
    await image.scrollIntoViewIfNeeded();
    await image.evaluate(img => new Promise(resolve => {
      if (img.complete) return resolve();
      img.addEventListener('load', resolve, { once: true });
      img.addEventListener('error', resolve, { once: true });
    }));
    if (!(await image.evaluate(img => img.naturalWidth))) throw new Error(`No carga la imagen ${index + 1}: ${await image.getAttribute('src')}`);
  }
  await page.getByRole('button', { name: 'Ajustes' }).click();
  const displayedEmail = await page.locator('#current-email').textContent();
  if (displayedEmail !== email) throw new Error('El correo actual no coincide.');
  if (process.env.SCREENSHOT_PATH) {
    await page.getByRole('button', { name: 'Imágenes' }).click();
    await page.screenshot({ path: process.env.SCREENSHOT_PATH, fullPage: true });
  }
  if (process.env.TEST_IMAGE_UI === '1') {
    await page.getByRole('button', { name: 'Imágenes' }).click();
    await page.locator('[data-edit="/img/logo/logo.png"]').click();
    await page.locator('#image-file').setInputFiles(resolve('img/logo/logo.png'));
    await page.locator('#publish-image').click();
    await page.getByText('Imagen publicada.', { exact: false }).waitFor({ timeout: 20000 });
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => {
      const image = document.querySelector('img[data-original-image="/img/logo/logo.png"]');
      return image?.src.includes('/storage/v1/object/sign/');
    }, null, { timeout: 20000 });
    await page.goto(`${base}/admin`, { waitUntil: 'domcontentloaded' });
    await page.locator('[data-edit="/img/logo/logo.png"]').click();
    await page.locator('#restore-image').click();
    await page.getByText('Imagen original restaurada.').waitFor({ timeout: 20000 });
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => {
      const image = document.querySelector('img[data-original-image="/img/logo/logo.png"]');
      return image?.src.endsWith('/img/logo/logo.png');
    }, null, { timeout: 20000 });
    console.log('OK: publicación y restauración desde el panel reflejadas en la página pública.');
    await page.goto(`${base}/admin`, { waitUntil: 'domcontentloaded' });
  }
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await page.waitForURL('**/admin/login', { timeout: 20000 });
  console.log(`OK: redirección privada, inicio de sesión, ${imageCount} imágenes, Ajustes y cierre de sesión.`);
} finally {
  await browser.close();
}
