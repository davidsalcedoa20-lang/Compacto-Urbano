/* Compacto Urbano — Service page renderer (unified template) */

(() => {
    "use strict";

    const DATA_URL = "../data/servicios.json";

    const serviceId = document.body.dataset.servicio;
    if (!serviceId) return;

    const ICONS = {
        shield: '<path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
        chart: '<path d="M4 17l5-6 4 4 7-9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
        users: '<circle cx="9" cy="9" r="3" stroke="currentColor" stroke-width="1.6"/><circle cx="16" cy="10" r="2.4" stroke="currentColor" stroke-width="1.6"/><path d="M3 19c0-3 2.5-5 6-5s6 2 6 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
        building: '<path d="M4 20V9l8-5 8 5v11H4z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M10 20v-6h4v6" stroke="currentColor" stroke-width="1.6"/>',
        key: '<path d="M8 12h12M8 16h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><rect x="5" y="7" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M10 7V5a4 4 0 018 0v2" stroke="currentColor" stroke-width="1.6"/>',
        wrench: '<path d="M16 8l4 4-9 9H7v-4l9-9z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M14 10l4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
        report: '<rect x="5" y="4" width="14" height="16" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M9 9h6M9 13h6M9 17h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
        scales: '<path d="M8 7h8l2 4H6l2-4z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M6 11v9h12v-9M10 15h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
        search: '<circle cx="11" cy="11" r="5.5" stroke="currentColor" stroke-width="1.6"/><path d="M16 16l4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
        plan: '<path d="M6 18V8l6-4 6 4v10" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M10 12h4M10 16h3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
        clock: '<circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.6"/><path d="M12 8v4l3 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
        star: '<path d="M12 4l2.4 5 5.5.8-4 3.9.9 5.5L12 16.8 7.2 19.2l.9-5.5-4-3.9 5.5-.8L12 4z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
        check: '<circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.6"/><path d="M8.5 12.5l2.3 2.3L15.5 10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>'
    };

    const iconSvg = (name, viewBox = "0 0 24 24") =>
        `<svg viewBox="${viewBox}" fill="none" aria-hidden="true">${ICONS[name] || ICONS.building}</svg>`;

    const escapeHtml = (str) =>
        String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");

    const delayClass = (i) => {
        if (i % 3 === 1) return " reveal-delay";
        if (i % 3 === 2) return " reveal-delay-2";
        return "";
    };

    const observeReveals = (root) => {
        const nodes = root.querySelectorAll(".reveal:not(.is-visible)");
        if (!nodes.length) return;

        if (!("IntersectionObserver" in window)) {
            nodes.forEach((el) => el.classList.add("is-visible"));
            return;
        }

        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add("is-visible");
                    io.unobserve(entry.target);
                });
            },
            { threshold: 0.14, rootMargin: "0px 0px -40px 0px" }
        );

        nodes.forEach((el) => io.observe(el));
    };

    const lightParallax = () => {
        const img = document.querySelector("[data-parallax] img");
        if (!img) return;
        const prefersReduced =
            window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (prefersReduced) return;

        let ticking = false;
        const update = () => {
            const parent = img.closest("[data-parallax]");
            const rect = parent.getBoundingClientRect();
            const vh = window.innerHeight;
            if (rect.bottom < 0 || rect.top > vh) {
                ticking = false;
                return;
            }
            const progress = (vh / 2 - (rect.top + rect.height / 2)) / vh;
            const offset = Math.max(-12, Math.min(12, progress * 18));
            img.style.transform = `scale(1.06) translate3d(0, ${offset}px, 0)`;
            ticking = false;
        };

        window.addEventListener(
            "scroll",
            () => {
                if (ticking) return;
                ticking = true;
                requestAnimationFrame(update);
            },
            { passive: true }
        );
        update();
    };

    const renderHero = (svc) => {
        const el = document.querySelector("[data-svc-hero]");
        if (!el) return;
        const h = svc.hero;
        el.innerHTML = `
            <div class="svc-hero-grid">
                <div class="svc-hero-copy reveal">
                    <nav class="svc-breadcrumb" aria-label="Miga de pan">
                        <a href="../index.html">Inicio</a>
                        <span aria-hidden="true">›</span>
                        <a href="../index.html#servicios">Servicios</a>
                        <span aria-hidden="true">›</span>
                        <span>${escapeHtml(svc.nombre)}</span>
                    </nav>
                    <p class="svc-eyebrow"><span class="label-line" aria-hidden="true"></span>${escapeHtml(h.eyebrow)}</p>
                    <h1>${h.titleHtml}</h1>
                    <p class="svc-hero-lead">${escapeHtml(h.lead)}</p>
                    <button type="button" class="btn-cotizar btn-cotizar--lg" data-open-cotizar>
                        ${escapeHtml(svc.cta?.buttonLabel || "COTIZAR PROYECTO")}
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </button>
                    <div class="svc-hero-features">
                        ${h.quickBenefits
                            .map(
                                (b) => `
                            <div class="svc-hero-feature">
                                <span class="svc-icon">${iconSvg(b.icon)}</span>
                                <div>
                                    <strong>${escapeHtml(b.title)}</strong>
                                    <span>${escapeHtml(b.text)}</span>
                                </div>
                            </div>`
                            )
                            .join("")}
                    </div>
                </div>
                <div class="svc-hero-media reveal reveal-delay">
                    <div class="svc-geo" aria-hidden="true"></div>
                    <div class="svc-hero-frame" data-parallax>
                        <img src="${escapeHtml(h.image)}" alt="${escapeHtml(h.imageAlt)}" loading="eager">
                    </div>
                </div>
            </div>`;
    };

    const renderIntro = (svc) => {
        const el = document.querySelector("[data-svc-intro]");
        if (!el) return;
        const s = svc.intro;
        el.innerHTML = `
            <div class="section-wrap">
                <header class="section-head reveal">
                    <p class="section-label"><span class="label-line" aria-hidden="true"></span>${escapeHtml(s.eyebrow)}</p>
                    <h2>${s.titleHtml}</h2>
                    <p class="section-desc">${escapeHtml(s.desc)}</p>
                </header>
                <div class="svc-cards-grid">
                    ${s.cards
                        .map(
                            (c, i) => `
                        <article class="svc-card reveal${delayClass(i)}">
                            <div class="svc-icon">${iconSvg(c.icon)}</div>
                            <h3>${escapeHtml(c.title)}</h3>
                            <p>${escapeHtml(c.text)}</p>
                        </article>`
                        )
                        .join("")}
                </div>
            </div>`;
    };

    const renderProceso = (svc) => {
        const el = document.querySelector("[data-svc-proceso]");
        if (!el) return;
        const s = svc.proceso;
        el.innerHTML = `
            <div class="section-wrap">
                <header class="section-head reveal">
                    <p class="section-label light"><span class="label-line" aria-hidden="true"></span>${escapeHtml(s.eyebrow)}</p>
                    <h2>${s.titleHtml}</h2>
                </header>
                <ol class="svc-timeline">
                    ${s.steps
                        .map(
                            (step, i) => `
                        <li class="svc-step reveal${delayClass(i)}">
                            <div class="svc-step-icon">${iconSvg(step.icon)}</div>
                            <p class="svc-step-num">${String(i + 1).padStart(2, "0")}</p>
                            <p class="svc-step-title">${escapeHtml(step.title)}</p>
                            <p class="svc-step-text">${escapeHtml(step.text)}</p>
                        </li>`
                        )
                        .join("")}
                </ol>
            </div>`;
    };

    const renderBeneficios = (svc) => {
        const el = document.querySelector("[data-svc-beneficios]");
        if (!el) return;
        const s = svc.beneficios;
        el.innerHTML = `
            <div class="section-wrap">
                <header class="section-head reveal">
                    <p class="section-label light"><span class="label-line" aria-hidden="true"></span>${escapeHtml(s.eyebrow)}</p>
                    <h2>${s.titleHtml}</h2>
                </header>
                <div class="svc-benefits-grid">
                    ${s.items
                        .map(
                            (item, i) => `
                        <article class="svc-benefit reveal${delayClass(i)}">
                            <div class="svc-icon">${iconSvg(item.icon)}</div>
                            <h3>${escapeHtml(item.title)}</h3>
                            <p>${escapeHtml(item.text)}</p>
                        </article>`
                        )
                        .join("")}
                </div>
            </div>`;
    };

    const renderCta = (svc) => {
        const el = document.querySelector("[data-svc-cta]");
        if (!el) return;
        const s = svc.cta;
        el.innerHTML = `
            <div class="svc-cta-panel reveal">
                <div class="svc-cta-copy">
                    <div class="svc-cta-mark" aria-hidden="true">
                        <svg viewBox="0 0 36 36" fill="none"><path d="M8 28V14l10-7 10 7v14H8z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M15 28v-8h6v8" stroke="currentColor" stroke-width="1.8"/></svg>
                    </div>
                    <h2>${escapeHtml(s.title)}</h2>
                    <p>${escapeHtml(s.text)}</p>
                </div>
                <button type="button" class="btn-cotizar btn-cotizar--lg" data-open-cotizar>
                    ${escapeHtml(s.buttonLabel || "COTIZAR PROYECTO")}
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
            </div>`;
    };

    const syncNav = (svc) => {
        document.querySelectorAll("[data-svc-nav]").forEach((link) => {
            const active = link.dataset.svcNav === svc.id;
            if (active) link.setAttribute("aria-current", "page");
            else link.removeAttribute("aria-current");
        });
    };

    const syncModalWhatsapp = (svc) => {
        const card = document.querySelector("#cotizarModal .whatsapp-card");
        if (!card || !svc.cta?.whatsappMessage) return;
        const msg = encodeURIComponent(svc.cta.whatsappMessage);
        card.href = `https://wa.me/573176740334?text=${msg}`;
    };

    const init = async () => {
        const root = document.querySelector("[data-svc-root]");
        if (root) root.setAttribute("aria-busy", "true");

        try {
            const res = await fetch(DATA_URL, { cache: "no-store" });
            if (!res.ok) throw new Error("No se pudo cargar servicios.json");
            const map = await res.json();
            const svc = map[serviceId];
            if (!svc) throw new Error(`Servicio no encontrado: ${serviceId}`);

            document.title = svc.metaTitle;
            const meta = document.querySelector('meta[name="description"]');
            if (meta) meta.setAttribute("content", svc.metaDescription);

            renderHero(svc);
            renderIntro(svc);
            renderProceso(svc);
            renderBeneficios(svc);
            renderCta(svc);
            syncNav(svc);
            syncModalWhatsapp(svc);
            observeReveals(document);
            lightParallax();

            if (root) {
                root.removeAttribute("aria-busy");
                root.classList.add("is-ready");
            }
        } catch (error) {
            console.error("[Servicio]", error);
            if (root) {
                root.innerHTML = `<p class="svc-loading">No se pudo cargar el contenido del servicio.</p>`;
            }
        }
    };

    init();
})();
