import { useState } from "react";
import StatusMessage from "./atoms/StatusMessage";
import Button from "./atoms/Button";
import Modal from "./atoms/Modal";
import PersonCheckboxGrid from "./molecules/PersonCheckboxGrid";
import AsistenciaCreationSection from "./organisms/AsistenciaCreationSection";
import RetoSection from "./organisms/RetoSection";
import AsistenciasListSection from "./organisms/AsistenciasListSection";
import useAsistenciaPage from "../hooks/useAsistenciaPage";

export default function AsistenciaPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRetoModal, setShowRetoModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAsistenciaForDetails, setSelectedAsistenciaForDetails] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAsistenciaForEdit, setSelectedAsistenciaForEdit] = useState<string | null>(null);
  const [editFecha, setEditFecha] = useState("");
  const [editPersonas, setEditPersonas] = useState<string[]>([]);

  const {
    asistencias,
    personas,
    personasParaReto,
    loading,
    mensaje,
    selectedAsistenciaId,
    setSelectedAsistenciaId,
    newFecha,
    setNewFecha,
    personasSeleccionadas,
    nombreReto,
    setNombreReto,
    puntosReto,
    setPuntosReto,
    descripcionReto,
    setDescripcionReto,
    personasCompletaron,
    crearAsistencia,
    agregarReto,
    eliminarAsistencia,
    editarAsistencia,
    togglePersonaSeleccionada,
    togglePersonaCompleto,
    nombrePersonaById,
    ordenarIdsPorNombre,
  } = useAsistenciaPage();

  return (
    <div className="stack-md">
      <h1>Gestion de asistencias y retos</h1>
      <StatusMessage message={mensaje} />

      <Button variant="secondary" onClick={() => setShowCreateModal(true)}>
        Agregar asistencia
      </Button>

      {/* Modal para crear asistencia */}
      <Modal
        isOpen={showCreateModal}
        title="Agregar asistencia"
        onClose={() => setShowCreateModal(false)}
      >
        <AsistenciaCreationSection
          fecha={newFecha}
          onFechaChange={setNewFecha}
          personas={personas}
          seleccionadas={personasSeleccionadas}
          onTogglePersona={togglePersonaSeleccionada}
          onCreate={() => {
            void crearAsistencia();
            setShowCreateModal(false);
          }}
          loading={loading}
        />
      </Modal>

      {/* Modal para agregar reto */}
      <Modal
        isOpen={showRetoModal}
        title="Agregar reto"
        onClose={() => setShowRetoModal(false)}
      >
        <RetoSection
          asistencias={asistencias}
          selectedAsistenciaId={selectedAsistenciaId}
          onSelectedAsistenciaId={setSelectedAsistenciaId}
          nombreReto={nombreReto}
          onNombreReto={setNombreReto}
          puntosReto={puntosReto}
          onPuntosReto={setPuntosReto}
          descripcionReto={descripcionReto}
          onDescripcionReto={setDescripcionReto}
          personas={personasParaReto}
          personasCompletaron={personasCompletaron}
          onTogglePersonaCompleto={togglePersonaCompleto}
          onAddReto={() => {
            void agregarReto();
            setShowRetoModal(false);
          }}
        />
      </Modal>

      <AsistenciasListSection
        asistencias={asistencias}
        personas={personas}
        loading={loading}
        onEdit={(id) => {
          const asistencia = asistencias.find(a => a.id === id);
          if (asistencia) {
            setSelectedAsistenciaForEdit(id);
            setEditFecha(asistencia.fecha);
            setEditPersonas(asistencia.personas);
            setShowEditModal(true);
          }
        }}
        onOpenReto={(id) => {
          setSelectedAsistenciaId(id);
          setShowRetoModal(true);
        }}
        onDelete={(id) => {
          void eliminarAsistencia(id);
        }}
        onViewDetails={(id) => {
          setSelectedAsistenciaForDetails(id);
          setShowDetailsModal(true);
        }}
      />

      {/* Modal para ver detalles de asistencia */}
      <Modal
        isOpen={showDetailsModal}
        title={`Detalle de asistencia${selectedAsistenciaForDetails ? ` (${asistencias.find(a => a.id === selectedAsistenciaForDetails)?.fecha || ""})` : ""}`}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedAsistenciaForDetails(null);
        }}
      >
        {selectedAsistenciaForDetails && asistencias.find(a => a.id === selectedAsistenciaForDetails) && (
          <div className="stack-sm">
            {(() => {
              const asistencia = asistencias.find(a => a.id === selectedAsistenciaForDetails);
              if (!asistencia) return null;

              return (
                <>
                  <p>
                    <strong>Asistentes:</strong> {asistencia.personas.length}
                  </p>
                  <ul className="compact-list">
                    {ordenarIdsPorNombre(asistencia.personas).map((pid) => (
                      <li key={pid}>{nombrePersonaById(pid)}</li>
                    ))}
                  </ul>

                  {asistencia.reto ? (
                    <>
                      <p>
                        <strong>Reto:</strong> {asistencia.reto.nombre} (+{asistencia.reto.puntos} pts)
                      </p>
                      {asistencia.reto.descripcion ? <p className="small-text">{asistencia.reto.descripcion}</p> : null}
                      <p>
                        <strong>Completaron:</strong> {asistencia.completaron.length}
                      </p>
                      <ul className="compact-list">
                        {ordenarIdsPorNombre(asistencia.completaron).map((pid) => (
                          <li key={pid}>{nombrePersonaById(pid)}</li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p className="small-text">No hay reto asignado para esta asistencia.</p>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </Modal>

      {/* Modal para editar asistencia */}
      <Modal
        isOpen={showEditModal}
        title={`Editar asistencia${selectedAsistenciaForEdit ? ` (${asistencias.find(a => a.id === selectedAsistenciaForEdit)?.fecha || ""})` : ""}`}
        onClose={() => {
          setShowEditModal(false);
          setSelectedAsistenciaForEdit(null);
          setEditFecha("");
          setEditPersonas([]);
        }}
      >
        {selectedAsistenciaForEdit && asistencias.find(a => a.id === selectedAsistenciaForEdit) && (
          <div className="stack-sm">
            <label>
              Fecha
              <input type="date" value={editFecha} onChange={(e) => setEditFecha(e.target.value)} />
            </label>
            <p>
              <strong>Personas asistentes</strong>
            </p>
            <PersonCheckboxGrid 
              personas={personas} 
              selectedIds={editPersonas} 
              onToggle={(id) => {
                setEditPersonas((prev) => (prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]));
              }}
            />
            <div className="table-actions">
              <Button
                onClick={() => {
                  void editarAsistencia(selectedAsistenciaForEdit, { fecha: editFecha, personas: editPersonas });
                  setShowEditModal(false);
                  setSelectedAsistenciaForEdit(null);
                  setEditFecha("");
                  setEditPersonas([]);
                }}
              >
                Guardar cambios
              </Button>
              <Button variant="secondary" onClick={() => {
                setShowEditModal(false);
                setSelectedAsistenciaForEdit(null);
                setEditFecha("");
                setEditPersonas([]);
              }}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
