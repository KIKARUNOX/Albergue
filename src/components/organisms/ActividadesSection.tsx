import type { ActividadesSectionProps } from "../../type/componentProps";
import type { Asistencia } from "../../type/asistencia";
import Button from "../atoms/Button";
import Input from "../atoms/Input";
import Label from "../atoms/Label";
import Select from "../atoms/Select";
import PersonCheckboxGrid from "../molecules/PersonCheckboxGrid";

function ActividadesList({
  asistencia,
  onDelete,
}: {
  asistencia: Asistencia;
  onDelete: (asistenciaId: string, index: number) => void;
}) {
  if (!asistencia.actividades || asistencia.actividades.length === 0) {
    return <p className="small-text">No hay actividades registradas.</p>;
  }

  return (
    <ul className="compact-list">
      {asistencia.actividades.map((act, i) => (
        <li key={i}>
          <strong>{act.nombre}</strong> ({act.tipo === "individual" ? "Individual" : "Equipo"})
          {" — "}Ganador: {act.ganadorNombre}
          {act.tipo === "equipo" && act.equipoMiembros && act.equipoMiembros.length > 0 && (
            <span className="small-text"> ({act.equipoMiembros.length} miembros)</span>
          )}
          <span className="inline-actions">
            <Button
              variant="danger"
              onClick={() => onDelete(asistencia.id, i)}
            >
              Eliminar
            </Button>
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function ActividadesSection({
  asistencias,
  selectedAsistenciaId,
  onSelectedAsistenciaId,
  nombreActividad,
  onNombreActividad,
  tipoActividad,
  onTipoActividad,
  ganadorId,
  onGanadorId,
  nombreEquipo,
  onNombreEquipo,
  equipoMiembros,
  onToggleEquipoMiembro,
  personas,
  onAddActividad,
  onDeleteActividad,
  actividadesError,
}: ActividadesSectionProps) {
  const asistencia = asistencias.find((a) => a.id === selectedAsistenciaId);
  const asistentesOptions = asistencia
    ? personas.filter((p) => asistencia.personas.includes(p.id))
    : [];

  return (
    <div className="stack-sm">
      <Label>
        Selecciona asistencia
        <Select
          value={selectedAsistenciaId}
          onChange={(e) => onSelectedAsistenciaId(e.target.value)}
        >
          <option value="">-- Selecciona --</option>
          {asistencias.map((a) => (
            <option key={a.id} value={a.id}>
              {a.fecha} - {a.personas.length} personas
            </option>
          ))}
        </Select>
      </Label>

      {asistencia && (
        <>
          <h3>Actividades registradas</h3>
          <ActividadesList asistencia={asistencia} onDelete={onDeleteActividad} />

          <hr />

          <h3>Agregar actividad</h3>

          <div className="stack-sm">
            <Input
              type="text"
              placeholder="Nombre de la actividad *"
              value={nombreActividad}
              onChange={(e) => onNombreActividad(e.target.value)}
              maxLength={80}
            />

            <Label>
              Tipo
              <Select
                value={tipoActividad}
                onChange={(e) => onTipoActividad(e.target.value as "individual" | "equipo")}
              >
                <option value="individual">Individual</option>
                <option value="equipo">Equipo</option>
              </Select>
            </Label>

            {tipoActividad === "individual" ? (
              <Label>
                Ganador
                <Select
                  value={ganadorId}
                  onChange={(e) => onGanadorId(e.target.value)}
                >
                  <option value="">-- Selecciona ganador --</option>
                  {asistentesOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} {p.apellido1 ?? ""}
                    </option>
                  ))}
                </Select>
              </Label>
            ) : (
              <>
                <Input
                  type="text"
                  placeholder="Nombre del equipo ganador *"
                  value={nombreEquipo}
                  onChange={(e) => onNombreEquipo(e.target.value)}
                  maxLength={80}
                />
                <p><strong>Miembros del equipo ganador</strong></p>
                <PersonCheckboxGrid
                  personas={asistentesOptions}
                  selectedIds={equipoMiembros}
                  onToggle={onToggleEquipoMiembro}
                />
              </>
            )}
          </div>

          {actividadesError ? (
            <p className="form-message error">{actividadesError}</p>
          ) : null}

          <Button onClick={onAddActividad}>Agregar actividad</Button>
        </>
      )}
    </div>
  );
}
