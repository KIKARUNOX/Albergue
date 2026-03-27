import type { Persona } from "./asistencia";

export type PersonaDetalle = Persona & {
  email?: string;
  telefono?: string;
  localidad?: string;
  fechaNacimiento?: string;
  bautizado?: boolean;
};

export type PersonaForm = Omit<PersonaDetalle, "id">;

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
