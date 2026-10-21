# Panel de imágenes de Compacto Urbano

La página mantiene los archivos originales como respaldo. El inventario se genera de las imágenes locales y de las referencias de HTML, JavaScript y JSON con `npm run inventory`. Una imagen repetida usa la misma ruta original y se sustituye en todas sus apariciones.

Proyecto Supabase independiente: `kjpzeslhiumtvkovdooe` (`https://kjpzeslhiumtvkovdooe.supabase.co`). El esquema, el bucket privado, el administrador y las 53 imágenes iniciales se instalaron y verificaron. Las variables públicas están configuradas en Vercel para producción, preview y desarrollo. El acceso y el ciclo de publicación/restauración se verificaron con `npm run smoke-admin` y `npm run smoke-browser`.

## Activación

1. Crear un proyecto Supabase independiente para Compacto Urbano.
2. Aplicar la migración de `supabase/migrations` con la CLI de Supabase o el editor SQL del proyecto.
3. Crear el administrador con `npm run bootstrap-admin` y las variables locales `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL` y `ADMIN_PASSWORD`. La clave de servicio solo debe usarse localmente para este paso, nunca en Vercel ni en el navegador.
4. Configurar en Vercel `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY` para producción, vista previa y desarrollo. Ejecutar un despliegue nuevo para incorporarlas al paquete JavaScript.
5. Comprobar acceso, publicación, restauración, historial y fallback antes de cambiar el dominio.

Los objetos se guardan en un bucket privado. Los visitantes solo pueden solicitar URLs temporales de archivos que figuran en `published_images`. La tabla `site_images` y el historial solo son visibles para el administrador autenticado. No se debe colocar la clave de servicio en código público. Tras el primer acceso conviene cambiar la contraseña inicial desde Ajustes y activar la protección contra contraseñas filtradas de Supabase Auth.

## Edición de contenido

La migración `20261021153000_editable_content.sql` añade `site_content` y `content_changes`, ambas con RLS. El panel incluye cuatro editores:

- **Línea de tiempo:** añadir, editar, quitar y ordenar proyectos, con año, periodo, nombre, tipo, ubicación, descripción y foto.
- **Carrusel principal:** añadir, editar, ordenar y activar/desactivar diapositivas con etiqueta, título, texto, foto y texto alternativo.
- **Servicios:** editar la etiqueta, nombre y descripción de cada servicio; añadir, quitar y ordenar las fotos de sus minicarruseles.
- **Contacto:** actualizar dirección, correo, teléfono, WhatsApp, mensaje inicial y llamada a la acción. El mapa usa la dirección publicada.

Cada sección se publica por separado. La página usa `data/site-content.json` como contenido inicial y como respaldo si Supabase no responde. Las fotos existentes se eligen del inventario; las nuevas se suben al bucket privado y se publican mediante `published_images`. Al subir una foto, falta publicar la sección para que aparezca en ella. El historial registra publicaciones de contenido e imágenes. Para verificar las cuatro secciones en una vista previa se puede ejecutar `node scripts/smoke-content.mjs` con `TEST_BASE_URL`, `ADMIN_EMAIL` y `ADMIN_PASSWORD`; el script restaura los textos iniciales después de la prueba.
