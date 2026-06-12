export interface Persona {
  id: string;
  nombre: string;
  apellido1?: string;
  apellido2?: string;
  puntos?: number;
}

export interface Reto {
  nombre: string;
  puntos: number;
  descripcion?: string;
}

export interface Actividad {
  nombre: string;
  tipo: "individual" | "equipo";
  ganadorId?: string;
  ganadorNombre: string;
  equipoMiembros?: string[];
}

export interface Asistencia {
  id: string;
  fecha: string;
  personas: string[];
  reto?: Reto;
  completaron: string[];
  actividades?: Actividad[];
}

export type AsistenciaDoc = Partial<{
  fecha: string;
  personas: string[];
  reto: Reto;
  completaron: string[];
  actividades: Actividad[];
}>;
