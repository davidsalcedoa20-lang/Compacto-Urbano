window.initMiniGalleries = (services) => {
    document.querySelectorAll('.thumbs[data-gallery]').forEach((gallery) => {
        const key = gallery.dataset.gallery;
        const photos = services?.[key]?.gallery || [];
        if (!photos.length) return;
        const track = document.createElement('div');
        track.className = 'mini-gallery-track';
        photos.forEach(({ image, alt, fallbackImage }) => {
            if (typeof image !== 'string' || !/^\/(?:Imagenes|linea_de_tiempo|img|img-remplaso|proyectos|content)\//.test(image)) return;
            const photo = document.createElement('img');
            photo.src = image;
            photo.dataset.fallbackImage = typeof fallbackImage === 'string' && /^\/(?:Imagenes|linea_de_tiempo|img|img-remplaso|proyectos|content)\//.test(fallbackImage) ? fallbackImage : '';
            if (photo.dataset.fallbackImage) photo.onerror = () => { photo.onerror = null; photo.src = photo.dataset.fallbackImage; };
            photo.alt = alt || '';
            photo.loading = 'lazy';
            track.appendChild(photo);
        });
        const previous = document.createElement('button');
        const next = document.createElement('button');
        previous.type = next.type = 'button';
        previous.className = 'mini-gallery-arrow mini-gallery-arrow--previous';
        next.className = 'mini-gallery-arrow mini-gallery-arrow--next';
        previous.setAttribute('aria-label', `Imagen anterior de ${key}`);
        next.setAttribute('aria-label', `Imagen siguiente de ${key}`);
        previous.textContent = '‹';
        next.textContent = '›';
        gallery.replaceChildren(previous, track, next);
        const step = (direction) => {
            const first = track.querySelector('img');
            if (!first) return;
            const end = track.scrollWidth - track.clientWidth;
            if (direction > 0 && track.scrollLeft >= end - 4) track.scrollTo({ left: 0, behavior: 'smooth' });
            else if (direction < 0 && track.scrollLeft <= 4) track.scrollTo({ left: end, behavior: 'smooth' });
            else track.scrollBy({ left: direction * (first.getBoundingClientRect().width + 12), behavior: 'smooth' });
        };
        previous.addEventListener('click', () => step(-1));
        next.addEventListener('click', () => step(1));
        window.startCarouselAutoplay(gallery, () => step(1));
    });
};
