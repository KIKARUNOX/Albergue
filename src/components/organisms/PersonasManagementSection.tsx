import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, doc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import type { PersonaDetalle, PersonaForm } from "../../type/persona";
import Button from "../atoms/Button";
import Modal from "../atoms/Modal";
import PageSection from "../templates/PageSection";
import StatusMessage from "../atoms/StatusMessage";

const emptyForm: PersonaForm = {
  nombre: "",
  apellido1: "",
  apellido2: "",
  email: "",
  telefono: "",
  localidad: "",
  fechaNacimiento: "",
  bautizado: false,
  puntos: 0,
};

export default function PersonasManagementSection() {
  const [personas, setPersonas] = useState<PersonaDetalle[]>([]);
  const [query, setQuery] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<PersonaDetalle | null>(null);
  const [editingId, setEditingId] = useState("");
  const [createForm, setCreateForm] = useState<PersonaForm>(emptyForm);
  const [editForm, setEditForm] = useState<PersonaForm>(emptyForm);

  const cargarPersonas = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "personas"));
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as PersonaDetalle));
      data.sort((a, b) => `${a.nombre} ${a.apellido1 ?? ""}`.localeCompare(`${b.nombre} ${b.apellido1 ?? ""}`, "es"));
      setPersonas(data);
    } catch (error) {
      console.error("Error al cargar personas:", error);
      setMensaje("No se pudieron cargar las personas.");
      setPersonas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void cargarPersonas();
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return personas;

    return personas.filter((p) => {
      const fullName = `${p.nombre} ${p.apellido1 ?? ""} ${p.apellido2 ?? ""}`.toLowerCase();
      return fullName.includes(normalized);
    });
  }, [personas, query]);

  const createField = <K extends keyof PersonaForm>(key: K, value: PersonaForm[K]) => {
    setCreateForm((prev) => ({ ...prev, [key]: value }));
  };

  const editField = <K extends keyof PersonaForm>(key: K, value: PersonaForm[K]) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  };

  const abrirEdicion = (persona: PersonaDetalle) => {
    setSelectedPersona(persona);
    setEditingId(persona.id);
    setEditForm({
      nombre: persona.nombre ?? "",
      apellido1: persona.apellido1 ?? "",
      apellido2: persona.apellido2 ?? "",
      email: persona.email ?? "",
      telefono: persona.telefono ?? "",
      localidad: persona.localidad ?? "",
      fechaNacimiento: persona.fechaNacimiento ?? "",
      bautizado: Boolean(persona.bautizado),
      puntos: Number(persona.puntos ?? 0),
    });
  };

  const guardarNuevaPersona = async () => {
    if (!createForm.nombre.trim()) {
      setMensaje("El nombre es obligatorio.");
      return;
    }

    setSaving(true);
    setMensaje("");

    try {
      await addDoc(collection(db, "personas"), {
        nombre: createForm.nombre.trim(),
        apellido1: createForm.apellido1?.trim() ?? "",
        apellido2: createForm.apellido2?.trim() ?? "",
        email: createForm.email?.trim() ?? "",
        telefono: createForm.telefono?.trim() ?? "",
        localidad: createForm.localidad?.trim() ?? "",
        fechaNacimiento: createForm.fechaNacimiento ?? "",
        bautizado: Boolean(createForm.bautizado),
        puntos: Number(createForm.puntos ?? 0),
        createdAt: serverTimestamp(),
      });

      setCreateForm(emptyForm);
      setShowCreateModal(false);
      setMensaje("Persona registrada correctamente.");
      await cargarPersonas();
    } catch (error) {
      console.error("Error al crear persona:", error);
      setMensaje("No se pudo crear la persona.");
    } finally {
      setSaving(false);
    }
  };

  const guardarEdicion = async (id: string) => {
    if (!editForm.nombre.trim()) {
      setMensaje("El nombre es obligatorio.");
      return;
    }

    setSaving(true);
    setMensaje("");

    try {
      await updateDoc(doc(db, "personas", id), {
        nombre: editForm.nombre.trim(),
        apellido1: editForm.apellido1?.trim() ?? "",
        apellido2: editForm.apellido2?.trim() ?? "",
        email: editForm.email?.trim() ?? "",
        telefono: editForm.telefono?.trim() ?? "",
        localidad: editForm.localidad?.trim() ?? "",
        fechaNacimiento: editForm.fechaNacimiento ?? "",
        bautizado: Boolean(editForm.bautizado),
        puntos: Number(editForm.puntos ?? 0),
      });

      setMensaje("Persona actualizada correctamente.");
      setEditingId("");
      setSelectedPersona(null);
      await cargarPersonas();
    } catch (error) {
      console.error("Error al guardar persona:", error);
      setMensaje("No se pudo actualizar la persona.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageSection title="Gestion de personas">
      <StatusMessage message={mensaje} />

      <div className="table-toolbar">
        <input placeholder="Buscar por nombre..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <Button variant="secondary" onClick={() => setShowCreateModal(true)}>
          Agregar persona
        </Button>
      </div>

      {loading ? (
        <p>Cargando personas...</p>
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Puntos</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td data-label="Nombre">{`${p.nombre} ${p.apellido1 ?? ""} ${p.apellido2 ?? ""}`.trim()}</td>
                  <td data-label="Email">{p.email ?? "-"}</td>
                  <td data-label="Puntos">{p.puntos ?? 0}</td>
                  <td data-label="Acciones">
                    <div className="table-actions">
                      <Button variant="secondary" onClick={() => setSelectedPersona(p)}>
                        Ver detalles
                      </Button>
                      <Button variant="secondary" onClick={() => abrirEdicion(p)}>
                        Editar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal para crear persona */}
      <Modal
        isOpen={showCreateModal}
        title="Agregar persona"
        onClose={() => {
          setShowCreateModal(false);
          setCreateForm(emptyForm);
        }}
      >
        <div className="stack-sm">
          <input placeholder="Nombre *" value={createForm.nombre} onChange={(e) => createField("nombre", e.target.value)} />
          <input placeholder="Primer apellido" value={createForm.apellido1} onChange={(e) => createField("apellido1", e.target.value)} />
          <input placeholder="Segundo apellido" value={createForm.apellido2} onChange={(e) => createField("apellido2", e.target.value)} />
          <input type="email" placeholder="Correo" value={createForm.email} onChange={(e) => createField("email", e.target.value)} />
          <input placeholder="Telefono" value={createForm.telefono} onChange={(e) => createField("telefono", e.target.value)} />
          <input placeholder="Localidad" value={createForm.localidad} onChange={(e) => createField("localidad", e.target.value)} />
          <label>
            Fecha de nacimiento
            <input type="date" value={createForm.fechaNacimiento} onChange={(e) => createField("fechaNacimiento", e.target.value)} />
          </label>
          <label className="checkbox-item">
            <input type="checkbox" checked={createForm.bautizado} onChange={(e) => createField("bautizado", e.target.checked)} />
            <span>Bautizado</span>
          </label>
          <input type="number" placeholder="Puntos" value={createForm.puntos ?? 0} onChange={(e) => createField("puntos", Number(e.target.value) || 0)} />
          <Button onClick={() => void guardarNuevaPersona()} disabled={saving}>
            {saving ? "Guardando..." : "Guardar persona"}
          </Button>
        </div>
      </Modal>

      {/* Modal para ver y editar detalles de persona */}
      <Modal
        isOpen={selectedPersona !== null}
        title={editingId === selectedPersona?.id ? "Editar persona" : "Detalle de persona"}
        onClose={() => {
          setSelectedPersona(null);
          setEditingId("");
        }}
      >
        {selectedPersona && (
          <div className="stack-sm">
            {editingId === selectedPersona.id ? (
              <>
                <input placeholder="Nombre" value={editForm.nombre} onChange={(e) => editField("nombre", e.target.value)} />
                <input placeholder="Primer apellido" value={editForm.apellido1} onChange={(e) => editField("apellido1", e.target.value)} />
                <input placeholder="Segundo apellido" value={editForm.apellido2} onChange={(e) => editField("apellido2", e.target.value)} />
                <input type="email" placeholder="Correo" value={editForm.email} onChange={(e) => editField("email", e.target.value)} />
                <input placeholder="Telefono" value={editForm.telefono} onChange={(e) => editField("telefono", e.target.value)} />
                <input placeholder="Localidad" value={editForm.localidad} onChange={(e) => editField("localidad", e.target.value)} />
                <label>
                  Fecha de nacimiento
                  <input type="date" value={editForm.fechaNacimiento} onChange={(e) => editField("fechaNacimiento", e.target.value)} />
                </label>
                <label className="checkbox-item">
                  <input type="checkbox" checked={editForm.bautizado} onChange={(e) => editField("bautizado", e.target.checked)} />
                  <span>Bautizado</span>
                </label>
                <input type="number" placeholder="Puntos" value={editForm.puntos ?? 0} onChange={(e) => editField("puntos", Number(e.target.value) || 0)} />
                <div className="table-actions">
                  <Button onClick={() => void guardarEdicion(selectedPersona.id)} disabled={saving}>
                    {saving ? "Guardando..." : "Guardar cambios"}
                  </Button>
                  <Button variant="secondary" onClick={() => setEditingId("")}>
                    Cancelar
                  </Button>
                </div>
              </>
            ) : (
              <div className="stack-sm">
                <p><strong>Nombre:</strong> {`${selectedPersona.nombre} ${selectedPersona.apellido1 ?? ""} ${selectedPersona.apellido2 ?? ""}`.trim()}</p>
                <p><strong>Email:</strong> {selectedPersona.email ?? "-"}</p>
                <p><strong>Telefono:</strong> {selectedPersona.telefono ?? "-"}</p>
                <p><strong>Localidad:</strong> {selectedPersona.localidad ?? "-"}</p>
                <p><strong>Fecha nacimiento:</strong> {selectedPersona.fechaNacimiento ?? "-"}</p>
                <p><strong>Bautizado:</strong> {selectedPersona.bautizado ? "Si" : "No"}</p>
                <p><strong>Puntos:</strong> {selectedPersona.puntos ?? 0}</p>
                <div className="table-actions">
                  <Button onClick={() => abrirEdicion(selectedPersona)}>
                    Editar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </PageSection>
  );
}
