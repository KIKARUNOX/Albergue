import { useState, useEffect } from "react";
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import Swal from "sweetalert2";
import type { Evento } from "../../type/evento";
import "./EventosManagementSection.css";

export default function EventosManagementSection() {
  const [eventos, setEventos] = useState<(Evento & { docId: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fecha: "",
    titulo: "",
    descripcion: "",
    imagenes: "",
  });

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validarFormulario = (): boolean => {
    if (!formData.fecha.trim()) {
      Swal.fire({ icon: "warning", title: "Fecha requerida", text: "Ingresa una fecha válida" });
      return false;
    }
    if (!formData.titulo.trim()) {
      Swal.fire({ icon: "warning", title: "Título requerido", text: "Ingresa un título" });
      return false;
    }
    if (!formData.imagenes.trim()) {
      Swal.fire({ icon: "warning", title: "Imágenes requeridas", text: "Ingresa al menos una URL de imagen" });
      return false;
    }
    return true;
  };

  const obtenerImagenesArray = (): string[] => {
    return formData.imagenes
      .split("\n")
      .map((url) => url.trim())
      .map((url) => convertirEnlaceGoogleDrive(url))
      .filter((url) => url.length > 0);
  };

  const convertirEnlaceGoogleDrive = (url: string): string => {
    if (!url) return "";

    const idFromParam = new URL(url).searchParams.get("id");
    if (idFromParam) {
      // Usa un endpoint que suele funcionar mejor embebido en img.
      return `https://drive.google.com/thumbnail?id=${idFromParam}&sz=w2000`;
    }

    // Detectar enlace compartible de Google Drive y extraer ID.
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match?.[1]) {
      const id = match[1];
      return `https://drive.google.com/thumbnail?id=${id}&sz=w2000`;
    }

    // Si no es Google Drive, devolver como está
    return url;
  };

  const handleGuardar = async () => {
    if (!validarFormulario()) return;

    try {
      const imagenes = obtenerImagenesArray();

      if (editingId) {
        // Actualizar
        const eventoRef = doc(db, "eventos", editingId);
        await updateDoc(eventoRef, {
          fecha: formData.fecha,
          titulo: formData.titulo,
          descripcion: formData.descripcion,
          imagenes,
        });
        await Swal.fire({ icon: "success", title: "Evento actualizado" });
        setEditingId(null);
      } else {
        // Crear
        await addDoc(collection(db, "eventos"), {
          fecha: formData.fecha,
          titulo: formData.titulo,
          descripcion: formData.descripcion,
          imagenes,
          createdAt: new Date(),
        });
        await Swal.fire({ icon: "success", title: "Evento creado" });
      }

      setFormData({ fecha: "", titulo: "", descripcion: "", imagenes: "" });
      setShowCreateModal(false);
      await cargarEventos();
    } catch (error) {
      await Swal.fire({ icon: "error", title: "Error", text: "No se pudo guardar el evento" });
      console.error("Error:", error);
    }
  };

  const handleEditar = (evento: Evento & { docId: string }) => {
    setFormData({
      fecha: evento.fecha,
      titulo: evento.titulo,
      descripcion: evento.descripcion || "",
      imagenes: evento.imagenes.join("\n"),
    });
    setEditingId(evento.docId);
    setShowCreateModal(true);
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
      } catch (error) {
        await Swal.fire({ icon: "error", title: "Error al eliminar" });
      }
    }
  };

  const handleCancelar = () => {
    setFormData({ fecha: "", titulo: "", descripcion: "", imagenes: "" });
    setEditingId(null);
    setShowCreateModal(false);
  };

  if (loading) return <p>Cargando eventos...</p>;

  return (
    <section className="eventos-management">
      <div className="eventos-header">
        <h2>Gestionar Eventos</h2>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          + Nuevo Evento
        </button>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={handleCancelar}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingId ? "Editar Evento" : "Nuevo Evento"}</h3>

            <div className="stack-md">
              <div>
                <label>Fecha (sábado)</label>
                <input
                  type="date"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <label>Título</label>
                <input
                  type="text"
                  name="titulo"
                  placeholder="Ej: Retiro Jóvenes"
                  value={formData.titulo}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <label>Descripción</label>
                <textarea
                  name="descripcion"
                  placeholder="Descripción del evento (opcional)"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>

              <div>
                <label>URLs de Imágenes (una por línea)</label>
                <textarea
                  name="imagenes"
                  placeholder={
                    "Pega aquí las URLs de Google Drive o imágenes\n\n" +
                    "Se convierten automáticamente:\n" +
                    "• Enlace compartible: paste aquí y se convierte\n" +
                    "• URL directa: también funciona\n\n" +
                    "Ejemplo:\n" +
                    "https://drive.google.com/file/d/ABC123/view..."
                  }
                  value={formData.imagenes}
                  onChange={handleInputChange}
                  rows={6}
                  required
                />
              </div>

              <div className="modal-actions">
                <button className="btn-primary" onClick={handleGuardar}>
                  {editingId ? "Actualizar" : "Crear"}
                </button>
                <button className="btn-secondary" onClick={handleCancelar}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                    <button
                      className="btn-icon edit"
                      onClick={() => handleEditar(evento)}
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-icon delete"
                      onClick={() => handleEliminar(evento.docId)}
                      title="Eliminar"
                    >
                      🗑️
                    </button>
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
