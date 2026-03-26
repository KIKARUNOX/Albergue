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
  return (
    <PageSection title="Nueva asistencia (sabado)">
      <div className="stack-sm">
        <label>
          Fecha
          <input type="date" value={fecha} onChange={(e) => onFechaChange(e.target.value)} />
        </label>
      </div>

      <h3>Personas asistentes</h3>
      <PersonCheckboxGrid personas={personas} selectedIds={seleccionadas} onToggle={onTogglePersona} />

      <Button onClick={onCreate} disabled={loading}>
        Crear asistencia
      </Button>
    </PageSection>
  );
}
