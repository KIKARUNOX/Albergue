import type { Asistencia } from "../../type/asistencia";
import Button from "../atoms/Button";
import PageSection from "../templates/PageSection";

type AsistenciasListSectionProps = {
  asistencias: Asistencia[];
  loading: boolean;
  getNombrePersona: (id: string) => string;
  ordenarIdsPorNombre: (ids: string[]) => string[];
  onDelete: (id: string) => void;
};

export default function AsistenciasListSection({
  asistencias,
  loading,
  getNombrePersona,
  ordenarIdsPorNombre,
  onDelete,
}: AsistenciasListSectionProps) {
  return (
    <PageSection title="Asistencias registradas">
      {loading ? (
        <p>Cargando...</p>
      ) : asistencias.length === 0 ? (
        <p>No hay asistencias registradas.</p>
      ) : (
        <div className="stack-md">
          {asistencias.map((a) => (
            <article key={a.id} className="list-item-card">
              <div className="list-item-header">
                <h3>{a.fecha}</h3>
                <Button variant="danger" onClick={() => onDelete(a.id)}>
                  Eliminar
                </Button>
              </div>

              <p>
                <strong>Personas asistentes:</strong> {a.personas.length}
              </p>
              <ul className="compact-list">
                {ordenarIdsPorNombre(a.personas).map((pid) => (
                  <li key={pid}>{getNombrePersona(pid)}</li>
                ))}
              </ul>

              {a.reto && (
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
              )}
            </article>
          ))}
        </div>
      )}
    </PageSection>
  );
}
