export type Persona = {
  id: string;
  nombre: string;
  apellido1: string;
  apellido2: string;
  sexo: string;
  cedula: string;
  edad: number;
  direccion: string;
  estado_salud: string;
  escolaridad: string;
  familiar: string;
  relacion: string;
  estado: string;
  created_at?: string;
};

export type PersonaForm = {
  nombre: string;
  apellido1: string;
  apellido2: string;
  sexo: string;
  cedula: string;
  edad: number;
  direccion: string;
  estado_salud: string;
  escolaridad: string;
  familiar: string;
  relacion: string;
  estado: string;
};
