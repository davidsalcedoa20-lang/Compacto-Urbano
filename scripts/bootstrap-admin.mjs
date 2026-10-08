import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Faltan SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL o ADMIN_PASSWORD.');
  process.exit(1);
}
if (ADMIN_PASSWORD.length < 6) {
  console.error('La contraseña debe tener al menos seis caracteres.');
  process.exit(1);
}
const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const { data, error } = await client.auth.admin.createUser({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, email_confirm: true });
if (error) { console.error(error.message); process.exit(1); }
const { error: membershipError } = await client.from('admins').insert({ user_id: data.user.id });
if (membershipError) { console.error(`Usuario creado, pero falta asignar el administrador: ${membershipError.message}`); process.exit(1); }
console.log(`Administrador configurado: ${ADMIN_EMAIL}`);
