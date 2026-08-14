/* Compacto Urbano — Featured projects from data/proyectos.json */

(() => {
    "use strict";

    const containers = document.querySelectorAll("[data-featured-projects]");
    if (!containers.length) return;

    const escapeHtml = (str) =>
        String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");

    const sortProjects = (list) =>
        [...list].sort((a, b) => {
            if (a.inicio !== b.inicio) return b.inicio - a.inicio;
            return a.nombre.localeCompare(b.nombre, "es");
        });

    const render = (container, projects, imageBase) => {
        container.innerHTML = projects
            .map(
                (project) => `
            <article class="iv-project-card portfolio-card is-static reveal">
                <div class="portfolio-card-media">
                    <img src="${imageBase}${encodeURIComponent(project.imagen)}" alt="${escapeHtml(project.nombre)}" loading="lazy">
                </div>
                <span class="portfolio-card-badge">${project.inicio}</span>
                <div class="portfolio-card-body">
                    <h3>${escapeHtml(project.nombre)}</h3>
                    <p class="portfolio-card-years">${project.inicio} — ${project.fin}</p>
                </div>
            </article>`
            )
            .join("");

        /* Re-observe reveals if main.js already ran */
        container.querySelectorAll(".reveal").forEach((el) => {
            el.classList.add("is-visible");
        });
    };

    containers.forEach(async (container) => {
        const jsonUrl = container.dataset.json || "../data/proyectos.json";
        const imageBase = container.dataset.imageBase || "../linea_de_tiempo/";
        const limit = Number(container.dataset.limit) || 4;

        try {
            const res = await fetch(jsonUrl, { cache: "no-store" });
            if (!res.ok) throw new Error("No se pudo cargar proyectos");
            const raw = await res.json();
            if (!Array.isArray(raw)) throw new Error("Formato inválido");
            const projects = sortProjects(raw).slice(0, limit);
            render(container, projects, imageBase);
        } catch (error) {
            console.error("[Featured projects]", error);
            container.innerHTML = `<p class="iv-projects-error">No se pudieron cargar los proyectos.</p>`;
        }
    });
})();
