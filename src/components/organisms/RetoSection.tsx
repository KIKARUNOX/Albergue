import type { RetoSectionProps } from "../../type/componentProps";
import Button from "../atoms/Button";
import Input from "../atoms/Input";
import Label from "../atoms/Label";
import Select from "../atoms/Select";
import TextArea from "../atoms/TextArea";
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
      <Label>
        Selecciona asistencia
        <Select
          value={selectedAsistenciaId}
          onChange={(e) => onSelectedAsistenciaId(e.target.value)}
        >
          <option value="">-- Selecciona --</option>
          {asistencias.map((a) => (
            <option key={a.id} value={a.id}>
              {a.fecha} - {a.personas.length} personas{" "}
              {a.reto ? "Con reto" : ""}
            </option>
          ))}
        </Select>
      </Label>

      <div className="stack-sm">
        <Input
          type="text"
          placeholder="Nombre del reto *"
          value={nombreReto}
          required
          maxLength={80}
          onChange={(e) => onNombreReto(e.target.value)}
        />
        <Input
          type="number"
          min={1}
          step={1}
          placeholder="Puntos"
          value={puntosReto}
          onChange={(e) =>
            onPuntosReto(Math.max(1, Math.floor(Number(e.target.value) || 1)))
          }
        />
        <TextArea
          placeholder="Descripcion del reto *"
          value={descripcionReto}
          required
          maxLength={280}
          rows={4}
          onChange={(e) => onDescripcionReto(e.target.value)}
        />
      </div>

      <h3>Personas que completaron el reto</h3>
      <PersonCheckboxGrid
        personas={personas}
        selectedIds={personasCompletaron}
        onToggle={onTogglePersonaCompleto}
      />

      <Button onClick={onAddReto}>Agregar reto</Button>
    </PageSection>
  );
}
