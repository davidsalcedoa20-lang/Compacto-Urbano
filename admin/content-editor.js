import defaults from '../data/site-content.json';

const $ = selector => document.querySelector(selector);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const clone = value => structuredClone(value);
const titleFor = path => { const name = path.split('/').pop() || path; try { return decodeURIComponent(name).replace(/[-_]/g, ' '); } catch { return name; } };
const targetAttrs = (section, index, service = '', photo = '') => `data-section="${section}" data-index="${index}"${service ? ` data-service="${service}"` : ''}${photo !== '' ? ` data-photo="${photo}"` : ''}`;
const textField = (label, field, value, attrs, options = {}) => `<label>${label}<input type="${options.type || 'text'}" data-field="${field}" ${attrs} value="${escapeHtml(value)}" maxlength="${options.max || 180}" ${options.required === false ? '' : 'required'}></label>`;
const areaField = (label, field, value, attrs, max = 400) => `<label>${label}<textarea data-field="${field}" ${attrs} maxlength="${max}">${escapeHtml(value)}</textarea></label>`;

export async function initContentEditor({ supabase, imageState, refreshImages, notify }) {
  const state = clone(defaults);
  const { data: saved, error } = await supabase.from('site_content').select('content_key,document');
  if (error) notify(`No fue posible cargar el contenido: ${error.message}`);
  else for (const row of saved || []) if (Object.hasOwn(state, row.content_key) && row.document) state[row.content_key] = row.document;

  const previewUrl = path => imageState.published.get(path)?.public_url || path || '';
  const picker = (item, attrs) => {
    const options = imageState.rows.map(row => `<option value="${escapeHtml(row.original_path)}" ${row.original_path === item.image ? 'selected' : ''}>${escapeHtml(row.section)} · ${escapeHtml(titleFor(row.original_path))}</option>`).join('');
    const extra = item.image && !imageState.rows.some(row => row.original_path === item.image) ? `<option value="${escapeHtml(item.image)}" selected>${escapeHtml(titleFor(item.image))}</option>` : '';
    return `<div class="content-image-picker"><img data-preview src="${escapeHtml(previewUrl(item.image))}" alt="Vista previa de la imagen"><div><label>Fotografía<select data-field="image" ${attrs}>${extra}${options}</select></label><label class="upload-label">Subir nueva foto<input type="file" data-upload ${attrs} accept="image/jpeg,image/png,image/webp,image/avif"></label></div></div>`;
  };
  const actions = (section, index, service = '', photo = '') => `<div class="row-actions"><button type="button" class="secondary" data-op="up" data-list="${section}" data-index="${index}" data-service="${service}" data-photo="${photo}" aria-label="Subir posición">↑</button><button type="button" class="secondary" data-op="down" data-list="${section}" data-index="${index}" data-service="${service}" data-photo="${photo}" aria-label="Bajar posición">↓</button><button type="button" class="danger" data-op="remove" data-list="${section}" data-index="${index}" data-service="${service}" data-photo="${photo}">Quitar</button></div>`;

  function renderHero() {
    $('#hero-editor').innerHTML = state.hero.map((slide, index) => {
      const attrs = targetAttrs('hero', index);
      return `<article class="content-card"><div class="content-card-head"><h2>Diapositiva ${index + 1}</h2>${actions('hero', index)}</div>${picker(slide, attrs)}<div class="content-fields">${textField('Etiqueta', 'eyebrow', slide.eyebrow, attrs)}${textField('Título', 'title', slide.title, attrs, { max: 100 })}${areaField('Descripción', 'text', slide.text, attrs)}${textField('Texto alternativo de la foto', 'alt', slide.alt, attrs)}</div><label class="toggle-label"><input type="checkbox" data-field="enabled" ${attrs} ${slide.enabled !== false ? 'checked' : ''}> Mostrar esta diapositiva</label></article>`;
    }).join('');
  }

  function renderTimeline() {
    $('#timeline-editor').innerHTML = state.timeline.map((project, index) => {
      const attrs = targetAttrs('timeline', index);
      return `<article class="content-card"><div class="content-card-head"><h2>${escapeHtml(project.name || `Proyecto ${index + 1}`)}</h2>${actions('timeline', index)}</div>${picker(project, attrs)}<div class="content-fields">${textField('Año en la línea', 'year', project.year, attrs, { max: 4 })}${textField('Periodo de participación', 'period', project.period, attrs, { max: 40 })}${textField('Nombre del proyecto', 'name', project.name, attrs, { max: 120 })}${textField('Tipo', 'type', project.type, attrs, { max: 80 })}${textField('Ubicación', 'location', project.location, attrs, { max: 100 })}${areaField('Descripción opcional', 'description', project.description || '', attrs, 300)}</div></article>`;
    }).join('');
  }

  function renderServices() {
    $('#services-editor').innerHTML = ['inmobiliaria', 'interventoria', 'construccion'].map(key => {
      const service = state.services[key];
      const attrs = targetAttrs('services', 0, key);
      const photos = service.gallery.map((photo, index) => {
        const photoAttrs = targetAttrs('services', 0, key, index);
        return `<div class="gallery-editor-row"><div class="content-card-head"><h3>Foto ${index + 1}</h3>${actions('services', 0, key, index)}</div>${picker(photo, photoAttrs)}${textField('Texto alternativo', 'alt', photo.alt, photoAttrs)}</div>`;
      }).join('');
      return `<article class="content-card"><h2>${escapeHtml(service.title)}</h2><div class="content-fields">${textField('Etiqueta', 'kicker', service.kicker, attrs)}${textField('Nombre del servicio', 'title', service.title, attrs)}${areaField('Descripción', 'description', service.description, attrs)}</div><h3>Minicarrusel de fotos</h3>${photos}<button type="button" class="secondary" data-op="add-photo" data-service="${key}">Añadir foto</button></article>`;
    }).join('');
  }

  function renderContact() {
    const contact = state.contact;
    const attrs = 'data-section="contact" data-index="0"';
    $('#contact-editor').innerHTML = `<article class="content-card"><h2>Datos de contacto</h2><div class="content-fields">${textField('Dirección', 'address', contact.address, attrs)}${textField('Correo electrónico', 'email', contact.email, attrs, { type: 'email' })}${textField('Teléfono visible', 'phone', contact.phone, attrs)}${textField('WhatsApp con indicativo, solo números', 'whatsapp', contact.whatsapp, attrs)}${areaField('Mensaje inicial de WhatsApp', 'whatsappMessage', contact.whatsappMessage, attrs)}${textField('Título de la llamada a la acción', 'heading', contact.heading, attrs, { max: 140 })}${areaField('Texto de la llamada a la acción', 'text', contact.text, attrs)}</div></article>`;
  }

  const renderers = { hero: renderHero, timeline: renderTimeline, services: renderServices, contact: renderContact };
  Object.values(renderers).forEach(render => render());
  document.querySelectorAll('#hero-add,#timeline-add,[data-publish]').forEach(button => { button.disabled = false; });

  function fieldTarget(element) {
    const section = element.dataset.section;
    if (section === 'contact') return state.contact;
    if (section === 'services') {
      const service = state.services[element.dataset.service];
      return element.dataset.photo !== undefined ? service.gallery[Number(element.dataset.photo)] : service;
    }
    return state[section]?.[Number(element.dataset.index)];
  }

  document.querySelectorAll('#hero-view,#timeline-view,#services-view,#contact-view').forEach(view => {
    view.addEventListener('input', event => {
      const input = event.target.closest('[data-field]');
      if (!input || input.type === 'file') return;
      const target = fieldTarget(input);
      if (!target) return;
      target[input.dataset.field] = input.type === 'checkbox' ? input.checked : input.value;
      if (input.dataset.field === 'image') input.closest('.content-image-picker').querySelector('[data-preview]').src = previewUrl(input.value);
    });
    view.addEventListener('change', async event => {
      const input = event.target;
      if (input.matches('[data-field]')) {
        const target = fieldTarget(input);
        if (target) target[input.dataset.field] = input.type === 'checkbox' ? input.checked : input.value;
        if (input.dataset.field === 'image') input.closest('.content-image-picker').querySelector('[data-preview]').src = previewUrl(input.value);
      }
      if (input.matches('[data-upload]') && input.files[0]) await uploadImage(input);
    });
    view.addEventListener('click', event => {
      const button = event.target.closest('[data-op]');
      if (!button) return;
      const { op, list, service, photo } = button.dataset;
      if (op === 'add-photo') {
        state.services[service].gallery.push({ image: imageState.rows[0]?.original_path || '', alt: '' });
        return renderServices();
      }
      const array = list === 'services' ? state.services[service].gallery : state[list];
      const index = list === 'services' ? Number(photo) : Number(button.dataset.index);
      if (!array || Number.isNaN(index)) return;
      if (op === 'remove') array.splice(index, 1);
      if (op === 'up' && index > 0) [array[index - 1], array[index]] = [array[index], array[index - 1]];
      if (op === 'down' && index < array.length - 1) [array[index + 1], array[index]] = [array[index], array[index + 1]];
      renderers[list]();
    });
  });

  $('#hero-add').addEventListener('click', () => {
    state.hero.push({ id: crypto.randomUUID(), enabled: true, eyebrow: '', title: '', text: '', image: imageState.rows[0]?.original_path || '', alt: '' });
    renderHero();
  });
  $('#timeline-add').addEventListener('click', () => {
    state.timeline.push({ id: crypto.randomUUID(), year: String(new Date().getFullYear()), period: String(new Date().getFullYear()), name: '', type: '', location: '', description: '', image: imageState.rows[0]?.original_path || '' });
    renderTimeline();
  });

  async function uploadImage(input) {
    const file = input.files[0];
    const mime = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' };
    if (!mime[file.type] || file.size > 10 * 1024 * 1024) return notify('La foto debe ser JPG, PNG, WebP o AVIF y pesar menos de 10 MB.');
    const item = fieldTarget(input);
    const section = input.dataset.section;
    const alt = item.alt || item.name || item.title || 'Foto de Compacto Urbano';
    const name = `${crypto.randomUUID()}.${mime[file.type]}`;
    const storagePath = `content/${name}`;
    const originalPath = `/content/${name}`;
    input.disabled = true;
    notify('Subiendo foto…');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error: uploadError } = await supabase.storage.from('site-images').upload(storagePath, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      const { error: catalogError } = await supabase.from('site_images').insert({ original_path: originalPath, section: 'Contenido', alt });
      if (catalogError) throw catalogError;
      const { error: publishError } = await supabase.from('published_images').insert({ original_path: originalPath, storage_path: storagePath, alt, published_by: user.id });
      if (publishError) throw publishError;
      const { data: signed } = await supabase.storage.from('site-images').createSignedUrl(storagePath, 3600);
      imageState.rows.push({ original_path: originalPath, section: 'Contenido', alt });
      imageState.published.set(originalPath, { original_path: originalPath, storage_path: storagePath, alt, public_url: signed?.signedUrl || originalPath });
      item.fallbackImage = item.fallbackImage || item.image;
      item.image = originalPath;
      renderers[section]();
      await refreshImages();
      notify('Foto cargada. Publica la sección para mostrarla en la página.');
    } catch (error) { notify(`No fue posible subir la foto: ${error.message}`); input.disabled = false; }
  }

  function validate(key) {
    if (key === 'hero') {
      if (!state.hero.length || !state.hero.some(item => item.enabled !== false)) return 'Deja al menos una diapositiva activa.';
      if (state.hero.some(item => !item.title?.trim() || !item.image || !item.alt?.trim())) return 'Completa título, fotografía y texto alternativo de cada diapositiva.';
    }
    if (key === 'timeline') {
      if (!state.timeline.length) return 'Añade al menos un proyecto.';
      if (state.timeline.some(item => !/^\d{4}$/.test(item.year) || !item.period?.trim() || !item.name?.trim() || !item.type?.trim() || !item.location?.trim() || !item.image)) return 'Completa año, periodo, nombre, tipo, ubicación y fotografía de cada proyecto.';
    }
    if (key === 'services') {
      if (Object.values(state.services).some(item => !item.kicker?.trim() || !item.title?.trim() || !item.description?.trim() || !item.gallery.length || item.gallery.some(photo => !photo.image || !photo.alt?.trim()))) return 'Completa los textos y deja al menos una foto con texto alternativo por servicio.';
    }
    if (key === 'contact') {
      const c = state.contact;
      if (!c.address?.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.email) || !c.phone?.trim() || !/^\d{10,15}$/.test(c.whatsapp.replace(/\D/g, '')) || !c.whatsappMessage?.trim() || !c.heading?.trim() || !c.text?.trim()) return 'Completa dirección, correo válido, teléfono, WhatsApp con indicativo y los textos de contacto.';
    }
    return '';
  }

  document.querySelectorAll('[data-publish]').forEach(button => button.addEventListener('click', async () => {
    const key = button.dataset.publish;
    const problem = validate(key);
    if (problem) return notify(problem);
    button.disabled = true;
    notify('Publicando cambios…');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error: saveError } = await supabase.from('site_content').upsert({ content_key: key, document: state[key], updated_by: user.id, updated_at: new Date().toISOString() });
      if (saveError) throw saveError;
      notify(`${({ hero: 'Carrusel', timeline: 'Línea de tiempo', services: 'Servicios', contact: 'Contacto' })[key]} publicado. Recarga la página pública para ver los cambios.`);
    } catch (error) { notify(`No fue posible publicar: ${error.message}`); }
    finally { button.disabled = false; }
  }));

  return {
    async history() {
      const { data, error: historyError } = await supabase.from('content_changes').select('content_key,changed_at').order('changed_at', { ascending: false }).limit(100);
      if (historyError) throw historyError;
      return (data || []).map(row => ({ label: 'Contenido publicado', detail: ({ hero: 'Carrusel principal', timeline: 'Línea de tiempo', services: 'Servicios', contact: 'Contacto' })[row.content_key] || row.content_key, changed_at: row.changed_at }));
    }
  };
}
