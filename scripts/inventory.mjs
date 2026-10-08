import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sources = ['index.html', ...fs.readdirSync('servicios').filter(x => x.endsWith('.html')).map(x => `servicios/${x}`), ...fs.readdirSync('js').filter(x => x.endsWith('.js') && x !== 'site-images.js').map(x => `js/${x}`), 'data/servicios.json', 'data/proyectos.json'];
const imageRe = /(?:\.\.\/)*(?:Imagenes|img|img-remplaso|linea_de_tiempo|public\/proyectos)\/[^'"`<>\r\n)]+?\.(?:jpe?g|png|webp|avif|jfif)/giu;
const inventory = new Map();
function section(file, src) {
  if (/logo/i.test(src)) return 'Identidad';
  if (/linea_de_tiempo|proyectos/i.test(src)) return 'Proyectos y experiencia';
  if (/INMOBILIARIA|inmobiliaria|propiedad/i.test(src)) return 'Inmobiliaria';
  if (/INTERVENTORIA|interventoria/i.test(src)) return 'Interventoría';
  if (/CONSTRUCCION|construccion/i.test(src)) return 'Construcción';
  if (/hero/i.test(src)) return 'Inicio';
  return /servicios\//.test(file) ? 'Servicios' : 'Nosotros';
}
for (const file of sources) {
  const body = fs.readFileSync(path.join(root, file), 'utf8').replaceAll('&amp;', '&');
  for (const match of body.matchAll(imageRe)) {
    const original = match[0].replace(/^(\.\.\/)+/, '').replace(/^public\//, '');
    const full = path.join(root, match[0].replace(/^(\.\.\/)+/, ''));
    if (!fs.existsSync(full) && !fs.existsSync(path.join(root, 'public', original))) continue;
    const key = '/' + original.replaceAll('\\', '/');
    if (!inventory.has(key)) inventory.set(key, { original_path: key, section: section(file, key), alt: path.basename(key).replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '), appearances: [] });
    inventory.get(key).appearances.push(file);
  }
}
function visit(directory) {
  if (!fs.existsSync(directory)) return;
  for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, item.name);
    if (item.isDirectory()) { visit(full); continue; }
    if (!/\.(?:jpe?g|png|webp|avif|jfif)$/i.test(item.name)) continue;
    const relative = path.relative(root, full).replaceAll('\\', '/').replace(/^public\//, '');
    const key = '/' + relative;
    if (!inventory.has(key)) inventory.set(key, { original_path: key, section: section(relative, key), alt: path.basename(key).replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '), appearances: [] });
  }
}
for (const folder of ['Imagenes', 'img', 'img-remplaso', 'linea_de_tiempo', 'public/proyectos']) visit(path.join(root, folder));
for (const entry of inventory.values()) entry.appearances = [...new Set(entry.appearances)];
const rows = [...inventory.values()].sort((a, b) => a.section.localeCompare(b.section) || a.original_path.localeCompare(b.original_path));
const destination = path.join(root, 'data', 'image-inventory.json');
const output = JSON.stringify(rows, null, 2) + '\n';
if (process.argv.includes('--check')) {
  if (!fs.existsSync(destination) || fs.readFileSync(destination, 'utf8') !== output) { console.error('El inventario necesita actualizarse'); process.exit(1); }
} else fs.writeFileSync(destination, output);
console.log(`${rows.length} imágenes únicas en el inventario`);
