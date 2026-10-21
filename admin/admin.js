import { supabase } from '../js/supabase-client.js';

const $ = (selector) => document.querySelector(selector);
const message = (selector, value) => { const node = $(selector); if (node) node.textContent = value; };
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const loginPage = location.pathname.endsWith('/login');

async function isAdmin() {
  if (!supabase) return false;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from('admins').select('user_id').eq('user_id', user.id).maybeSingle();
  return Boolean(data);
}

if (loginPage) {
  $('#login-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (!supabase) return message('#login-message', 'El acceso todavía no está configurado.');
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') || '');
    if (password.length < 6) return message('#login-message', 'La contraseña debe tener al menos seis caracteres.');
    message('#login-message', 'Verificando acceso…');
    const { error } = await supabase.auth.signInWithPassword({ email: String(form.get('email')), password });
    if (error) return message('#login-message', 'No fue posible iniciar sesión. Revisa tus credenciales.');
    if (!(await isAdmin())) { await supabase.auth.signOut(); return message('#login-message', 'Esta cuenta no tiene acceso al panel.'); }
    location.replace('/admin');
  });
  isAdmin().then(ok => { if (ok) location.replace('/admin'); });
} else {
  const state = { rows: [], published: new Map(), active: null, file: null };
  const dialog = $('#editor');
  const fallback = (row) => row.original_path;
  const current = (row) => state.published.get(row.original_path)?.public_url || fallback(row);
  const err = (error) => message('#admin-message', error?.message || 'No fue posible completar la operación.');

  function render() {
    const filter = $('#section-filter').value;
    const search = $('#image-search').value.toLocaleLowerCase();
    const rows = state.rows.filter(row => (!filter || row.section === filter) && `${row.original_path} ${row.alt}`.toLocaleLowerCase().includes(search));
    $('#image-grid').innerHTML = rows.map(row => `<article class="image-card"><img src="${escapeHtml(current(row))}" alt="${escapeHtml(state.published.get(row.original_path)?.alt || row.alt)}" loading="lazy"><div><span class="chip">${escapeHtml(row.section)}</span><h2>${escapeHtml(row.original_path.split('/').pop())}</h2><p>${state.published.has(row.original_path) ? 'Imagen publicada' : 'Imagen original'}</p><button data-edit="${escapeHtml(row.original_path)}">Editar imagen</button></div></article>`).join('') || '<p>No se encontraron imágenes.</p>';
  }

  async function load() {
    const inventory = await fetch('/data/image-inventory.json').then(res => res.json());
    const { data: existing, error: catalogError } = await supabase.from('site_images').select('original_path,section,alt').order('section');
    if (catalogError) return err(catalogError);
    const known = new Set((existing || []).map(row => row.original_path));
    const missing = inventory.filter(row => !known.has(row.original_path)).map(({ original_path, section, alt }) => ({ original_path, section, alt }));
    if (missing.length) {
      const { error } = await supabase.from('site_images').insert(missing);
      if (error) return err(error);
    }
    state.rows = [...(existing || []), ...missing].sort((a, b) => a.section.localeCompare(b.section) || a.original_path.localeCompare(b.original_path));
    const { data: published, error } = await supabase.from('published_images').select('original_path,storage_path,alt');
    if (error) return err(error);
    state.published = new Map();
    for (const row of published || []) {
      const { data: signed } = await supabase.storage.from('site-images').createSignedUrl(row.storage_path, 3600);
      state.published.set(row.original_path, { ...row, public_url: signed?.signedUrl || row.original_path });
    }
    $('#section-filter').innerHTML = '<option value="">Todas las secciones</option>' + [...new Set(state.rows.map(row => row.section))].map(section => `<option value="${escapeHtml(section)}">${escapeHtml(section)}</option>`).join('');
    render();
  }

  function openEditor(path) {
    state.active = state.rows.find(row => row.original_path === path);
    state.file = null;
    const row = state.active;
    $('#editor-title').textContent = row.original_path.split('/').pop();
    $('#editor-path').textContent = row.original_path;
    $('#original-preview').src = fallback(row);
    $('#new-preview').src = current(row);
    $('#image-alt').value = state.published.get(path)?.alt || row.alt;
    $('#image-file').value = '';
    $('#restore-image').disabled = !state.published.has(path);
    message('#editor-message', '');
    dialog.showModal();
  }

  async function publish() {
    const row = state.active;
    const alt = $('#image-alt').value.trim();
    if (!alt) return message('#editor-message', 'Escribe un texto alternativo.');
    $('#publish-image').disabled = true;
    message('#editor-message', 'Publicando cambios…');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const previous = state.published.get(row.original_path);
      let storagePath = previous?.storage_path;
      if (state.file) {
        const ext = state.file.name.split('.').pop().toLowerCase();
        storagePath = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('site-images').upload(storagePath, state.file, { contentType: state.file.type, upsert: false });
        if (uploadError) throw uploadError;
      }
      if (!storagePath) throw new Error('Selecciona una imagen para publicar.');
      const { error } = await supabase.from('published_images').upsert({ original_path: row.original_path, storage_path: storagePath, alt, published_by: user.id, published_at: new Date().toISOString() });
      if (error) throw error;
      const { data: signed } = await supabase.storage.from('site-images').createSignedUrl(storagePath, 3600);
      state.published.set(row.original_path, { original_path: row.original_path, storage_path: storagePath, public_url: signed?.signedUrl || row.original_path, alt });
      render();
      dialog.close();
      message('#admin-message', 'Imagen publicada. La página pública mostrará el cambio al recargarse.');
    } catch (error) { message('#editor-message', error.message); }
    finally { $('#publish-image').disabled = false; }
  }

  async function restore() {
    const row = state.active;
    const previous = state.published.get(row.original_path);
    if (!previous) return;
    $('#restore-image').disabled = true;
    const { error } = await supabase.from('published_images').delete().eq('original_path', row.original_path);
    if (error) { $('#restore-image').disabled = false; return message('#editor-message', error.message); }
    state.published.delete(row.original_path);
    render(); dialog.close();
    message('#admin-message', 'Imagen original restaurada.');
  }

  async function showHistory() {
    const { data, error } = await supabase.from('image_changes').select('original_path,action,changed_at,previous_path,new_path').order('changed_at', { ascending: false }).limit(100);
    if (error) return err(error);
    $('#history-list').innerHTML = (data || []).map(row => `<article class="history-entry"><strong>${row.action === 'restored' ? 'Restaurada' : 'Publicada'}</strong><span>${escapeHtml(row.original_path)}</span><time>${new Date(row.changed_at).toLocaleString('es-CO')}</time></article>`).join('') || '<p>Aún no hay modificaciones.</p>';
  }

  async function init() {
    if (!(await isAdmin())) return location.replace('/admin/login');
    const { data: { user } } = await supabase.auth.getUser();
    $('#current-email').textContent = user.email || '';
    await load();
  }
  if (!supabase) location.replace('/admin/login'); else init();
  $('#image-grid').addEventListener('click', event => { const button = event.target.closest('[data-edit]'); if (button) openEditor(button.dataset.edit); });
  $('#section-filter').addEventListener('change', render);
  $('#image-search').addEventListener('input', render);
  $('#close-editor').addEventListener('click', () => dialog.close());
  $('#image-file').addEventListener('change', event => {
    const file = event.target.files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type)) { event.target.value = ''; return message('#editor-message', 'Formato no admitido.'); }
    if (file.size > 10 * 1024 * 1024) { event.target.value = ''; return message('#editor-message', 'El archivo debe pesar menos de 10 MB.'); }
    state.file = file;
    $('#new-preview').src = URL.createObjectURL(file);
  });
  $('#publish-image').addEventListener('click', publish);
  $('#restore-image').addEventListener('click', restore);
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-view]').forEach(item => item.classList.toggle('active', item === button));
    for (const view of ['images', 'history', 'settings']) $(`#${view}-view`).hidden = button.dataset.view !== view;
    $('#view-title').textContent = ({ images: 'Imágenes de la página', history: 'Historial de cambios', settings: 'Ajustes de la cuenta' })[button.dataset.view];
    if (button.dataset.view === 'history') showHistory();
  }));
  $('#signout').addEventListener('click', async () => { await supabase.auth.signOut({ scope: 'global' }); location.replace('/admin/login'); });
  $('#email-form').addEventListener('submit', async event => { event.preventDefault(); const email = new FormData(event.target).get('email'); const { error } = await supabase.auth.updateUser({ email }); message('#admin-message', error?.message || 'Revisa tu correo para confirmar el cambio.'); });
  $('#password-form').addEventListener('submit', async event => { event.preventDefault(); const password = String(new FormData(event.target).get('password')); if (password.length < 6) return message('#admin-message', 'Mínimo seis caracteres.'); const { error } = await supabase.auth.updateUser({ password }); message('#admin-message', error?.message || 'Contraseña actualizada.'); if (!error) event.target.reset(); });
}
