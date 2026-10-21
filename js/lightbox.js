(() => {
    const isPhoto = (img) => img?.matches?.('main img') && !img.closest('.brand, .logo, .cotizar-brand');

    const dialog = document.createElement('dialog');
    dialog.className = 'image-lightbox';
    dialog.setAttribute('aria-label', 'Imagen ampliada');
    dialog.innerHTML = '<button class="image-lightbox-close" type="button" aria-label="Cerrar imagen ampliada">×</button><figure><img alt=""><figcaption></figcaption></figure>';
    document.body.appendChild(dialog);
    const enlarged = dialog.querySelector('img');
    const caption = dialog.querySelector('figcaption');
    const close = dialog.querySelector('button');
    let lastFocus = null;

    const prepare = () => document.querySelectorAll('main img').forEach((photo) => {
        if (!isPhoto(photo) || photo.classList.contains('image-expandable')) return;
        photo.classList.add('image-expandable');
        photo.tabIndex = 0;
        photo.setAttribute('role', 'button');
        photo.setAttribute('aria-label', `Ampliar imagen: ${photo.alt || photo.closest('.timeline-card')?.querySelector('h3')?.textContent || 'fotografía de proyecto'}`);
    });
    prepare();
    new MutationObserver(prepare).observe(document.querySelector('main'), { childList: true, subtree: true });

    const open = (photo) => {
        if (!photo.currentSrc && !photo.src) return;
        lastFocus = document.activeElement;
        enlarged.src = photo.currentSrc || photo.src;
        const description = photo.alt || photo.closest('.timeline-card')?.querySelector('h3')?.textContent || 'Proyecto de Compacto Urbano';
        enlarged.alt = description;
        caption.textContent = description;
        caption.hidden = false;
        dialog.showModal();
        close.focus();
    };

    document.addEventListener('click', (event) => {
        if (!isPhoto(event.target)) return;
        event.preventDefault();
        event.stopPropagation();
        open(event.target);
    }, true);
    document.addEventListener('keydown', (event) => {
        if (!isPhoto(event.target) || (event.key !== 'Enter' && event.key !== ' ')) return;
        event.preventDefault();
        event.stopPropagation();
        open(event.target);
    }, true);
    close.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
        if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener('close', () => {
        enlarged.removeAttribute('src');
        lastFocus?.focus?.();
    });
})();
