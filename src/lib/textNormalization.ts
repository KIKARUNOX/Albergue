import { normalizeRole } from "./permissions";
import type { PersonaRole } from "../type/persona";

export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizeName(value?: string): string {
  const text = normalizeWhitespace(value ?? "").toLowerCase();
  if (!text) return "";

  return text
    .split(" ")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : ""))
    .join(" ");
}

export function normalizeEmail(value?: string): string {
  return normalizeWhitespace(value ?? "").toLowerCase();
}

export function normalizePhone(value?: string): string {
  return normalizeWhitespace(value ?? "");
}

export function normalizeRoleValue(value?: string): PersonaRole {
  return normalizeRole(value);
}
