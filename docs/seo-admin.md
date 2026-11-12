# SEO de Google

La sección **SEO de Google** de `/admin` administra cuatro páginas: inicio, gestión inmobiliaria, interventoría y propiedad horizontal. Cada una tiene un título, una descripción y una opción de indexación. La vista previa del panel es orientativa; Google puede reescribir el título o la descripción que muestra y decide cuándo volver a rastrear una página.

Los ajustes se guardan en el documento `contact` de `public.site_content`, bajo `seo`, usando las políticas RLS y el historial existentes. Los valores predeterminados están en `data/site-content.json`. La publicación actualiza el HTML inicial servido por `/api/seo` y las rutas públicas de Vercel. La respuesta incluye título, meta descripción, URL canónica, robots y etiquetas para compartir. La función usa los valores predeterminados si Supabase no responde; la caché puede conservar una versión anterior unos minutos.

El panel de administración continúa con `noindex,nofollow`. La URL canónica usa `https://compactourbano.com`. La plantilla HTML de la función se regenera con `npm run build`; `api/seo-templates.json` debe actualizarse cuando cambie el HTML fuente.
