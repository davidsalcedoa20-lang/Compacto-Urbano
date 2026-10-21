import defaults from '../data/site-content.json';
import { supabase } from './supabase-client.js';

async function getContact() {
    if (!supabase) return defaults.contact;
    try {
        const { data, error } = await Promise.race([
            supabase.from('site_content').select('document').eq('content_key', 'contact').maybeSingle(),
            new Promise(resolve => setTimeout(() => resolve({ error: new Error('timeout') }), 5000))
        ]);
        return error || !data?.document ? defaults.contact : { ...defaults.contact, ...data.document };
    } catch { return defaults.contact; }
}

getContact().then(contact => {
    const phoneDigits = String(contact.phone || '').replace(/\D/g, '');
    const whatsappDigits = String(contact.whatsapp || '').replace(/\D/g, '');
    const address = String(contact.address || defaults.contact.address).trim();
    const email = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact.email) ? contact.email : defaults.contact.email;
    const footer = document.querySelector('.footer-contact');
    if (footer) {
        const addressNode = footer.querySelector('li:first-child span:last-child');
        if (addressNode) addressNode.textContent = address;
        const phoneLink = footer.querySelector('a[href^="tel:"]');
        if (phoneLink) {
            phoneLink.href = `tel:+${phoneDigits}`;
            const label = phoneLink.querySelector('span:last-child');
            if (label) label.textContent = contact.phone;
        }
        const emailLink = footer.querySelector('a[href^="mailto:"]');
        if (emailLink) {
            emailLink.href = `mailto:${email}`;
            const label = emailLink.querySelector('span:last-child');
            if (label) label.textContent = email;
        }
    }
    const syncWhatsapp = () => {
        document.querySelectorAll('a[href*="wa.me/"]').forEach(link => {
            const current = new URL(link.href, location.href);
            const message = current.searchParams.get('text') || contact.whatsappMessage || defaults.contact.whatsappMessage;
            const target = `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(message)}`;
            if (link.href !== target) link.href = target;
        });
    };
    syncWhatsapp();
    let queued = false;
    new MutationObserver(() => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => { queued = false; syncWhatsapp(); });
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['href'] });
});
