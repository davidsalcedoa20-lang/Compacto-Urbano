import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || !ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error('Faltan variables de prueba.');
const anonymous = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const admin = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const path = `smoke-${randomUUID()}.png`;
const originalPath = '/img/logo/logo.png';
let published = false;
const check = (error, label) => { if (error) throw new Error(`${label}: ${error.message}`); };

try {
  const publicBefore = await anonymous.from('published_images').select('original_path');
  check(publicBefore.error, 'Lectura pública');
  const privateRead = await anonymous.from('site_images').select('original_path').limit(1);
  if ((privateRead.data || []).length) throw new Error('El inventario privado es accesible sin autenticar.');

  const login = await admin.auth.signInWithPassword({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  check(login.error, 'Inicio de sesión');
  const userId = login.data.user?.id;
  if (!userId) throw new Error('La sesión no contiene usuario.');
  const membership = await admin.from('admins').select('user_id').eq('user_id', userId).single();
  check(membership.error, 'Permiso de administrador');
  const inventory = await admin.from('site_images').select('original_path', { count: 'exact', head: true });
  check(inventory.error, 'Inventario');
  if (inventory.count !== 53) throw new Error(`Inventario inesperado: ${inventory.count}`);

  const upload = await admin.storage.from('site-images').upload(path, readFileSync('img/logo/logo.png'), { contentType: 'image/png', upsert: false });
  check(upload.error, 'Carga de imagen');
  const publication = await admin.from('published_images').upsert({ original_path: originalPath, storage_path: path, alt: 'Logo de Compacto Urbano', published_by: userId });
  check(publication.error, 'Publicación');
  published = true;
  const publicAfter = await anonymous.from('published_images').select('original_path,storage_path').eq('original_path', originalPath).single();
  check(publicAfter.error, 'Lectura de publicación');
  const signed = await anonymous.storage.from('site-images').createSignedUrl(path, 60);
  check(signed.error, 'Acceso público a imagen publicada');
  const imageResponse = await fetch(signed.data.signedUrl);
  if (!imageResponse.ok) throw new Error(`Descarga publicada: HTTP ${imageResponse.status}`);
  console.log(`OK: acceso, RLS, ${inventory.count} imágenes, carga, publicación y descarga pública.`);
} finally {
  if (published) {
    const restoration = await admin.from('published_images').delete().eq('original_path', originalPath);
    check(restoration.error, 'Restauración');
    const signedAfter = await anonymous.storage.from('site-images').createSignedUrl(path, 60);
    if (!signedAfter.error) throw new Error('Una imagen restaurada sigue permitiendo nuevas URLs públicas.');
    const history = await admin.from('image_changes').select('action').eq('original_path', originalPath).order('changed_at', { ascending: false }).limit(2);
    check(history.error, 'Historial');
    if (history.data?.map(row => row.action).join(',') !== 'restored,published') throw new Error('El historial no registró publicación y restauración.');
    console.log('OK: restauración, bloqueo de nuevas URLs públicas e historial.');
  }
  await admin.auth.signOut({ scope: 'global' });
}
