const defaults = require('../data/site-content.json').seo;
const templates = require('./seo-templates.json');

const paths = {
  home: '/',
  inmobiliaria: '/servicios/inmobiliaria.html',
  interventoria: '/servicios/interventoria.html',
  propiedad_horizontal: '/servicios/propiedad_horizontal.html'
};
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

async function publishedSeo() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return {};
  try {
    const response = await fetch(`${url}/rest/v1/site_content?content_key=eq.contact&select=document`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(2500)
    });
    if (!response.ok) return {};
    const rows = await response.json();
    return rows[0]?.document?.seo || {};
  } catch { return {}; }
}

function render(template, slug, published) {
  const fallback = defaults[slug];
  const source = published[slug] || {};
  const title = typeof source.title === 'string' && source.title.trim() ? source.title.trim().slice(0, 120) : fallback.title;
  const description = typeof source.description === 'string' && source.description.trim() ? source.description.trim().slice(0, 320) : fallback.description;
  const canonical = `https://compactourbano.com${paths[slug]}`;
  const robots = source.indexable === false ? 'noindex,follow' : 'index,follow';
  const tags = [
    `<link rel="canonical" href="${canonical}">`,
    `<meta name="robots" content="${robots}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta property="og:description" content="${escapeHtml(description)}">`,
    `<meta property="og:url" content="${canonical}">`,
    `<meta property="og:image" content="https://compactourbano.com/img/logo/logo.png">`
  ].join('\n    ');
  const html = template
    .replace(/<html([^>]*)>/i, '<html$1 data-seo-managed="true">')
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`)
    .replace(/<meta\s+name=["']description["'][^>]*>/i, `<meta name="description" content="${escapeHtml(description)}">`)
    .replace(/<\/head>/i, `    ${tags}\n</head>`);
  return { html, indexable: robots === 'index,follow' };
}

module.exports = async function handler(req, res) {
  const url = new URL(req.url, 'https://compactourbano.com');
  const slug = String(req.query?.slug || url.searchParams.get('slug') || Object.keys(paths).find(key => paths[key] === url.pathname) || '');
  if (!Object.hasOwn(paths, slug) || !templates[slug]) {
    res.statusCode = 404;
    return res.end('Página no encontrada');
  }
  const { html, indexable } = render(templates[slug], slug, await publishedSeo());
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
  if (!indexable) res.setHeader('X-Robots-Tag', 'noindex, follow');
  res.end(html);
};
module.exports.renderSeo = render;
