/* Compacto Urbano — Portafolio Cover Flow 3D (continuous physics) */

(() => {
    "use strict";

    const DATA_URL = "data/proyectos.json";
    const IMAGE_BASE = "linea_de_tiempo/";
    const prefersReduced =
        window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* Physics / feel */
    const FRICTION = 0.942;
    const MIN_VELOCITY = 0.0025;
    const SNAP_STRENGTH = 0.14;
    const SNAP_FRICTION = 0.88;
    const WHEEL_GAIN = 0.0042;
    const MAX_WHEEL_BURST = 2.8;

    const section = document.getElementById("portafolio");
    if (!section) return;

    const timelineEl = section.querySelector("[data-portfolio-timeline]");
    const stageEl = section.querySelector("[data-portfolio-stage]");
    const trackEl = section.querySelector("[data-portfolio-track]");
    const linkEl = section.querySelector("[data-portfolio-link]");
    const prevBtn = section.querySelector("[data-portfolio-prev]");
    const nextBtn = section.querySelector("[data-portfolio-next]");
    const yearsLabel = section.querySelector("[data-portfolio-years-count]");

    if (!timelineEl || !stageEl || !trackEl) return;

    /** @type {Array<{nombre:string,inicio:number,fin:number,imagen:string,link?:string}>} */
    let projects = [];
    /** Continuous decimal position in card units */
    let position = 0;
    let velocity = 0;
    let rafId = 0;
    let running = false;
    let isDragging = false;
    let dragPointerId = null;
    let dragStartX = 0;
    let dragStartPos = 0;
    let lastMoveX = 0;
    let lastMoveTime = 0;
    let dragMoved = false;
    let cards = [];
    let syncYear = null;
    let syncIndex = -1;

    const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
    const maxPos = () => Math.max(0, projects.length - 1);

    const sortProjects = (list) =>
        [...list].sort((a, b) => {
            if (a.inicio !== b.inicio) return a.inicio - b.inicio;
            return a.nombre.localeCompare(b.nombre, "es");
        });

    const uniqueYears = (list) =>
        [...new Set(list.map((p) => p.inicio))].sort((a, b) => a - b);

    const firstIndexForYear = (year) => projects.findIndex((p) => p.inicio === year);

    const escapeHtml = (str) =>
        String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");

    /** Pixels of drag required to move one card unit */
    const unitPx = () => {
        const w = window.innerWidth;
        if (w <= 480) return 92;
        if (w <= 768) return 110;
        if (w <= 992) return 135;
        return 160;
    };

    const spacing = () => {
        const w = window.innerWidth;
        if (w <= 480) return { x: 78, z: 110, rot: 46 };
        if (w <= 768) return { x: 105, z: 130, rot: 48 };
        if (w <= 992) return { x: 130, z: 150, rot: 50 };
        return { x: 155, z: 170, rot: 52 };
    };

    const cardTransform = (offset) => {
        const abs = Math.abs(offset);
        const dir = Math.sign(offset) || 0;
        const s = spacing();

        let scale;
        let opacity;
        let blur;

        if (abs < 1) {
            const t = abs;
            scale = 1 - t * 0.1;
            opacity = 1 - t * 0.3;
            blur = t * 1.2;
        } else if (abs < 2) {
            const t = abs - 1;
            scale = 0.9 - t * 0.1;
            opacity = 0.7 - t * 0.3;
            blur = 1.2 + t * 2.2;
        } else if (abs < 3) {
            const t = abs - 2;
            scale = 0.8 - t * 0.1;
            opacity = 0.4 - t * 0.2;
            blur = 3.4 + t * 2;
        } else {
            scale = 0.7;
            opacity = 0.2;
            blur = 5.5;
        }

        const rot = dir * clamp(abs * s.rot, 0, 62);
        const x = dir * (Math.min(abs, 3.2) * s.x);
        const z = -Math.min(abs, 3.2) * s.z;

        return {
            x,
            z,
            rotateY: -rot,
            scale: clamp(scale, 0.68, 1),
            opacity: clamp(opacity, 0.18, 1),
            blur: clamp(blur, 0, 6)
        };
    };

    const applyTransforms = (pos) => {
        const activeRounded = Math.round(clamp(pos, 0, maxPos()));

        cards.forEach((card, i) => {
            const offset = i - pos;
            const t = cardTransform(offset);
            card.classList.toggle("is-active", i === activeRounded);

            card.style.transform =
                `translate3d(-50%, -50%, 0) translate3d(${t.x}px, 0, ${t.z}px) rotateY(${t.rotateY}deg) scale(${t.scale})`;
            card.style.opacity = String(t.opacity);
            card.style.filter = t.blur > 0.12 ? `blur(${t.blur.toFixed(2)}px)` : "none";
            card.style.zIndex = String(Math.round(200 - Math.abs(offset) * 20));
            card.style.pointerEvents = Math.abs(offset) < 1.75 ? "auto" : "none";
        });

        if (activeRounded !== syncIndex) {
            syncIndex = activeRounded;
            syncChrome(activeRounded);
        }
    };

    const syncChrome = (i) => {
        const project = projects[i];
        if (!project) return;

        if (project.inicio !== syncYear) {
            syncYear = project.inicio;
            timelineEl.querySelectorAll(".portfolio-year").forEach((btn) => {
                const active = Number(btn.dataset.year) === syncYear;
                btn.classList.toggle("is-active", active);
                btn.setAttribute("aria-selected", String(active));
            });

            const activeBtn = timelineEl.querySelector(".portfolio-year.is-active");
            if (activeBtn && window.innerWidth <= 768) {
                activeBtn.scrollIntoView({
                    behavior: prefersReduced ? "auto" : "smooth",
                    inline: "center",
                    block: "nearest"
                });
            }
        }

        if (linkEl) {
            const hasLink = Boolean(project.link && String(project.link).trim());
            if (!hasLink) {
                linkEl.classList.remove("is-visible");
                linkEl.removeAttribute("href");
                linkEl.setAttribute("aria-hidden", "true");
            } else {
                linkEl.href = project.link;
                linkEl.target = "_blank";
                linkEl.rel = "noopener noreferrer";
                linkEl.classList.add("is-visible");
                linkEl.setAttribute("aria-hidden", "false");
                linkEl.setAttribute("aria-label", `Ver proyecto ${project.nombre}`);
            }
        }

        if (prevBtn) prevBtn.disabled = i <= 0;
        if (nextBtn) nextBtn.disabled = i >= maxPos();
    };

    const stopLoop = () => {
        running = false;
        cancelAnimationFrame(rafId);
        rafId = 0;
    };

    const startLoop = () => {
        if (running) return;
        running = true;
        rafId = requestAnimationFrame(tick);
    };

    const tick = () => {
        if (isDragging) {
            applyTransforms(position);
            rafId = requestAnimationFrame(tick);
            return;
        }

        if (prefersReduced) {
            position = Math.round(clamp(position, 0, maxPos()));
            velocity = 0;
            applyTransforms(position);
            stopLoop();
            return;
        }

        /* Inertia */
        if (Math.abs(velocity) > MIN_VELOCITY) {
            position += velocity;
            velocity *= FRICTION;

            if (position < 0) {
                position = 0;
                velocity *= 0.35;
            } else if (position > maxPos()) {
                position = maxPos();
                velocity *= 0.35;
            }
        } else {
            velocity = 0;
            const target = clamp(Math.round(position), 0, maxPos());
            const delta = target - position;

            if (Math.abs(delta) < 0.0015) {
                position = target;
                applyTransforms(position);
                stopLoop();
                return;
            }

            /* Soft snap spring */
            velocity += delta * SNAP_STRENGTH;
            velocity *= SNAP_FRICTION;
            position += velocity;
        }

        applyTransforms(position);
        rafId = requestAnimationFrame(tick);
    };

    /** Jump toward an absolute index (timeline, arrows, keyboard, click) */
    const goToIndex = (i) => {
        const target = clamp(i, 0, maxPos());

        if (prefersReduced) {
            position = target;
            velocity = 0;
            applyTransforms(position);
            return;
        }

        stopLoop();
        isDragging = false;

        const from = position;
        const distance = Math.abs(target - from);
        const duration = clamp(300 + distance * 100, 340, 820);
        const start = performance.now();
        running = true;

        const animate = (now) => {
            if (isDragging) {
                stopLoop();
                return;
            }
            const t = clamp((now - start) / duration, 0, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            position = from + (target - from) * eased;
            velocity = 0;
            applyTransforms(position);

            if (t < 1) {
                rafId = requestAnimationFrame(animate);
            } else {
                position = target;
                applyTransforms(position);
                stopLoop();
            }
        };

        rafId = requestAnimationFrame(animate);
    };

    const renderTimeline = () => {
        const years = uniqueYears(projects);
        timelineEl.innerHTML = `<div class="portfolio-timeline-track" role="tablist" aria-label="Años de proyectos"></div>`;
        const track = timelineEl.querySelector(".portfolio-timeline-track");

        years.forEach((year) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "portfolio-year";
            btn.dataset.year = String(year);
            btn.setAttribute("role", "tab");
            btn.innerHTML = `
                <span class="portfolio-year-label">${year}</span>
                <span class="portfolio-year-dot" aria-hidden="true"></span>`;
            btn.addEventListener("click", () => {
                const i = firstIndexForYear(year);
                if (i >= 0) goToIndex(i);
            });
            track.appendChild(btn);
        });
    };

    const renderCards = () => {
        trackEl.innerHTML = "";
        projects.forEach((project, i) => {
            const card = document.createElement("article");
            card.className = "portfolio-card";
            card.dataset.index = String(i);
            card.setAttribute("role", "group");
            card.setAttribute("aria-label", project.nombre);
            card.innerHTML = `
                <div class="portfolio-card-media">
                    <img src="${IMAGE_BASE}${encodeURIComponent(project.imagen)}" alt="${escapeHtml(project.nombre)}" loading="lazy" draggable="false">
                </div>
                <span class="portfolio-card-badge">${project.inicio}</span>
                <div class="portfolio-card-body">
                    <h3>${escapeHtml(project.nombre)}</h3>
                    <p class="portfolio-card-years">${project.inicio} — ${project.fin}</p>
                </div>`;
            card.addEventListener("click", (event) => {
                if (dragMoved) {
                    event.preventDefault();
                    event.stopPropagation();
                    return;
                }
                goToIndex(i);
            });
            trackEl.appendChild(card);
        });
        cards = [...trackEl.querySelectorAll(".portfolio-card")];
    };

    /* ---------- Pointer drag (mouse + touch) ---------- */

    const onPointerDown = (event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;

        isDragging = true;
        dragMoved = false;
        dragPointerId = event.pointerId;
        dragStartX = event.clientX;
        dragStartPos = position;
        lastMoveX = event.clientX;
        lastMoveTime = performance.now();
        velocity = 0;

        stageEl.classList.add("is-dragging");
        stopLoop();

        try {
            stageEl.setPointerCapture(event.pointerId);
        } catch (_) {
            /* ignore */
        }

        startLoop();
    };

    const onPointerMove = (event) => {
        if (!isDragging || event.pointerId !== dragPointerId) return;

        const dx = event.clientX - dragStartX;
        if (Math.abs(dx) > 4) dragMoved = true;

        /* Free continuous mapping: pixels → card units */
        position = clamp(dragStartPos - dx / unitPx(), -0.12, maxPos() + 0.12);

        const now = performance.now();
        const dt = Math.max(now - lastMoveTime, 8);
        const instVel = -(event.clientX - lastMoveX) / unitPx() / (dt / 16.67);
        /* Blend velocity sample for release inertia */
        velocity = velocity * 0.65 + instVel * 0.35;

        lastMoveX = event.clientX;
        lastMoveTime = now;
        /* transforms applied in rAF loop */
    };

    const onPointerUp = (event) => {
        if (!isDragging || (dragPointerId != null && event.pointerId !== dragPointerId)) return;

        isDragging = false;
        dragPointerId = null;
        stageEl.classList.remove("is-dragging");

        try {
            stageEl.releasePointerCapture(event.pointerId);
        } catch (_) {
            /* ignore */
        }

        /* Boost release velocity for flick gestures */
        if (Math.abs(velocity) > 0.02) {
            velocity *= 1.35;
            velocity = clamp(velocity, -3.5, 3.5);
        } else {
            velocity = 0;
        }

        /* Soft rubber-band back into range */
        if (position < 0) {
            position = 0;
            velocity = Math.max(velocity, 0);
        } else if (position > maxPos()) {
            position = maxPos();
            velocity = Math.min(velocity, 0);
        }

        window.setTimeout(() => {
            dragMoved = false;
        }, 40);

        startLoop();
    };

    /* ---------- Wheel / trackpad ---------- */

    let wheelIdleTimer = 0;

    const onWheel = (event) => {
        event.preventDefault();

        const dominant =
            Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;

        /* Trackpads emit many small deltas; mice emit larger chunks */
        let deltaCards = dominant * WHEEL_GAIN;

        /* Normalize line/page modes */
        if (event.deltaMode === 1) deltaCards *= 12;
        if (event.deltaMode === 2) deltaCards *= 40;

        deltaCards = clamp(deltaCards, -MAX_WHEEL_BURST, MAX_WHEEL_BURST);

        isDragging = false;
        position = clamp(position + deltaCards, 0, maxPos());
        velocity += deltaCards * 0.55;
        velocity = clamp(velocity, -3.2, 3.2);

        startLoop();

        window.clearTimeout(wheelIdleTimer);
        wheelIdleTimer = window.setTimeout(() => {
            /* Let snap settle when wheel stops */
            if (!isDragging) startLoop();
        }, 90);
    };

    /* ---------- Keyboard / arrows ---------- */

    const onKeyDown = (event) => {
        const rect = section.getBoundingClientRect();
        const inView = rect.top < window.innerHeight && rect.bottom > 0;
        if (!inView && !section.contains(document.activeElement)) return;

        if (event.key === "ArrowRight") {
            event.preventDefault();
            goToIndex(Math.round(position) + 1);
        } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            goToIndex(Math.round(position) - 1);
        } else if (event.key === "Home") {
            event.preventDefault();
            goToIndex(0);
        } else if (event.key === "End") {
            event.preventDefault();
            goToIndex(maxPos());
        }
    };

    const onResize = () => applyTransforms(position);

    const bind = () => {
        prevBtn?.addEventListener("click", () => goToIndex(Math.round(position) - 1));
        nextBtn?.addEventListener("click", () => goToIndex(Math.round(position) + 1));
        stageEl.addEventListener("wheel", onWheel, { passive: false });
        stageEl.addEventListener("pointerdown", onPointerDown);
        stageEl.addEventListener("pointermove", onPointerMove);
        stageEl.addEventListener("pointerup", onPointerUp);
        stageEl.addEventListener("pointercancel", onPointerUp);
        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("resize", onResize, { passive: true });
    };

    const init = async () => {
        try {
            const res = await fetch(DATA_URL, { cache: "no-store" });
            if (!res.ok) throw new Error(`No se pudo cargar ${DATA_URL}`);
            const raw = await res.json();
            if (!Array.isArray(raw) || !raw.length) throw new Error("Sin proyectos");

            projects = sortProjects(raw);

            if (yearsLabel) {
                const span =
                    Math.max(...projects.map((p) => p.fin)) -
                    Math.min(...projects.map((p) => p.inicio)) +
                    1;
                yearsLabel.textContent = String(
                    Math.max(span, uniqueYears(projects).length)
                );
            }

            renderTimeline();
            renderCards();
            bind();

            const startYear = 2015;
            const startIndex = firstIndexForYear(startYear);
            position = startIndex >= 0 ? startIndex : Math.floor(projects.length / 2);
            velocity = 0;
            applyTransforms(position);
        } catch (error) {
            console.error("[Portafolio]", error);
            section.classList.add("is-error");
            trackEl.innerHTML =
                '<p style="color:#fff;text-align:center;padding:40px 20px;">No se pudieron cargar los proyectos.</p>';
        }
    };

    init();
})();
