const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Run each carousel only while it is on screen. Manual controls remain available.
window.startCarouselAutoplay = (element, advance) => {
    if (reduceMotion) return;
    let timer = null;
    const stop = () => {
        window.clearInterval(timer);
        timer = null;
    };
    const start = () => {
        if (timer !== null) return;
        timer = window.setInterval(() => {
            if (!document.hidden) advance();
        }, 2000);
    };
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.intersectionRatio >= 0.35) start();
            else stop();
        }, { threshold: 0.35 });
        observer.observe(element);
    } else {
        start();
    }
};

document.querySelectorAll('.slideshow').forEach((slideshow) => {
    const slides = [...slideshow.querySelectorAll('.slide')];
    const dotsWrap = slideshow.querySelector('.dots');
    let active = 0;
    if (slides.length < 2 || !dotsWrap) return;
    let dots = [];
    const show = (index) => {
        slides[active].classList.remove('is-active');
        slides[active].setAttribute('aria-hidden', 'true');
        slides[active].inert = true;
        dots[active].classList.remove('is-active');
        active = (index + slides.length) % slides.length;
        slides[active].classList.add('is-active');
        slides[active].setAttribute('aria-hidden', 'false');
        slides[active].inert = false;
        dots[active].classList.add('is-active');
    };
    slides.forEach((slide, index) => {
        slide.setAttribute('aria-hidden', String(index !== 0));
        slide.inert = index !== 0;
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = `dot${index === 0 ? ' is-active' : ''}`;
        dot.setAttribute('aria-label', `Mostrar imagen ${index + 1}`);
        dot.addEventListener('click', () => show(index));
        dotsWrap.appendChild(dot);
    });
    dots = [...dotsWrap.children];
    slideshow.querySelector('.hero-arrow--prev')?.addEventListener('click', () => show(active - 1));
    slideshow.querySelector('.hero-arrow--next')?.addEventListener('click', () => show(active + 1));
    window.startCarouselAutoplay(slideshow, () => show(active + 1));
});
const menuButton = document.querySelector('.menu-button');
const siteNav = document.querySelector('.site-nav');
menuButton?.addEventListener('click', () => {
    const open = siteNav.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(open));
});
siteNav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    siteNav.classList.remove('is-open');
    menuButton?.setAttribute('aria-expanded', 'false');
}));

// Keep the current section visible in the primary navigation.
const sectionLinks = [...document.querySelectorAll('.site-nav a[href^="#"]')];
const observedSections = sectionLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);
if ('IntersectionObserver' in window && observedSections.length) {
    const navObserver = new IntersectionObserver((entries) => {
        const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        sectionLinks.forEach((link) => {
            const active = link.getAttribute('href') === `#${visible.target.id}`;
            link.classList.toggle('is-active', active);
            if (active) link.setAttribute('aria-current', 'page');
            else link.removeAttribute('aria-current');
        });
    }, { rootMargin:'-20% 0px -65% 0px', threshold:[0, .15, .4] });
    observedSections.forEach((section) => navObserver.observe(section));
}
// Reveal content once as it enters the viewport. Reduced-motion visitors see it immediately.
const revealTargets = document.querySelectorAll('.section-title, .service-card, .story-copy, .story-image, .timeline-heading, .timeline-stage, .timeline-controls, .contact-details, .contact-cta, .location h2');
if (!reduceMotion && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('has-reveal');
    revealTargets.forEach((element, index) => {
        element.classList.add('reveal-on-scroll');
        if (element.classList.contains('service-card')) element.style.setProperty('--reveal-delay', `${(index % 3) * 90}ms`);
    });
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -28px 0px' });
    revealTargets.forEach((element) => revealObserver.observe(element));
}

const timeline = document.querySelector('.timeline');
if (timeline) {
    const projects = [
        { year:'2012', period:'2012 — 2013', name:'Conjunto Sabana Grande Reservado 4', type:'Residencial', location:'Bogotá · Zona Franca', image:'linea_de_tiempo/Sabana Grande Reservado 4.jpg' },
        { year:'2013', period:'2013 — 2015', name:'Edificio Torre del Bosque Izquierdo', type:'Residencial', location:'Bogotá · Bosque Izquierdo', image:'linea_de_tiempo/Edificio Torre del Bosque Izquierdo.jpg' },
        { year:'2015', period:'2015 — 2016', name:'Edificio Kasaury', type:'Residencial', location:'Bogotá · Suba', image:'linea_de_tiempo/edificio kasaury.jpg' },
        { year:'2015', period:'2015 — 2022', name:'Conjunto Residencial Casa Grande', type:'Residencial', location:'Bogotá · Ciudad Bolívar', image:'linea_de_tiempo/Conjunto Residencial Casa Grande.jpg' },
        { year:'2017', period:'2017', name:'Conjunto Acanto', type:'Residencial', location:'Bogotá', image:'linea_de_tiempo/Conjunto Acanto.jpg' },
        { year:'2017', period:'2017', name:'Edificio Yerbabuena', type:'Residencial', location:'Bogotá', image:'linea_de_tiempo/edificio yerbabuena.jpg' },
        { year:'2017', period:'2017', name:'Conjunto Residencial Cedro Golf', type:'Residencial', location:'Bogotá · Usaquén', image:'linea_de_tiempo/Cedro Golf.jpg' },
        { year:'2017', period:'2017', name:'Conjunto Residencial Américas', type:'Residencial', location:'Bogotá', image:'linea_de_tiempo/Conjunto Residencial Américas.jpg' },
        { year:'2018', period:'2018 — 2023', name:'Parque Empresarial e Industrial Santa Lucía', type:'Infraestructura', location:'Bogotá', image:'linea_de_tiempo/Parque Empresarial e Industrial Santa Lucía-05 133536.jpg' },
        { year:'2018', period:'2018 — 2019', name:'Conjunto Residencial Las Galias', type:'Residencial', location:'Bogotá · Engativá', image:'linea_de_tiempo/Conjunto Residencial Las Galias.jpg' },
        { year:'2020', period:'2020 — 2024', name:'Edificio Profesionales Tempo', type:'Salud y oficinas', location:'Bucaramanga · Sotomayor', image:'linea_de_tiempo/Edificio Profesionales Tempo.jpg' },
        { year:'2022', period:'2022 — 2023', name:'Conjunto Residencial Akanra', type:'Residencial', location:'Colombia', image:'linea_de_tiempo/Conjunto Residencial Akanra.jpg' },
        { year:'2023', period:'2023 — 2024', name:'Edificio Tierra Firme', type:'Corporativo', location:'Bogotá · Usaquén', image:'linea_de_tiempo/Edificio Tierra Firme.jpg' },
        { year:'2023', period:'2023 — 2024', name:'Conjunto Residencial Cataluña', type:'Residencial', location:'Bogotá · Engativá', image:'linea_de_tiempo/Conjunto Residencial Cataluña.jpg' }
    ];
    const yearsWrap = timeline.querySelector('.timeline-years');
    const stage = timeline.querySelector('.timeline-stage');
    const featured = timeline.querySelector('.timeline-card--featured');
    const previous = timeline.querySelector('.timeline-card--previous');
    const next = timeline.querySelector('.timeline-card--next');
    const progress = timeline.querySelector('.timeline-progress span');
    const counter = timeline.querySelector('.timeline-counter');
    const years = [...new Set(projects.map((project) => project.year))];
    let active = projects.findIndex((project) => project.name.includes('Santa Lucía'));
    let dragStart = null;

    const yearButtons = years.map((year) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'timeline-year';
        button.textContent = year;
        button.setAttribute('role', 'tab');
        button.addEventListener('click', () => {
            active = projects.findIndex((project) => project.year === year);
            renderTimeline();
        });
        yearsWrap.appendChild(button);
        return button;
    });

    const fillSideCard = (card, project) => {
        const image = card.querySelector('img');
        image.src = project.image;
        image.alt = '';
        card.querySelector('h3').textContent = project.name;
        card.querySelector('p').textContent = project.period;
    };

    const renderTimeline = () => {
        const project = projects[active];
        const before = projects[(active - 1 + projects.length) % projects.length];
        const after = projects[(active + 1) % projects.length];
        const image = featured.querySelector('.timeline-featured-image');
        image.src = project.image;
        image.alt = project.name;
        featured.querySelector('.timeline-period').textContent = project.period;
        featured.querySelector('h3').textContent = project.name;
        const facts = featured.querySelectorAll('.timeline-facts strong');
        facts[0].textContent = project.type;
        facts[1].textContent = project.location;
        facts[2].textContent = 'Compacto Urbano';
        fillSideCard(previous, before);
        fillSideCard(next, after);
        progress.style.width = `${((active + 1) / projects.length) * 100}%`;
        counter.textContent = `${String(active + 1).padStart(2, '0')} / ${String(projects.length).padStart(2, '0')}`;
        yearButtons.forEach((button) => {
            const selected = button.textContent === project.year;
            button.classList.toggle('is-active', selected);
            button.setAttribute('aria-selected', String(selected));
            button.tabIndex = selected ? 0 : -1;
        });
        const activeYearButton = yearButtons.find((button) => button.textContent === project.year);
        if (activeYearButton) {
            yearsWrap.scrollTo({ left:activeYearButton.offsetLeft - (yearsWrap.clientWidth - activeYearButton.offsetWidth) / 2, behavior:'smooth' });
        }
    };

    const move = (step) => {
        active = (active + step + projects.length) % projects.length;
        renderTimeline();
    };
    timeline.querySelector('.timeline-arrow--prev').addEventListener('click', () => move(-1));
    timeline.querySelector('.timeline-arrow--next').addEventListener('click', () => move(1));
    previous.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    stage.tabIndex = 0;
    stage.setAttribute('aria-label', 'Carrusel de proyectos. Usa las flechas del teclado para navegar.');
    stage.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') move(-1);
        if (event.key === 'ArrowRight') move(1);
    });
    stage.addEventListener('pointerdown', (event) => {
        // Pointer capture on a button retargets its click to the stage, so leave
        // arrows, year controls and expandable photos to their own handlers.
        if (event.target.closest('button, img, a')) return;
        dragStart = event.clientX;
        stage.classList.add('is-dragging');
        stage.setPointerCapture?.(event.pointerId);
    });
    stage.addEventListener('pointerup', (event) => {
        if (dragStart !== null && Math.abs(event.clientX - dragStart) > 45) move(event.clientX < dragStart ? 1 : -1);
        dragStart = null;
        stage.classList.remove('is-dragging');
    });
    stage.addEventListener('pointercancel', () => {
        dragStart = null;
        stage.classList.remove('is-dragging');
    });
    renderTimeline();
    window.startCarouselAutoplay(timeline, () => move(1));
}
