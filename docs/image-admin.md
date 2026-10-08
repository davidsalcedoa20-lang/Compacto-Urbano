# Panel de imágenes de Compacto Urbano

La página mantiene los archivos originales como respaldo. El inventario se genera de las imágenes locales y de las referencias de HTML, JavaScript y JSON con `npm run inventory`. Una imagen repetida usa la misma ruta original y se sustituye en todas sus apariciones.

## Activación

1. Crear un proyecto Supabase independiente para Compacto Urbano.
2. Aplicar la migración de `supabase/migrations` con la CLI de Supabase o el editor SQL del proyecto.
3. Crear el administrador con `npm run bootstrap-admin` y las variables locales `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL` y `ADMIN_PASSWORD`. La clave de servicio solo debe usarse localmente para este paso, nunca en Vercel ni en el navegador.
4. Configurar en Vercel `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY` para producción, vista previa y desarrollo. Ejecutar un despliegue nuevo para incorporarlas al paquete JavaScript.
5. Comprobar acceso, publicación, restauración, historial y fallback antes de cambiar el dominio.

Los objetos se guardan en un bucket privado. Los visitantes solo pueden solicitar URLs temporales de archivos que figuran en `published_images`. La tabla `site_images` y el historial solo son visibles para el administrador autenticado. No se debe colocar la clave de servicio en código público.
