import type { RetoSectionProps } from "../../type/componentProps";
import Button from "../atoms/Button";
import PersonCheckboxGrid from "../molecules/PersonCheckboxGrid";
import PageSection from "../templates/PageSection";

export default function RetoSection({
  asistencias,
  selectedAsistenciaId,
  onSelectedAsistenciaId,
  nombreReto,
  onNombreReto,
  puntosReto,
  onPuntosReto,
  descripcionReto,
  onDescripcionReto,
  personas,
  personasCompletaron,
  onTogglePersonaCompleto,
  onAddReto,
}: RetoSectionProps) {
  return (
    <PageSection title="Agregar reto a asistencia">
      <label>
        Selecciona asistencia
        <select value={selectedAsistenciaId} onChange={(e) => onSelectedAsistenciaId(e.target.value)}>
          <option value="">-- Selecciona --</option>
          {asistencias.map((a) => (
            <option key={a.id} value={a.id}>
              {a.fecha} - {a.personas.length} personas {a.reto ? "Con reto" : ""}
            </option>
          ))}
        </select>
      </label>

      <div className="stack-sm">
        <input
          type="text"
          placeholder="Nombre del reto *"
          value={nombreReto}
          required
          maxLength={80}
          onChange={(e) => onNombreReto(e.target.value)}
        />
        <input
          type="number"
          min={1}
          step={1}
          placeholder="Puntos"
          value={puntosReto}
          onChange={(e) => onPuntosReto(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
        />
        <textarea
          placeholder="Descripcion del reto *"
          value={descripcionReto}
          required
          maxLength={280}
          onChange={(e) => onDescripcionReto(e.target.value)}
        />
      </div>

      <h3>Personas que completaron el reto</h3>
      <PersonCheckboxGrid personas={personas} selectedIds={personasCompletaron} onToggle={onTogglePersonaCompleto} />

      <Button onClick={onAddReto}>Agregar reto</Button>
    </PageSection>
  );
}
