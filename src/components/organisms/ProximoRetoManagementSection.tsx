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
  estado,
  onGuardarBorrador,
  onProgramar,
  onLimpiar,
  hasReto,
  loading,
}: ProximoRetoManagementSectionProps) {
  const estadoLabel = {
    "sin-reto": "Sin reto",
    borrador: "Borrador",
    programado: "Programado",
    aplicado: "Aplicado",
  }[estado];

  return (
    <PageSection title="Reto de la proxima semana">
      <div className="stack-sm">
        <p className="small-text">
          Flujo por etapas: 1) Guardar borrador, 2) Programar reto, 3) Se aplica
          automaticamente al crear la proxima asistencia.
        </p>
        <p className="small-text">
          Estado actual: <strong>{estadoLabel}</strong>
        </p>
      </div>

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
          onChange={(e) =>
            onPuntos(Math.max(1, Math.floor(Number(e.target.value) || 1)))
          }
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
        <Button
          variant="secondary"
          onClick={onGuardarBorrador}
          disabled={loading}
        >
          Guardar borrador
        </Button>
        <Button onClick={onProgramar} disabled={loading}>
          Programar reto semanal
        </Button>
        <Button variant="secondary" onClick={onLimpiar} disabled={loading}>
          Quitar reto semanal
        </Button>
      </div>

      <p className="small-text">
        Estado contenido: {hasReto ? "Con contenido" : "Vacio"}
      </p>
    </PageSection>
  );
}
