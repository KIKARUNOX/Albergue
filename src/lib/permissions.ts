import type { PersonaDetalle, PersonaPermisos, PersonaRole } from "../type/persona";

const BASE_PERMISOS: PersonaPermisos = {
  dashboard: true,
  asistencias: false,
  personas: false,
  importacion: false,
  gestionarPermisos: false,
};

export function normalizeRole(rawRole?: string): PersonaRole {
  const role = rawRole?.trim().toLowerCase();

  if (role === "coordinador" || role === "cordinador") {
    return "coordinador";
  }

  if (role === "lider") {
    return "lider";
  }

  return "joven";
}

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

  if (role === "lider") {
    return {
      ...BASE_PERMISOS,
      asistencias: true,
      personas: true,
      importacion: true,
      gestionarPermisos: true,
    };
  }

  return { ...BASE_PERMISOS };
}

export function buildPermisos(persona?: PersonaDetalle | null): PersonaPermisos {
  const role = normalizeRole(persona?.role);
  return {
    ...defaultPermisosByRole(role),
    ...(persona?.permisos ?? {}),
  };
}
