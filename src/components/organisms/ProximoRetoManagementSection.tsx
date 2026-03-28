import type { ProximoRetoManagementSectionProps } from "../../type/componentProps";
import Button from "../atoms/Button";
import PageSection from "../templates/PageSection";

export default function ProximoRetoManagementSection({
  nombre,
  onNombre,
  puntos,
  onPuntos,
  descripcion,
  onDescripcion,
  onGuardar,
  onLimpiar,
  hasReto,
  loading,
}: ProximoRetoManagementSectionProps) {
  return (
    <PageSection title="Reto de la proxima semana">
      <p className="small-text">
        Si lo configuras aqui, se agregara automaticamente a la proxima asistencia creada. Es opcional.
      </p>

      <div className="stack-sm">
        <input
          type="text"
          placeholder="Nombre del reto"
          value={nombre}
          maxLength={80}
          onChange={(e) => onNombre(e.target.value)}
        />
        <input
          type="number"
          min={1}
          step={1}
          placeholder="Puntos"
          value={puntos}
          onChange={(e) => onPuntos(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
        />
        <textarea
          placeholder="Descripcion del reto"
          value={descripcion}
          maxLength={280}
          rows={4}
          onChange={(e) => onDescripcion(e.target.value)}
        />
      </div>

      <div className="table-actions">
        <Button onClick={onGuardar} disabled={loading}>Guardar reto semanal</Button>
        <Button variant="secondary" onClick={onLimpiar} disabled={loading}>Quitar reto semanal</Button>
      </div>

      <p className="small-text">Estado actual: {hasReto ? "Activo" : "Sin reto programado"}</p>
    </PageSection>
  );
}
