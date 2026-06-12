import * as XLSX from "xlsx";
import type { ExcelRow } from "../type/componentProps";

export function normalizeHeader(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function findValue(row: ExcelRow, aliases: string[]): unknown {
  const aliasSet = new Set(aliases.map(normalizeHeader));

  for (const [key, value] of Object.entries(row)) {
    if (aliasSet.has(normalizeHeader(key))) {
      return value;
    }
  }

  return undefined;
}

export function toText(v: unknown): string {
  return String(v ?? "").trim();
}

export function toNumber(v: unknown, fallback = 0): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : fallback;
  if (typeof v === "string") {
    const parsed = Number(v.replace(",", ".").trim());
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

export function toDateString(v: unknown): string {
  if (typeof v === "number") {
    const parsed = XLSX.SSF.parse_date_code(v);
    if (!parsed) return "";
    const yyyy = String(parsed.y).padStart(4, "0");
    const mm = String(parsed.m).padStart(2, "0");
    const dd = String(parsed.d).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  return toText(v);
}

export function toBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  if (typeof v === "string") {
    const x = v.trim().toLowerCase();
    return x === "true" || x === "si" || x === "sí" || x === "1" || x === "yes";
  }
  return false;
}

export function downloadExcel(rows: Record<string, unknown>[], sheetName: string, filename: string): void {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
}

export function fullNameFromPersona(persona: { nombre?: string; apellido1?: string; apellido2?: string }): string {
  const nombre = String(persona.nombre ?? "").trim();
  const apellido1 = String(persona.apellido1 ?? "").trim();
  const apellido2 = String(persona.apellido2 ?? "").trim();
  return `${nombre} ${apellido1} ${apellido2}`.replace(/\s+/g, " ").trim();
}

export function timestampForFile(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}
