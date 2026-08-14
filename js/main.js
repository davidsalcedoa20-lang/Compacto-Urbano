/* Compacto Urbano — interactions */

(() => {
    "use strict";

    const header = document.getElementById("header");
    const menuToggle = document.getElementById("menuToggle");
    const mobileNav = document.getElementById("mobileNav");
    const cotizarModal = document.getElementById("cotizarModal");
    const cotizarDialog = cotizarModal && cotizarModal.querySelector(".cotizar-dialog");
    const prefersReduced =
        window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* Sticky header elevation */
    const onScrollHeader = () => {
        if (!header) return;
        header.classList.toggle("is-scrolled", window.scrollY > 12);
    };

    window.addEventListener("scroll", onScrollHeader, { passive: true });
    onScrollHeader();

    /* Mobile menu */
    const setMenuOpen = (open) => {
        if (!menuToggle || !mobileNav) return;
        menuToggle.classList.toggle("is-open", open);
        menuToggle.setAttribute("aria-expanded", String(open));
        menuToggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
        mobileNav.hidden = !open;
    };

    if (menuToggle && mobileNav) {
        menuToggle.addEventListener("click", () => {
            setMenuOpen(mobileNav.hidden);
        });

        mobileNav.querySelectorAll("a, [data-open-cotizar]").forEach((el) => {
            el.addEventListener("click", () => setMenuOpen(false));
        });

        window.addEventListener("resize", () => {
            if (window.innerWidth > 768) setMenuOpen(false);
        });
    }

    /* Services dropdown */
    document.querySelectorAll(".nav-dropdown").forEach((dropdown) => {
        const toggle = dropdown.querySelector(".nav-dropdown-toggle");
        const menu = dropdown.querySelector(".nav-dropdown-menu");
        if (!toggle || !menu) return;

        const setOpen = (open) => {
            dropdown.classList.toggle("is-open", open);
            toggle.setAttribute("aria-expanded", String(open));
            menu.hidden = !open;
        };

        toggle.addEventListener("click", (event) => {
            event.stopPropagation();
            setOpen(menu.hidden);
        });

        menu.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", () => setOpen(false));
        });

        document.addEventListener("click", (event) => {
            if (!dropdown.contains(event.target)) setOpen(false);
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") setOpen(false);
        });
    });

    /* Scroll reveal */
    const reveals = document.querySelectorAll(".reveal");

    if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        io.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.14, rootMargin: "0px 0px -40px 0px" }
        );

        reveals.forEach((el) => io.observe(el));
    } else {
        reveals.forEach((el) => el.classList.add("is-visible"));
    }

    /* Stat count-up when visible */
    const animateCount = (el) => {
        const target = Number(el.dataset.count);
        if (!target || prefersReduced) return;

        const prefix = el.textContent.trim().startsWith("+") ? "+" : "";
        const duration = 1400;
        const start = performance.now();

        const tick = (now) => {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            el.textContent = prefix + Math.round(target * eased);
            if (t < 1) requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
    };

    const numbers = document.querySelectorAll(".stat-number[data-count]");

    if ("IntersectionObserver" in window && numbers.length) {
        const countIo = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        animateCount(entry.target);
                        countIo.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.4 }
        );

        numbers.forEach((el) => countIo.observe(el));
    }

    /* Light parallax on images */
    const parallaxNodes = Array.from(document.querySelectorAll("[data-parallax] img"));

    if (parallaxNodes.length && !prefersReduced) {
        let ticking = false;

        const updateParallax = () => {
            const vh = window.innerHeight;
            parallaxNodes.forEach((img) => {
                const parent = img.closest("[data-parallax]") || img.parentElement;
                const rect = parent.getBoundingClientRect();
                if (rect.bottom < 0 || rect.top > vh) return;
                const progress = (vh / 2 - (rect.top + rect.height / 2)) / vh;
                const offset = Math.max(-12, Math.min(12, progress * 18));
                img.style.transform = `scale(1.08) translate3d(0, ${offset}px, 0)`;
            });
            ticking = false;
        };

        window.addEventListener(
            "scroll",
            () => {
                if (ticking) return;
                ticking = true;
                requestAnimationFrame(updateParallax);
            },
            { passive: true }
        );

        updateParallax();
    }

    /* ==================== Cotizar Modal ==================== */
    if (!cotizarModal || !cotizarDialog) return;

    let lastFocus = null;

    const getFocusable = () =>
        cotizarDialog.querySelectorAll(
            'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );

    const openCotizar = () => {
        lastFocus = document.activeElement;
        cotizarModal.hidden = false;
        cotizarModal.setAttribute("aria-hidden", "false");

        requestAnimationFrame(() => {
            cotizarModal.classList.add("is-open");
            document.body.classList.add("cotizar-open");
            cotizarDialog.focus();
        });
    };

    const closeCotizar = () => {
        cotizarModal.classList.remove("is-open");
        document.body.classList.remove("cotizar-open");
        cotizarModal.setAttribute("aria-hidden", "true");

        const finish = () => {
            cotizarModal.hidden = true;
            if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
        };

        if (prefersReduced) {
            finish();
            return;
        }

        window.setTimeout(finish, 420);
    };

    document.addEventListener("click", (event) => {
        const openTrigger = event.target.closest("[data-open-cotizar]");
        if (openTrigger) {
            event.preventDefault();
            openCotizar();
            return;
        }

        const closeTrigger = event.target.closest("[data-close-cotizar]");
        if (closeTrigger && cotizarModal.contains(closeTrigger)) {
            closeCotizar();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (!cotizarModal.classList.contains("is-open")) return;

        if (event.key === "Escape") {
            closeCotizar();
            return;
        }

        if (event.key !== "Tab") return;

        const focusable = Array.from(getFocusable());
        if (!focusable.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });

    if (window.location.hash === "#cotizar") {
        openCotizar();
    }
})();
