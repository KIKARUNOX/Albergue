import { useMemo, useState } from "react";
import type { AsistenciaCreationSectionProps } from "../../type/componentProps";
import Button from "../atoms/Button";
import PersonCheckboxGrid from "../molecules/PersonCheckboxGrid";
import PageSection from "../templates/PageSection";

export default function AsistenciaCreationSection({
  fecha,
  onFechaChange,
  personas,
  seleccionadas,
  onTogglePersona,
  onCreate,
  loading,
}: AsistenciaCreationSectionProps) {
  const [query, setQuery] = useState("");

  const personasFiltradas = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return personas;

    return personas.filter((p) => {
      const nombreCompleto = `${p.nombre} ${p.apellido1 ?? ""} ${p.apellido2 ?? ""}`.trim().toLowerCase();
      return nombreCompleto.includes(normalizedQuery);
    });
  }, [personas, query]);

  return (
    <PageSection title="Nueva asistencia (sabado)">
      <div className="stack-sm">
        <label>
          Fecha
          <input type="date" required value={fecha} onChange={(e) => onFechaChange(e.target.value)} />
        </label>
        <label>
          Buscar por nombre
          <input
            type="text"
            placeholder="Ej. Steven Ramirez"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>

      <h3>Personas asistentes</h3>
      {personasFiltradas.length === 0 ? (
        <p>No se encontraron personas para esa busqueda.</p>
      ) : (
        <PersonCheckboxGrid personas={personasFiltradas} selectedIds={seleccionadas} onToggle={onTogglePersona} />
      )}

      <Button onClick={onCreate} disabled={loading}>
        Crear asistencia
      </Button>
    </PageSection>
  );
}
