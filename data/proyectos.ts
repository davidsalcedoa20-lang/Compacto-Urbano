/**
 * Esquema de referencia para proyectos del Portafolio.
 * La fuente de verdad en runtime es `proyectos.json`
 * (el sitio actual es HTML estático y carga el JSON vía fetch).
 *
 * Para agregar un proyecto: edita `data/proyectos.json` y coloca
 * la imagen en `linea_de_tiempo/` con el mismo nombre de archivo.
 */

export type Proyecto = {
  nombre: string;
  inicio: number;
  fin: number;
  /** Nombre del archivo dentro de /linea_de_tiempo */
  imagen: string;
  /** URL opcional. Si está vacío, se oculta el botón "Ver proyecto". */
  link?: string;
};

export type Proyectos = Proyecto[];
