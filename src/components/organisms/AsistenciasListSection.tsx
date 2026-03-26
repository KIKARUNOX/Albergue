import { useState } from "react";
import type { Asistencia } from "../../type/asistencia";
import type { AsistenciasListSectionProps } from "../../type/componentProps";
import Button from "../atoms/Button";
import PersonCheckboxGrid from "../molecules/PersonCheckboxGrid";
import PageSection from "../templates/PageSection";

export default function AsistenciasListSection({
  asistencias,
  personas,
  loading,
  getNombrePersona,
  ordenarIdsPorNombre,
  onUpdate,
  onOpenReto,
  onDelete,
}: AsistenciasListSectionProps) {
  const [expandedId, setExpandedId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editFecha, setEditFecha] = useState("");
  const [editPersonas, setEditPersonas] = useState<string[]>([]);

  const startEdit = (asistencia: Asistencia) => {
    setEditingId(asistencia.id);
    setExpandedId(asistencia.id);
    setEditFecha(asistencia.fecha);
    setEditPersonas(asistencia.personas);
  };

  const toggleEditPersona = (id: string) => {
    setEditPersonas((prev) => (prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]));
  };

  return (
    <PageSection title="Asistencias registradas">
      {loading ? (
        <p>Cargando...</p>
      ) : asistencias.length === 0 ? (
        <p>No hay asistencias registradas.</p>
      ) : (
        <div className="stack-sm">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Asistentes</th>
                  <th>Reto</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {asistencias.map((a) => (
                  <tr key={a.id}>
                    <td>{a.fecha}</td>
                    <td>{a.personas.length}</td>
                    <td>{a.reto ? a.reto.nombre : "Sin reto"}</td>
                    <td>
                      <div className="table-actions">
                        <Button
                          variant="secondary"
                          onClick={() => setExpandedId((prev) => (prev === a.id ? "" : a.id))}
                        >
                          {expandedId === a.id ? "Ocultar" : "Ver detalles"}
                        </Button>
                        <Button variant="secondary" onClick={() => startEdit(a)}>
                          Editar
                        </Button>
                        <Button onClick={() => onOpenReto(a.id)}>Agregar reto</Button>
                        <Button variant="danger" onClick={() => onDelete(a.id)}>
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {asistencias.map((a) => {
            if (expandedId !== a.id) return null;

            return (
              <article key={`${a.id}-detail`} className="detail-card stack-sm">
                <h3>Detalle de asistencia ({a.fecha})</h3>

                <p>
                  <strong>Asistentes:</strong> {a.personas.length}
                </p>
                <ul className="compact-list">
                  {ordenarIdsPorNombre(a.personas).map((pid) => (
                    <li key={pid}>{getNombrePersona(pid)}</li>
                  ))}
                </ul>

                {a.reto ? (
                  <>
                    <p>
                      <strong>Reto:</strong> {a.reto.nombre} (+{a.reto.puntos} pts)
                    </p>
                    {a.reto.descripcion ? <p className="small-text">{a.reto.descripcion}</p> : null}
                    <p>
                      <strong>Completaron:</strong> {a.completaron.length}
                    </p>
                    <ul className="compact-list">
                      {ordenarIdsPorNombre(a.completaron).map((pid) => (
                        <li key={pid}>{getNombrePersona(pid)}</li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="small-text">No hay reto asignado para esta asistencia.</p>
                )}

                {editingId === a.id ? (
                  <div className="stack-sm">
                    <h4>Editar asistencia</h4>
                    <label>
                      Fecha
                      <input type="date" value={editFecha} onChange={(e) => setEditFecha(e.target.value)} />
                    </label>
                    <p>
                      <strong>Personas asistentes</strong>
                    </p>
                    <PersonCheckboxGrid personas={personas} selectedIds={editPersonas} onToggle={toggleEditPersona} />
                    <div className="table-actions">
                      <Button
                        onClick={() => {
                          onUpdate(a.id, { fecha: editFecha, personas: editPersonas });
                          setEditingId("");
                        }}
                      >
                        Guardar cambios
                      </Button>
                      <Button variant="secondary" onClick={() => setEditingId("")}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </PageSection>
  );
}
