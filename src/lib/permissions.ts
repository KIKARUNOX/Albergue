import type { PersonaDetalle, PersonaPermisos, PersonaRole } from "../type/persona";

const BASE_PERMISOS: PersonaPermisos = {
  dashboard: true,
  asistencias: false,
  personas: false,
  importacion: false,
  gestionarPermisos: false,
};

export function defaultPermisosByRole(role: PersonaRole): PersonaPermisos {
  if (role === "joven") {
    return { ...BASE_PERMISOS };
  }

  if (role === "coordinador") {
    return {
      ...BASE_PERMISOS,
      asistencias: true,
      personas: true,
      gestionarPermisos: true,
    };
  }

  return {
    ...BASE_PERMISOS,
    asistencias: true,
    personas: true,
    importacion: true,
    gestionarPermisos: true,
  };
}

export function buildPermisos(persona?: PersonaDetalle | null): PersonaPermisos {
  const role: PersonaRole = persona?.role ?? "coordinador";
  return {
    ...defaultPermisosByRole(role),
    ...(persona?.permisos ?? {}),
  };
}
