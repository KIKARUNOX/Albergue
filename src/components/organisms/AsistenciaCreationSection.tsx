import type { Persona } from "../../type/asistencia";
import Button from "../atoms/Button";
import PersonCheckboxGrid from "../molecules/PersonCheckboxGrid";
import PageSection from "../templates/PageSection";

type AsistenciaCreationSectionProps = {
  fecha: string;
  onFechaChange: (value: string) => void;
  personas: Persona[];
  seleccionadas: string[];
  onTogglePersona: (id: string) => void;
  onCreate: () => void;
  loading: boolean;
};

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
