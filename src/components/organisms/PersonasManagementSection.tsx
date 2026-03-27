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

type PersonasManagementUiState = {
  query: string;
  mensaje: string;
  loading: boolean;
  saving: boolean;
  showCreateModal: boolean;
  selectedPersona: PersonaDetalle | null;
  editingId: string;
  createForm: PersonaForm;
  editForm: PersonaForm;
};

const initialUiState: PersonasManagementUiState = {
  query: "",
  mensaje: "",
  loading: true,
  saving: false,
  showCreateModal: false,
  selectedPersona: null,
  editingId: "",
  createForm: emptyForm,
  editForm: emptyForm,
};

export default function PersonasManagementSection() {
  "use no memo";

  const [personas, setPersonas] = useState<PersonaDetalle[]>([]);
  const [ui, setUi] = useState<PersonasManagementUiState>(initialUiState);

  const patchUi = (next: Partial<PersonasManagementUiState>) => {
    setUi((prev) => ({ ...prev, ...next }));
  };

  const fetchPersonas = async () => {
    const snapshot = await getDocs(collection(db, "personas"));
    const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as PersonaDetalle));
    data.sort((a, b) => `${a.nombre} ${a.apellido1 ?? ""}`.localeCompare(`${b.nombre} ${b.apellido1 ?? ""}`, "es"));

    return data;
  };

  useEffect(() => {
    let mounted = true;

    void fetchPersonas()
      .then((data) => {
        if (!mounted) return;
        setPersonas(data);
        patchUi({ loading: false });
      })
      .catch((error: unknown) => {
        if (!mounted) return;
        console.error("Error al cargar personas:", error);
        patchUi({ mensaje: "No se pudieron cargar las personas.", loading: false });
        setPersonas([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const recargarPersonas = async () => {
    patchUi({ loading: true });

    await fetchPersonas()
      .then((data) => {
        setPersonas(data);
      })
      .catch((error: unknown) => {
        console.error("Error al cargar personas:", error);
        patchUi({ mensaje: "No se pudieron cargar las personas." });
        setPersonas([]);
      });

    patchUi({ loading: false });
  };

  const filtered = useMemo(() => {
    const normalized = ui.query.trim().toLowerCase();
    if (!normalized) return personas;

    return personas.filter((p) => {
      const fullName = `${p.nombre} ${p.apellido1 ?? ""} ${p.apellido2 ?? ""}`.toLowerCase();
      return fullName.includes(normalized);
    });
  }, [personas, ui.query]);

  const createField = <K extends keyof PersonaForm>(key: K, value: PersonaForm[K]) => {
    setUi((prev) => ({ ...prev, createForm: { ...prev.createForm, [key]: value } }));
  };

  const editField = <K extends keyof PersonaForm>(key: K, value: PersonaForm[K]) => {
    setUi((prev) => ({ ...prev, editForm: { ...prev.editForm, [key]: value } }));
  };

  const abrirEdicion = (persona: PersonaDetalle) => {
    patchUi({
      selectedPersona: persona,
      editingId: persona.id,
      editForm: {
        nombre: persona.nombre ?? "",
        apellido1: persona.apellido1 ?? "",
        apellido2: persona.apellido2 ?? "",
        email: persona.email ?? "",
        telefono: persona.telefono ?? "",
        localidad: persona.localidad ?? "",
        fechaNacimiento: persona.fechaNacimiento ?? "",
        bautizado: Boolean(persona.bautizado),
        puntos: Number(persona.puntos ?? 0),
      },
    });
  };

  const guardarNuevaPersona = async () => {
    if (!ui.createForm.nombre.trim()) {
      patchUi({ mensaje: "El nombre es obligatorio." });
      return;
    }

    patchUi({ saving: true, mensaje: "" });

    await addDoc(collection(db, "personas"), {
        nombre: ui.createForm.nombre.trim(),
        apellido1: ui.createForm.apellido1?.trim() ?? "",
        apellido2: ui.createForm.apellido2?.trim() ?? "",
        email: ui.createForm.email?.trim() ?? "",
        telefono: ui.createForm.telefono?.trim() ?? "",
        localidad: ui.createForm.localidad?.trim() ?? "",
        fechaNacimiento: ui.createForm.fechaNacimiento ?? "",
        bautizado: Boolean(ui.createForm.bautizado),
        puntos: Number(ui.createForm.puntos ?? 0),
        createdAt: serverTimestamp(),
      })
      .then(() => {
        patchUi({ createForm: emptyForm, showCreateModal: false, mensaje: "Persona registrada correctamente." });
      })
      .then(() => recargarPersonas())
      .catch((error: unknown) => {
        console.error("Error al crear persona:", error);
        patchUi({ mensaje: "No se pudo crear la persona." });
      });

    patchUi({ saving: false });
  };

  const guardarEdicion = async (id: string) => {
    if (!ui.editForm.nombre.trim()) {
      patchUi({ mensaje: "El nombre es obligatorio." });
      return;
    }

    patchUi({ saving: true, mensaje: "" });

    await updateDoc(doc(db, "personas", id), {
        nombre: ui.editForm.nombre.trim(),
        apellido1: ui.editForm.apellido1?.trim() ?? "",
        apellido2: ui.editForm.apellido2?.trim() ?? "",
        email: ui.editForm.email?.trim() ?? "",
        telefono: ui.editForm.telefono?.trim() ?? "",
        localidad: ui.editForm.localidad?.trim() ?? "",
        fechaNacimiento: ui.editForm.fechaNacimiento ?? "",
        bautizado: Boolean(ui.editForm.bautizado),
        puntos: Number(ui.editForm.puntos ?? 0),
      })
      .then(() => {
        patchUi({ mensaje: "Persona actualizada correctamente.", editingId: "", selectedPersona: null });
      })
      .then(() => recargarPersonas())
      .catch((error: unknown) => {
        console.error("Error al guardar persona:", error);
        patchUi({ mensaje: "No se pudo actualizar la persona." });
      });

    patchUi({ saving: false });
  };

  return (
    <PageSection title="Gestion de personas">
      <StatusMessage message={ui.mensaje} />

      <div className="table-toolbar">
        <input
          placeholder="Buscar por nombre..."
          value={ui.query}
          onChange={(e) => patchUi({ query: e.target.value })}
        />
        <Button variant="secondary" onClick={() => patchUi({ showCreateModal: true })}>
          Agregar persona
        </Button>
      </div>

      {ui.loading ? (
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
                      <Button variant="secondary" onClick={() => patchUi({ selectedPersona: p })}>
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
        isOpen={ui.showCreateModal}
        title="Agregar persona"
        onClose={() => {
          patchUi({ showCreateModal: false, createForm: emptyForm });
        }}
      >
        <div className="stack-sm">
          <input placeholder="Nombre *" value={ui.createForm.nombre} onChange={(e) => createField("nombre", e.target.value)} />
          <input placeholder="Primer apellido" value={ui.createForm.apellido1} onChange={(e) => createField("apellido1", e.target.value)} />
          <input placeholder="Segundo apellido" value={ui.createForm.apellido2} onChange={(e) => createField("apellido2", e.target.value)} />
          <input type="email" placeholder="Correo" value={ui.createForm.email} onChange={(e) => createField("email", e.target.value)} />
          <input placeholder="Telefono" value={ui.createForm.telefono} onChange={(e) => createField("telefono", e.target.value)} />
          <input placeholder="Localidad" value={ui.createForm.localidad} onChange={(e) => createField("localidad", e.target.value)} />
          <label>
            Fecha de nacimiento
            <input type="date" value={ui.createForm.fechaNacimiento} onChange={(e) => createField("fechaNacimiento", e.target.value)} />
          </label>
          <label className="checkbox-item">
            <input type="checkbox" checked={ui.createForm.bautizado} onChange={(e) => createField("bautizado", e.target.checked)} />
            <span>Bautizado</span>
          </label>
          <input type="number" placeholder="Puntos" value={ui.createForm.puntos ?? 0} onChange={(e) => createField("puntos", Number(e.target.value) || 0)} />
          <Button onClick={() => void guardarNuevaPersona()} disabled={ui.saving}>
            {ui.saving ? "Guardando..." : "Guardar persona"}
          </Button>
        </div>
      </Modal>

      {/* Modal para ver y editar detalles de persona */}
      <Modal
        isOpen={ui.selectedPersona !== null}
        title={ui.editingId === ui.selectedPersona?.id ? "Editar persona" : "Detalle de persona"}
        onClose={() => {
          patchUi({ selectedPersona: null, editingId: "" });
        }}
      >
        {ui.selectedPersona && (
          <div className="stack-sm">
            {ui.editingId === ui.selectedPersona.id ? (
              <>
                <input placeholder="Nombre" value={ui.editForm.nombre} onChange={(e) => editField("nombre", e.target.value)} />
                <input placeholder="Primer apellido" value={ui.editForm.apellido1} onChange={(e) => editField("apellido1", e.target.value)} />
                <input placeholder="Segundo apellido" value={ui.editForm.apellido2} onChange={(e) => editField("apellido2", e.target.value)} />
                <input type="email" placeholder="Correo" value={ui.editForm.email} onChange={(e) => editField("email", e.target.value)} />
                <input placeholder="Telefono" value={ui.editForm.telefono} onChange={(e) => editField("telefono", e.target.value)} />
                <input placeholder="Localidad" value={ui.editForm.localidad} onChange={(e) => editField("localidad", e.target.value)} />
                <label>
                  Fecha de nacimiento
                  <input type="date" value={ui.editForm.fechaNacimiento} onChange={(e) => editField("fechaNacimiento", e.target.value)} />
                </label>
                <label className="checkbox-item">
                  <input type="checkbox" checked={ui.editForm.bautizado} onChange={(e) => editField("bautizado", e.target.checked)} />
                  <span>Bautizado</span>
                </label>
                <input type="number" placeholder="Puntos" value={ui.editForm.puntos ?? 0} onChange={(e) => editField("puntos", Number(e.target.value) || 0)} />
                <div className="table-actions">
                  <Button onClick={() => void guardarEdicion(ui.selectedPersona!.id)} disabled={ui.saving}>
                    {ui.saving ? "Guardando..." : "Guardar cambios"}
                  </Button>
                  <Button variant="secondary" onClick={() => patchUi({ editingId: "" })}>
                    Cancelar
                  </Button>
                </div>
              </>
            ) : (
              <div className="stack-sm">
                <p><strong>Nombre:</strong> {`${ui.selectedPersona.nombre} ${ui.selectedPersona.apellido1 ?? ""} ${ui.selectedPersona.apellido2 ?? ""}`.trim()}</p>
                <p><strong>Email:</strong> {ui.selectedPersona.email ?? "-"}</p>
                <p><strong>Telefono:</strong> {ui.selectedPersona.telefono ?? "-"}</p>
                <p><strong>Localidad:</strong> {ui.selectedPersona.localidad ?? "-"}</p>
                <p><strong>Fecha nacimiento:</strong> {ui.selectedPersona.fechaNacimiento ?? "-"}</p>
                <p><strong>Bautizado:</strong> {ui.selectedPersona.bautizado ? "Si" : "No"}</p>
                <p><strong>Puntos:</strong> {ui.selectedPersona.puntos ?? 0}</p>
                <div className="table-actions">
                  <Button onClick={() => abrirEdicion(ui.selectedPersona!)}>
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
