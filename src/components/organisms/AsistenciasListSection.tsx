import type { AsistenciasListSectionProps } from "../../type/componentProps";
import Button from "../atoms/Button";
import PageSection from "../templates/PageSection";

export default function AsistenciasListSection({
  asistencias,
  loading,
  onEdit,
  onOpenReto,
  onDelete,
  onViewDetails,
}: AsistenciasListSectionProps) {

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
                    <td data-label="Fecha">{a.fecha}</td>
                    <td data-label="Asistentes">{a.personas.length}</td>
                    <td data-label="Reto">{a.reto ? a.reto.nombre : "Sin reto"}</td>
                    <td data-label="Acciones">
                      <div className="table-actions">
                        <Button
                          variant="secondary"
                          onClick={() => onViewDetails(a.id)}
                        >
                          Ver detalles
                        </Button>
                        <Button variant="secondary" onClick={() => onEdit(a.id)}>
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
        </div>
      )}
    </PageSection>
  );
}
