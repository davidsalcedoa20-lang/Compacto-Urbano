import defaults from '../data/site-content.json';
import { supabase } from './supabase-client.js';

const FONTS = {
  arial: 'Arial, Helvetica, sans-serif',
  trebuchet: '"Trebuchet MS", Arial, sans-serif',
  georgia: 'Georgia, serif',
  verdana: 'Verdana, Geneva, sans-serif'
};

async function loadPresentation() {
  if (!supabase) return defaults.presentation;
  try {
    const { data, error } = await Promise.race([
      supabase.from('site_content').select('document').eq('content_key', 'contact').maybeSingle(),
      new Promise(resolve => setTimeout(() => resolve({ error: new Error('timeout') }), 5000))
    ]);
    return error || !data?.document?.presentation ? defaults.presentation : data.document.presentation;
  } catch { return defaults.presentation; }
}

loadPresentation().then(presentation => {
  document.documentElement.style.setProperty('--site-body-font', FONTS[presentation.bodyFont] || FONTS.arial);
  document.documentElement.style.setProperty('--site-heading-font', FONTS[presentation.headingFont] || FONTS.georgia);
  const overrides = presentation.overrides && typeof presentation.overrides === 'object' ? presentation.overrides : {};
  if (!Object.keys(overrides).length) return;
  const originals = new WeakMap();
  const scan = () => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue.trim() || node.parentElement?.closest('script,style,svg,noscript,[data-presentation-ignore]')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const original = originals.get(node) ?? node.nodeValue.trim();
      if (!originals.has(node)) originals.set(node, original);
      const replacement = overrides[original];
      if (typeof replacement !== 'string' || !replacement.trim()) continue;
      const before = node.nodeValue;
      const leading = before.match(/^\s*/)?.[0] || '';
      const trailing = before.match(/\s*$/)?.[0] || '';
      const next = leading + replacement.trim() + trailing;
      if (before !== next) node.nodeValue = next;
    }
  };
  scan();
  let scheduled = false;
  new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; scan(); });
  }).observe(document.body, { childList: true, characterData: true, subtree: true });
});
