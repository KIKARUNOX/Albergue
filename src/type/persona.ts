import type { Persona } from "./asistencia";

export type PersonaRole = "joven" | "coordinador" | "lider";

export type PersonaPermisos = {
  dashboard: boolean;
  asistencias: boolean;
  personas: boolean;
  importacion: boolean;
  gestionarPermisos: boolean;
};

export type PersonaDetalle = Persona & {
  authUid?: string;
  role?: PersonaRole;
  permisos?: Partial<PersonaPermisos>;
  email?: string;
  telefono?: string;
  localidad?: string;
  fechaNacimiento?: string;
  bautizado?: boolean;
};

export type PersonaForm = {
  nombre: string;
  apellido1?: string;
  apellido2?: string;
  email?: string;
  telefono?: string;
  localidad?: string;
  fechaNacimiento?: string;
  bautizado?: boolean;
  puntos?: number;
};

export type PersonaCumple = {
  nombre: string;
  apellido1?: string;
  apellido2?: string;
  fechaNacimiento?: string;
};

export type PersonaPuntaje = {
  id: string;
  nombre: string;
  apellido1?: string;
  apellido2?: string;
  puntos?: number;
};
