# Edición de textos y tipografía

En `/admin`, la sección **Textos y tipografía** permite buscar y modificar 233 textos visibles de la página de inicio y las tres páginas individuales de servicios. Si una misma frase aparece varias veces, un cambio actualiza todas sus apariciones. El panel muestra sus ubicaciones. Un campo vacío conserva el texto original; **Restaurar texto** retira una sustitución.

El carrusel principal, la línea de tiempo, los tres servicios principales y los datos de contacto mantienen sus editores específicos. Sus cambios se aplican antes de las sustituciones generales de texto. Para cambiar una dirección, correo o teléfono y su enlace, usa **Contacto**.

La tipografía general y de títulos se elige entre Arial, Trebuchet MS, Georgia y Verdana. Se publica junto con los textos. El sitio utiliza `textContent`, y solo acepta esas cuatro fuentes; no interpreta HTML introducido en el panel.

Los ajustes se guardan dentro de `public.site_content` en el documento `contact`, bajo `presentation`. Así reutilizan la política RLS de administrador y el historial `public.content_changes` ya existentes. El sitio consulta ese documento públicamente y usa `data/site-content.json` como respaldo si Supabase no responde.

Si se agregan textos nuevos en el código, actualiza el catálogo con `node scripts/collect-text.mjs` desde el dominio publicado. Revisa los cambios del catálogo antes de publicarlos porque las sustituciones se identifican por la frase original.
