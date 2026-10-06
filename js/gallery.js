(() => {
    const additions = {
        inmobiliaria: [
            ['Imagenes/1. INMOBILIARIA/1. venta-Arriendo-venta de Apartamentos-casas-vivienda-campestre-inmobiliaria-compactourbano.jpg', 'Vivienda disponible para compra o arriendo'],
            ['Imagenes/1. INMOBILIARIA/3. casa-Arriendo-venta de Apartamentos-casas-vivienda-campestre-inmobiliaria-compactourbano.jpg', 'Casa campestre'],
            ['Imagenes/1. INMOBILIARIA/4. inmobiliaria-compactourbano-valores-compactourbano-cortes&useche.jpg', 'Acompañamiento inmobiliario']
        ],
        interventoria: [
            ['Imagenes/2. INTERVENTORIA/INTERVENTORIA - COMPACTO URBANO.jpg', 'Interventoría de obra'],
            ['Imagenes/2. INTERVENTORIA/planeacion-obra-diseño-control-compactourbano-diseño-soldadura-pernos.jpg', 'Planeación y control de obra'],
            ['Imagenes/2. INTERVENTORIA/SUPERVISION DE OBRA - COMPACTO URBANO.jpg', 'Supervisión de obra'],
            ['Imagenes/2. INTERVENTORIA/ESTRUCTURA - COMPACTO URBANO.jpg', 'Estructura supervisada']
        ],
        construccion: [
            ['Imagenes/3. CONSTRUCCION/ESTRUCTURA METALICA - COMPACTO URBANO-CONEXION-compactourbano-diseño-.jpg', 'Estructura metálica'],
            ['Imagenes/3. CONSTRUCCION/FACHaDA FLOTANTE-pergola-construccion-conjuntoresidencial-ESTRUCTURA-METALICA-CONEXION-compactourbano-diseño-soldadura-pernos.jpg', 'Construcción de fachada'],
            ['Imagenes/3. CONSTRUCCION/FACHaDA FLOTANTE-pergola-construccion-campestres-porteria de acceso-conjuntoresidencialESTRUCTURA-METALICA-CONEXION-compactourbano-diseño-soldadura-pernos.jpg', 'Portería de acceso'],
            ['Imagenes/3. CONSTRUCCION/FACHaDA FLOTANTE-pergola-construccion-campestres-porteria de acceso-conjuntoresidencial-ESTRUCTURA-METALICA-CONEXION-compactourbano-diseño-soldadura-pernos.jfif', 'Detalle de fachada']
        ]
    };

    document.querySelectorAll('.thumbs[data-gallery]').forEach((gallery) => {
        const track = document.createElement('div');
        track.className = 'mini-gallery-track';
        while (gallery.firstChild) track.appendChild(gallery.firstChild);
        (additions[gallery.dataset.gallery] || []).forEach(([src, alt]) => {
            const photo = document.createElement('img');
            photo.src = src;
            photo.alt = alt;
            photo.loading = 'lazy';
            track.appendChild(photo);
        });
        const previous = document.createElement('button');
        const next = document.createElement('button');
        previous.type = next.type = 'button';
        previous.className = 'mini-gallery-arrow mini-gallery-arrow--previous';
        next.className = 'mini-gallery-arrow mini-gallery-arrow--next';
        previous.setAttribute('aria-label', `Imagen anterior de ${gallery.dataset.gallery}`);
        next.setAttribute('aria-label', `Imagen siguiente de ${gallery.dataset.gallery}`);
        previous.textContent = '‹';
        next.textContent = '›';
        gallery.append(previous, track, next);
        const step = (direction) => {
            const end = track.scrollWidth - track.clientWidth;
            if (direction > 0 && track.scrollLeft >= end - 4) {
                track.scrollTo({ left:0, behavior:'smooth' });
            } else if (direction < 0 && track.scrollLeft <= 4) {
                track.scrollTo({ left:end, behavior:'smooth' });
            } else {
                track.scrollBy({ left:direction * (track.querySelector('img').getBoundingClientRect().width + 12), behavior:'smooth' });
            }
        };
        previous.addEventListener('click', () => step(-1));
        next.addEventListener('click', () => step(1));
        window.startCarouselAutoplay(gallery, () => step(1));
    });
})();
