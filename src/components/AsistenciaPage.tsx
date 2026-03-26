import { useState } from "react";
import StatusMessage from "./atoms/StatusMessage";
import Button from "./atoms/Button";
import AsistenciaCreationSection from "./organisms/AsistenciaCreationSection";
import RetoSection from "./organisms/RetoSection";
import AsistenciasListSection from "./organisms/AsistenciasListSection";
import useAsistenciaPage from "../hooks/useAsistenciaPage";

export default function AsistenciaPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showRetoForm, setShowRetoForm] = useState(false);

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

      <Button variant="secondary" onClick={() => setShowCreateForm((prev) => !prev)}>
        {showCreateForm ? "Cerrar formulario" : "Agregar asistencia"}
      </Button>

      {showCreateForm ? (
        <AsistenciaCreationSection
          fecha={newFecha}
          onFechaChange={setNewFecha}
          personas={personas}
          seleccionadas={personasSeleccionadas}
          onTogglePersona={togglePersonaSeleccionada}
          onCreate={() => void crearAsistencia()}
          loading={loading}
        />
      ) : null}

      {showRetoForm ? (
        <div className="stack-sm">
          <Button variant="secondary" onClick={() => setShowRetoForm(false)}>
            Cerrar formulario de reto
          </Button>
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
            onAddReto={() => void agregarReto()}
          />
        </div>
      ) : null}

      <AsistenciasListSection
        asistencias={asistencias}
        personas={personas}
        loading={loading}
        getNombrePersona={nombrePersonaById}
        ordenarIdsPorNombre={ordenarIdsPorNombre}
        onUpdate={(id, data) => {
          void editarAsistencia(id, data);
        }}
        onOpenReto={(id) => {
          setSelectedAsistenciaId(id);
          setShowRetoForm(true);
        }}
        onDelete={(id) => {
          void eliminarAsistencia(id);
        }}
      />
    </div>
  );
}
