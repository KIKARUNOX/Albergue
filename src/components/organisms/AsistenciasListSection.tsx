import { useMemo, useState } from "react";
import type { AsistenciasListSectionProps } from "../../type/componentProps";
import Button from "../atoms/Button";
import PageSection from "../templates/PageSection";

const today = new Date();
const currentYear = String(today.getFullYear());
const currentMonth = `${currentYear}-${String(today.getMonth() + 1).padStart(2, "0")}`;

export default function AsistenciasListSection({
  asistencias,
  loading,
  hasMore,
  loadingMore,
  onLoadMore,
  onEdit,
  onOpenReto,
  onDelete,
  onViewDetails,
}: AsistenciasListSectionProps) {
  const [filterType, setFilterType] = useState<"all" | "year" | "month">("month");
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const availableYears = useMemo(() => {
    return Array.from(
      new Set(
        asistencias
          .map((a) => a.fecha.slice(0, 4))
          .filter((year) => /^\d{4}$/.test(year)),
      ),
    ).sort((a, b) => b.localeCompare(a));
  }, [asistencias]);

  const filteredAsistencias = useMemo(() => {
    if (filterType === "year") {
      if (!selectedYear) return asistencias;
      return asistencias.filter((a) => a.fecha.startsWith(`${selectedYear}-`));
    }

    if (filterType === "month") {
      if (!selectedMonth) return asistencias;
      return asistencias.filter((a) => a.fecha.startsWith(selectedMonth));
    }

    return asistencias;
  }, [asistencias, filterType, selectedMonth, selectedYear]);

  return (
    <PageSection title="Asistencias registradas">
      <div className="table-toolbar">
        <label>
          Filtrar por
          <select
            value={filterType}
            onChange={(e) => {
              const nextType = e.target.value as "all" | "year" | "month";
              setFilterType(nextType);
              if (nextType === "year") {
                setSelectedYear(currentYear);
              }
              if (nextType === "month") {
                setSelectedMonth(currentMonth);
              }
            }}
          >
            <option value="all">Sin filtro</option>
            <option value="year">Año</option>
            <option value="month">Mes</option>
          </select>
        </label>

        {filterType === "year" ? (
          <label>
            Año
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              <option value="">Todos</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {filterType === "month" ? (
          <label>
            Mes
            <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
          </label>
        ) : null}
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : filteredAsistencias.length === 0 ? (
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
                {filteredAsistencias.map((a) => (
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

          {hasMore ? (
            <Button variant="secondary" onClick={onLoadMore} disabled={loadingMore}>
              {loadingMore ? "Cargando..." : "Cargar mas asistencias"}
            </Button>
          ) : null}
        </div>
      )}
    </PageSection>
  );
}
