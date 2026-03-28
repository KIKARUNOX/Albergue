import { useMemo } from "react";
import type { InasistentesSectionProps } from "../../type/componentProps";
import PageSection from "../templates/PageSection";

type InasistenteResumen = {
  id: string;
  nombre: string;
  sabadosSinAsistir: number;
  ultimaAsistencia?: string;
};

function parseDateOnly(value: string): Date | null {
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function isSaturday(value: string): boolean {
  const date = parseDateOnly(value);
  if (!date) return false;
  return date.getDay() === 6;
}

function formatFecha(value?: string): string {
  if (!value) return "Nunca";
  const date = parseDateOnly(value);
  if (!date) return value;
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function fullName(nombre: string, apellido1?: string, apellido2?: string): string {
  return `${nombre} ${apellido1 ?? ""} ${apellido2 ?? ""}`.replace(/\s+/g, " ").trim();
}

export default function InasistentesSection({ asistencias, personas, threshold = 3 }: InasistentesSectionProps) {
  const inasistentes = useMemo<InasistenteResumen[]>(() => {
    const sabados = [...new Set(asistencias.map((a) => a.fecha).filter(isSaturday))].sort((a, b) => b.localeCompare(a));
    if (sabados.length === 0) return [];

    const asistentesPorFecha = new Map<string, Set<string>>();
    for (const asistencia of asistencias) {
      if (!isSaturday(asistencia.fecha)) continue;
      asistentesPorFecha.set(asistencia.fecha, new Set(asistencia.personas));
    }

    const data = personas
      .map((persona) => {
        let sabadosSinAsistir = 0;
        let ultimaAsistencia: string | undefined;

        for (const fecha of sabados) {
          const asistentes = asistentesPorFecha.get(fecha);
          if (asistentes?.has(persona.id)) {
            ultimaAsistencia = fecha;
            break;
          }
          sabadosSinAsistir += 1;
        }

        return {
          id: persona.id,
          nombre: fullName(persona.nombre, persona.apellido1, persona.apellido2),
          sabadosSinAsistir,
          ultimaAsistencia,
        };
      })
      .filter((item) => item.sabadosSinAsistir > threshold)
      .sort((a, b) => b.sabadosSinAsistir - a.sabadosSinAsistir || a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }));

    return data;
  }, [asistencias, personas, threshold]);

  return (
    <PageSection title={`Mas de ${threshold} sabados sin asistir`}>
      {inasistentes.length === 0 ? (
        <p className="small-text">No hay personas con ausencias mayores al umbral.</p>
      ) : (
        <ul className="compact-list">
          {inasistentes.map((item) => (
            <li key={item.id}>
              <strong>{item.nombre}</strong> - {item.sabadosSinAsistir} sabados sin asistir (ultima asistencia: {formatFecha(item.ultimaAsistencia)})
            </li>
          ))}
        </ul>
      )}
    </PageSection>
  );
}
