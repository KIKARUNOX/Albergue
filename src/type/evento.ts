export type Evento = {
  id?: string;
  titulo: string;
  descripcion?: string;
  fecha: string; // ISO format: YYYY-MM-DD
  imagenes: string[]; // URLs de imágenes
  createdAt?: Date;
};
