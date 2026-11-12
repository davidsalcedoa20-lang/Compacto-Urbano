import { chromium } from 'playwright-core';
import { writeFile } from 'node:fs/promises';

const base = process.env.TEXT_BASE_URL || 'https://compactourbano.com';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
const catalog = new Map();
try {
  for (const [path, label] of [['/', 'Inicio'], ['/servicios/inmobiliaria.html', 'Inmobiliaria'], ['/servicios/interventoria.html', 'Interventoría'], ['/servicios/propiedad_horizontal.html', 'Propiedad horizontal']]) {
    await page.goto(base + path, { waitUntil: 'domcontentloaded' });
    if (path === '/') await page.waitForFunction(() => !!window.siteContent, null, { timeout: 15000 });
    else await page.locator('[data-svc-root].is-ready').waitFor({ timeout: 15000 });
    const rows = await page.evaluate(() => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const entries = [];
      while (walker.nextNode()) {
        const node = walker.currentNode;
        const value = node.nodeValue.trim();
        if (!value || node.parentElement?.closest('script,style,svg,noscript,.hero-controls,.timeline-years,.timeline-arrow,.dots,.mini-gallery-arrow,.image-lightbox')) continue;
        if (/^[\d\s/—↔‹›+·©]+$/.test(value)) continue;
        const section = node.parentElement?.closest('main section');
        entries.push({ text: value, section: section?.id || section?.classList[0] || 'Encabezado y pie' });
      }
      return entries;
    });
    for (const row of rows) {
      const entry = catalog.get(row.text) || { text: row.text, locations: [] };
      const location = `${label} · ${row.section}`;
      if (!entry.locations.includes(location)) entry.locations.push(location);
      catalog.set(row.text, entry);
    }
  }
  const entries = [...catalog.values()].sort((a,b) => a.locations[0].localeCompare(b.locations[0], 'es') || a.text.localeCompare(b.text, 'es'));
  await writeFile('data/text-catalog.json', JSON.stringify(entries, null, 2) + '\n');
  console.log(`${entries.length} textos visibles catalogados.`);
} finally { await browser.close(); }
