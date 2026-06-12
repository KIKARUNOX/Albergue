import type { ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from "react";
import type { Asistencia, Persona } from "./asistencia";
import type { PersonaDetalle, PersonaPermisos } from "./persona";

export type ButtonVariant = "primary" | "secondary" | "danger";

export type ButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export type LabelProps = {
  children: ReactNode;
  htmlFor?: string;
  required?: boolean;
  className?: string;
};

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export type SpinnerProps = {
  text?: string;
};

export type StatusMessageProps = {
  message: string;
};

export type PersonCheckboxGridProps = {
  personas: Persona[];
  selectedIds: string[];
  onToggle: (id: string) => void;
};

export type PageSectionProps = {
  title: string;
  children: ReactNode;
};

export type AppHeaderProps = {
  onLogout: () => void;
  persona?: PersonaDetalle | null;
};

export type AppNavigationProps = {
  permisos: PersonaPermisos;
};

export type PersonasPageViewProps = {
  canManagePermissions: boolean;
};

export type ProfileSectionProps = {
  personaId: string;
  persona: PersonaDetalle;
};

export type CalendarSectionProps = {
  onlyCurrentMonth?: boolean;
};

export type LeaderboardSectionProps = {
  limit?: number;
};

export type AsistenciaCreationSectionProps = {
  fecha: string;
  onFechaChange: (value: string) => void;
  personas: Persona[];
  seleccionadas: string[];
  onTogglePersona: (id: string) => void;
  onCreate: () => void;
  loading: boolean;
};

export type RetoSectionProps = {
  asistencias: Asistencia[];
  selectedAsistenciaId: string;
  onSelectedAsistenciaId: (id: string) => void;
  nombreReto: string;
  onNombreReto: (value: string) => void;
  puntosReto: number;
  onPuntosReto: (value: number) => void;
  descripcionReto: string;
  onDescripcionReto: (value: string) => void;
  personas: Persona[];
  personasCompletaron: string[];
  onTogglePersonaCompleto: (id: string) => void;
  onAddReto: () => void;
};

export type AsistenciasListSectionProps = {
  asistencias: Asistencia[];
  personas: Persona[];
  loading: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onEdit: (id: string) => void;
  onOpenReto: (id: string) => void;
  onDelete: (id: string) => void;
  onViewDetails: (id: string) => void;
};

export type ActividadesSectionProps = {
  asistencias: Asistencia[];
  selectedAsistenciaId: string;
  onSelectedAsistenciaId: (id: string) => void;
  nombreActividad: string;
  onNombreActividad: (value: string) => void;
  tipoActividad: "individual" | "equipo";
  onTipoActividad: (value: "individual" | "equipo") => void;
  ganadorId: string;
  onGanadorId: (value: string) => void;
  nombreEquipo: string;
  onNombreEquipo: (value: string) => void;
  equipoMiembros: string[];
  onToggleEquipoMiembro: (id: string) => void;
  personas: Persona[];
  onAddActividad: () => void;
  onDeleteActividad: (asistenciaId: string, index: number) => void;
  actividadesError: string;
};

export type ActividadesTopSectionProps = Record<string, never>;

export type InasistentesSectionProps = {
  asistencias: Asistencia[];
  personas: Persona[];
  threshold?: number;
};

export type ProximoRetoManagementSectionProps = {
  nombre: string;
  onNombre: (value: string) => void;
  puntos: number;
  onPuntos: (value: number) => void;
  descripcion: string;
  onDescripcion: (value: string) => void;
  estado: "sin-reto" | "borrador" | "programado" | "aplicado";
  onGuardarBorrador: () => void;
  onProgramar: () => void;
  onLimpiar: () => void;
  hasReto: boolean;
  loading: boolean;
};

export type ExcelRow = Record<string, unknown>;

export type RegistrarPersonaFormData = {
  nombre: string;
  apellido1: string;
  apellido2: string;
  email: string;
  telefono: string;
  localidad: string;
  fechaNacimiento: string;
  bautizado: boolean;
};
