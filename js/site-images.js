import { supabase } from './supabase-client.js';

if (supabase) {
  const published = new Map();
  const normalize = (value) => {
    if (!value) return '';
    try {
      const url = new URL(value, location.href);
      if (url.origin !== location.origin) return '';
      return decodeURI(url.pathname).replace(/^\/public\//, '/');
    } catch { return ''; }
  };
  const apply = () => {
    document.querySelectorAll('img').forEach((img) => {
      const original = img.dataset.originalImage || normalize(img.getAttribute('src'));
      if (!original) return;
      img.dataset.originalImage = original;
      const row = published.get(original);
      if (!row || img.dataset.imageFailed === row.storage_path) return;
      if (img.src !== row.public_url) img.src = row.public_url;
      if (row.alt) img.alt = row.alt;
      img.onerror = () => { img.dataset.imageFailed = row.storage_path; img.onerror = null; img.src = original; };
    });
    document.querySelectorAll('[style*="--image"]').forEach((element) => {
      const style = element.getAttribute('style') || '';
      const original = element.dataset.originalImage || normalize(style.match(/--image\s*:\s*url\(['"]?([^'"\)]+)/)?.[1]);
      if (!original) return;
      element.dataset.originalImage = original;
      const row = published.get(original);
      if (row) {
        const replacement = `url("${row.public_url.replaceAll('"', '%22')}")`;
        if (element.style.getPropertyValue('--image') !== replacement) element.style.setProperty('--image', replacement);
      }
    });
  };
  supabase.from('published_images').select('original_path,storage_path,alt').then(async ({ data, error }) => {
    if (error || !data) return;
    for (const row of data) {
      const { data: signed } = await supabase.storage.from('site-images').createSignedUrl(row.storage_path, 3600);
      if (signed?.signedUrl) published.set(row.original_path, { ...row, public_url: signed.signedUrl });
    }
    apply();
    let queued = false;
    new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; apply(); });
    }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'style'] });
  });
}
