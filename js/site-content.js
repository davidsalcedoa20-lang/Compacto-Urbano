import defaults from '../data/site-content.json';
import { supabase } from './supabase-client.js';

const localImage = path => typeof path === 'string' && /^\/(?:Imagenes|linea_de_tiempo|img|img-remplaso|proyectos|content)\//.test(path) ? path : '';
const text = (value, fallback = '') => typeof value === 'string' && value.trim() ? value.trim() : fallback;

async function loadContent() {
    const content = structuredClone(defaults);
    if (!supabase) return content;
    try {
        const { data, error } = await Promise.race([
            supabase.from('site_content').select('content_key,document'),
            new Promise(resolve => setTimeout(() => resolve({ error: new Error('timeout') }), 5000))
        ]);
        if (error) return content;
        for (const row of data || []) {
            if (Object.hasOwn(content, row.content_key) && row.document) content[row.content_key] = row.document;
        }
    } catch { /* Keep the bundled page available if Supabase cannot be reached. */ }
    return content;
}

function renderHero(items) {
    const hero = document.querySelector('.hero');
    const controls = hero.querySelector('.hero-controls');
    const enabled = Array.isArray(items) ? items.filter(item => item?.enabled !== false && localImage(item.image)) : [];
    const slides = enabled.length ? enabled : defaults.hero;
    const nodes = slides.map((slide, index) => {
        const item = document.createElement('div');
        item.className = `slide hero-slide${index === 0 ? ' is-active' : ''}`;
        const image = document.createElement('img');
        image.src = localImage(slide.image) || defaults.hero[0].image;
        image.dataset.fallbackImage = localImage(slide.fallbackImage) || defaults.hero[0].image;
        image.onerror = () => { image.onerror = null; image.src = image.dataset.fallbackImage; };
        image.alt = text(slide.alt, text(slide.title));
        if (index === 0) image.fetchPriority = 'high'; else image.loading = 'lazy';
        const copy = document.createElement('div');
        copy.className = 'hero-copy';
        const eyebrow = document.createElement('span');
        eyebrow.className = 'hero-eyebrow';
        eyebrow.textContent = text(slide.eyebrow);
        const heading = document.createElement(index === 0 ? 'h1' : 'h2');
        heading.textContent = text(slide.title);
        const description = document.createElement('p');
        description.textContent = text(slide.text);
        copy.append(eyebrow, heading, description);
        item.append(image, copy);
        return item;
    });
    hero.replaceChildren(...nodes, controls);
    controls.hidden = nodes.length < 2;
}

function renderServices(services) {
    for (const key of ['inmobiliaria', 'interventoria', 'construccion']) {
        const service = services?.[key] || defaults.services[key];
        const section = document.getElementById(key);
        section.querySelector('.service-kicker').textContent = text(service.kicker);
        section.querySelector('.service-hero-copy h2').textContent = text(service.title);
        section.querySelector('.service-hero-copy p').textContent = text(service.description);
        document.querySelector(`.service-card[href="#${key}"] span`).textContent = text(service.title);
    }
}

function renderContact(contact) {
    const values = { ...defaults.contact, ...(contact || {}) };
    const email = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email) ? values.email : defaults.contact.email;
    const phone = text(values.phone, defaults.contact.phone);
    const whatsapp = String(values.whatsapp || '').replace(/\D/g, '') || defaults.contact.whatsapp;
    const address = text(values.address, defaults.contact.address);
    const details = document.querySelector('.contact-details');
    details.querySelector('p').textContent = address;
    const emailLink = details.querySelector('a[href^="mailto:"]');
    emailLink.textContent = email;
    emailLink.href = `mailto:${email}`;
    const phoneLink = details.querySelector('a[href^="tel:"]');
    phoneLink.textContent = phone;
    phoneLink.href = `tel:+${phone.replace(/\D/g, '')}`;
    document.querySelector('.contact-cta h3').textContent = text(values.heading, defaults.contact.heading);
    document.querySelector('.contact-cta p').textContent = text(values.text, defaults.contact.text);
    document.querySelector('.nav-whatsapp').href = `https://wa.me/${whatsapp}?text=${encodeURIComponent(text(values.whatsappMessage, defaults.contact.whatsappMessage))}`;
    document.querySelector('.location iframe').src = `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
}

loadContent().then(content => {
    window.siteContent = content;
    renderHero(content.hero);
    renderServices(content.services);
    renderContact(content.contact);
    const interactions = document.createElement('script');
    interactions.src = '/js/guia.js';
    interactions.onload = () => window.initMiniGalleries?.(content.services);
    document.body.appendChild(interactions);
});
