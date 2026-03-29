export type EventoComentario = {
  id: string;
  autorId: string;
  autorNombre: string;
  texto: string;
  createdAt: string;
};

export type Evento = {
  id?: string;
  titulo: string;
  descripcion?: string;
  comentarios?: EventoComentario[];
  fecha: string; // ISO format: YYYY-MM-DD
  imagenes: string[]; // URLs de imágenes
  createdAt?: Date;
};
