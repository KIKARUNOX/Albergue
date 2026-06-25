import { useState, useEffect } from "react";
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import Swal from "sweetalert2";
import type { Evento } from "../../type/evento";
import "../../styles/EventosManagementSection.css";
import Button from "../atoms/Button";
import EventoFormModal from "./EventoFormModal";
import Spinner from "../atoms/Spinner";

const emptyForm = { fecha: "", titulo: "", descripcion: "", imagenes: "" };

export default function EventosManagementSection() {
  const [eventos, setEventos] = useState<(Evento & { docId: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    cargarEventos();
  }, []);

  const cargarEventos = async () => {
    setLoading(true);
    try {
      const q = collection(db, "eventos");
      const querySnapshot = await getDocs(q);
      const eventosData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        docId: doc.id,
        ...(doc.data() as Evento),
      }));
      setEventos(eventosData.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));
    } catch (error) {
      console.error("Error al cargar eventos:", error);
    } finally {
      setLoading(false);
    }
  };

  const abrirCrear = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowModal(true);
  };

  const abrirEditar = (evento: Evento & { docId: string }) => {
    setFormData({
      fecha: evento.fecha,
      titulo: evento.titulo,
      descripcion: evento.descripcion || "",
      imagenes: evento.imagenes.join("\n"),
    });
    setEditingId(evento.docId);
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const guardarEvento = async (data: { fecha: string; titulo: string; descripcion: string; imagenes: string[] }) => {
    if (editingId) {
      await updateDoc(doc(db, "eventos", editingId), data);
      await Swal.fire({ icon: "success", title: "Evento actualizado" });
    } else {
      await addDoc(collection(db, "eventos"), { ...data, createdAt: new Date() });
      await Swal.fire({ icon: "success", title: "Evento creado" });
    }
    cerrarModal();
    await cargarEventos();
  };

  const handleEliminar = async (id: string) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Eliminar evento",
      text: "¿Estás seguro?",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, "eventos", id));
        await Swal.fire({ icon: "success", title: "Evento eliminado" });
        await cargarEventos();
      } catch {
        await Swal.fire({ icon: "error", title: "Error al eliminar" });
      }
    }
  };

  if (loading) return <Spinner text="Cargando eventos..." />;

  return (
    <section className="eventos-management">
      <div className="eventos-header">
        <h2>Gestionar Eventos</h2>
        <Button onClick={abrirCrear}>+ Nuevo Evento</Button>
      </div>

      <EventoFormModal
        isOpen={showModal}
        editingId={editingId}
        initialData={formData}
        onClose={cerrarModal}
        onSave={guardarEvento}
      />

      <div className="eventos-list">
        {eventos.length === 0 ? (
          <p className="no-eventos">No hay eventos. Crea uno para comenzar.</p>
        ) : (
          <table className="eventos-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Título</th>
                <th>Imágenes</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {eventos.map((evento) => (
                <tr key={evento.docId}>
                  <td>{new Date(evento.fecha).toLocaleDateString("es-ES")}</td>
                  <td>{evento.titulo}</td>
                  <td>{evento.imagenes.length} imagen(es)</td>
                  <td className="actions">
                    <button className="btn-icon edit" onClick={() => abrirEditar(evento)} title="Editar">✏️</button>
                    <button className="btn-icon delete" onClick={() => void handleEliminar(evento.docId)} title="Eliminar">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
