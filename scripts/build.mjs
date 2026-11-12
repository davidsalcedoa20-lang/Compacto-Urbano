import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';

const root = process.cwd();
const dist = path.join(root, 'dist');
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist);
const seoTemplates = {
  home: fs.readFileSync('index.html', 'utf8'),
  inmobiliaria: fs.readFileSync('servicios/inmobiliaria.html', 'utf8'),
  interventoria: fs.readFileSync('servicios/interventoria.html', 'utf8'),
  propiedad_horizontal: fs.readFileSync('servicios/propiedad_horizontal.html', 'utf8')
};
fs.mkdirSync('api', { recursive: true });
fs.writeFileSync('api/seo-templates.json', JSON.stringify(seoTemplates));
for (const item of ['index.html', 'admin', 'css', 'js', 'data', 'img', 'img-remplaso', 'Imagenes', 'linea_de_tiempo', 'servicios', 'logo_nexa']) {
  if (fs.existsSync(item)) fs.cpSync(item, path.join(dist, item), { recursive: true });
}
if (fs.existsSync('public')) fs.cpSync('public', dist, { recursive: true });
const define = {
  'process.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL || ''),
  'process.env.SUPABASE_PUBLISHABLE_KEY': JSON.stringify(process.env.SUPABASE_PUBLISHABLE_KEY || '')
};
await build({ entryPoints: ['admin/admin.js'], outfile: 'dist/admin/admin.bundle.js', bundle: true, minify: true, format: 'iife', target: 'es2020', define });
await build({ entryPoints: ['js/site-images.js'], outfile: 'dist/js/site-images.bundle.js', bundle: true, minify: true, format: 'iife', target: 'es2020', define });
await build({ entryPoints: ['js/site-content.js'], outfile: 'dist/js/site-content.bundle.js', bundle: true, minify: true, format: 'iife', target: 'es2020', define });
await build({ entryPoints: ['js/contact-sync.js'], outfile: 'dist/js/contact-sync.bundle.js', bundle: true, minify: true, format: 'iife', target: 'es2020', define });
await build({ entryPoints: ['js/presentation.js'], outfile: 'dist/js/presentation.bundle.js', bundle: true, minify: true, format: 'iife', target: 'es2020', define });
