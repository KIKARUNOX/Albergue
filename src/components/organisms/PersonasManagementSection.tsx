import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, doc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";
import Swal from "sweetalert2";
import { db } from "../../firebase";
import { defaultPermisosByRole } from "../../lib/permissions";
import type { PersonaDetalle, PersonaForm, PersonaPermisos, PersonaRole } from "../../type/persona";
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
  createRole: PersonaRole;
  createPermisos: PersonaPermisos;
  editRole: PersonaRole;
  editPermisos: PersonaPermisos;
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
  createRole: "joven",
  createPermisos: defaultPermisosByRole("joven"),
  editRole: "joven",
  editPermisos: defaultPermisosByRole("joven"),
  createForm: emptyForm,
  editForm: emptyForm,
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+()\-\s]{7,20}$/;

const validarPersonaForm = (form: PersonaForm): string | null => {
  if (!form.nombre.trim()) {
    return "El nombre es obligatorio.";
  }
  if (form.email?.trim() && !EMAIL_PATTERN.test(form.email.trim())) {
    return "El correo no tiene un formato valido.";
  }
  if (form.telefono?.trim() && !PHONE_PATTERN.test(form.telefono.trim())) {
    return "El telefono solo puede contener numeros y simbolos basicos (+ - ( )).";
  }
  if (Number(form.puntos ?? 0) < 0) {
    return "Los puntos no pueden ser negativos.";
  }
  return null;
};

const PERMISO_LABELS: Record<keyof PersonaPermisos, string> = {
  dashboard: "Ver dashboard",
  asistencias: "Gestionar asistencias",
  personas: "Gestionar personas",
  importacion: "Importar",
  gestionarPermisos: "Gestionar permisos",
};

type PersonasManagementSectionProps = {
  canManagePermissions: boolean;
};

export default function PersonasManagementSection({ canManagePermissions }: PersonasManagementSectionProps) {
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
    const role: PersonaRole = persona.role ?? "joven";
    const permisos: PersonaPermisos = {
      ...defaultPermisosByRole(role),
      ...(persona.permisos ?? {}),
    };

    patchUi({
      selectedPersona: persona,
      editingId: persona.id,
      editRole: role,
      editPermisos: permisos,
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

  const onCreateRoleChange = (role: PersonaRole) => {
    patchUi({ createRole: role, createPermisos: defaultPermisosByRole(role) });
  };

  const onEditRoleChange = (role: PersonaRole) => {
    patchUi({ editRole: role, editPermisos: defaultPermisosByRole(role) });
  };

  const toggleCreatePermiso = (key: keyof PersonaPermisos) => {
    patchUi({ createPermisos: { ...ui.createPermisos, [key]: !ui.createPermisos[key] } });
  };

  const toggleEditPermiso = (key: keyof PersonaPermisos) => {
    patchUi({ editPermisos: { ...ui.editPermisos, [key]: !ui.editPermisos[key] } });
  };

  const guardarNuevaPersona = async () => {
    const validationError = validarPersonaForm(ui.createForm);
    if (validationError) {
      patchUi({ mensaje: validationError });
      await Swal.fire({
        icon: "warning",
        title: "Datos invalidos",
        text: validationError,
      });
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
        role: canManagePermissions ? ui.createRole : "joven",
        permisos: canManagePermissions ? ui.createPermisos : defaultPermisosByRole("joven"),
        createdAt: serverTimestamp(),
      })
      .then(() => {
        patchUi({
          createForm: emptyForm,
          showCreateModal: false,
          mensaje: "Persona registrada correctamente.",
          createRole: "joven",
          createPermisos: defaultPermisosByRole("joven"),
        });
        return Swal.fire({
          icon: "success",
          title: "Registro exitoso",
          text: "Persona registrada correctamente.",
        });
      })
      .then(() => recargarPersonas())
      .catch((error: unknown) => {
        console.error("Error al crear persona:", error);
        patchUi({ mensaje: "No se pudo crear la persona." });
        void Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo crear la persona.",
        });
      });

    patchUi({ saving: false });
  };

  const guardarEdicion = async (id: string) => {
    const validationError = validarPersonaForm(ui.editForm);
    if (validationError) {
      patchUi({ mensaje: validationError });
      await Swal.fire({
        icon: "warning",
        title: "Datos invalidos",
        text: validationError,
      });
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
        ...(canManagePermissions
          ? {
              role: ui.editRole,
              permisos: ui.editPermisos,
            }
          : {}),
      })
      .then(() => {
        patchUi({ mensaje: "Persona actualizada correctamente.", editingId: "", selectedPersona: null });
        return Swal.fire({
          icon: "success",
          title: "Actualizacion exitosa",
          text: "Persona actualizada correctamente.",
        });
      })
      .then(() => recargarPersonas())
      .catch((error: unknown) => {
        console.error("Error al guardar persona:", error);
        patchUi({ mensaje: "No se pudo actualizar la persona." });
        void Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo actualizar la persona.",
        });
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
                <th>Telefono</th>
                <th>Rol</th>
                <th>Puntos</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td data-label="Nombre">{`${p.nombre} ${p.apellido1 ?? ""} ${p.apellido2 ?? ""}`.trim()}</td>
                  <td data-label="Telefono">{p.telefono ?? "-"}</td>
                  <td data-label="Rol">{p.role ?? "coordinador"}</td>
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
          patchUi({
            showCreateModal: false,
            createForm: emptyForm,
            createRole: "joven",
            createPermisos: defaultPermisosByRole("joven"),
          });
        }}
      >
        <div className="stack-sm">
          <input placeholder="Nombre *" required minLength={2} value={ui.createForm.nombre} onChange={(e) => createField("nombre", e.target.value)} />
          <input placeholder="Primer apellido" value={ui.createForm.apellido1} onChange={(e) => createField("apellido1", e.target.value)} />
          <input placeholder="Segundo apellido" value={ui.createForm.apellido2} onChange={(e) => createField("apellido2", e.target.value)} />
          <input type="email" placeholder="Correo" value={ui.createForm.email} onChange={(e) => createField("email", e.target.value)} />
          <input type="tel" pattern="[0-9+()\-\s]{7,20}" placeholder="Telefono" value={ui.createForm.telefono} onChange={(e) => createField("telefono", e.target.value)} />
          <input placeholder="Localidad" value={ui.createForm.localidad} onChange={(e) => createField("localidad", e.target.value)} />
          <label>
            Fecha de nacimiento
            <input type="date" value={ui.createForm.fechaNacimiento} onChange={(e) => createField("fechaNacimiento", e.target.value)} />
          </label>
          <label className="checkbox-item">
            <input type="checkbox" checked={ui.createForm.bautizado} onChange={(e) => createField("bautizado", e.target.checked)} />
            <span>Bautizado</span>
          </label>
          {canManagePermissions ? (
            <>
              <label>
                Rol
                <select value={ui.createRole} onChange={(e) => onCreateRoleChange(e.target.value as PersonaRole)}>
                  <option value="joven">Joven</option>
                  <option value="coordinador">Coordinador</option>
                  <option value="lider">Lider</option>
                </select>
              </label>
              <div className="stack-sm">
                <strong>Permisos</strong>
                {(Object.keys(PERMISO_LABELS) as Array<keyof PersonaPermisos>).map((key) => (
                  <label key={key} className="checkbox-item">
                    <input type="checkbox" checked={ui.createPermisos[key]} onChange={() => toggleCreatePermiso(key)} />
                    <span>{PERMISO_LABELS[key]}</span>
                  </label>
                ))}
              </div>
            </>
          ) : null}
          <input type="number" min={0} step={1} placeholder="Puntos" value={ui.createForm.puntos ?? 0} onChange={(e) => createField("puntos", Number(e.target.value) || 0)} />
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
                <input placeholder="Nombre" required minLength={2} value={ui.editForm.nombre} onChange={(e) => editField("nombre", e.target.value)} />
                <input placeholder="Primer apellido" value={ui.editForm.apellido1} onChange={(e) => editField("apellido1", e.target.value)} />
                <input placeholder="Segundo apellido" value={ui.editForm.apellido2} onChange={(e) => editField("apellido2", e.target.value)} />
                <input type="email" placeholder="Correo" value={ui.editForm.email} onChange={(e) => editField("email", e.target.value)} />
                <input type="tel" pattern="[0-9+()\-\s]{7,20}" placeholder="Telefono" value={ui.editForm.telefono} onChange={(e) => editField("telefono", e.target.value)} />
                <input placeholder="Localidad" value={ui.editForm.localidad} onChange={(e) => editField("localidad", e.target.value)} />
                <label>
                  Fecha de nacimiento
                  <input type="date" value={ui.editForm.fechaNacimiento} onChange={(e) => editField("fechaNacimiento", e.target.value)} />
                </label>
                <label className="checkbox-item">
                  <input type="checkbox" checked={ui.editForm.bautizado} onChange={(e) => editField("bautizado", e.target.checked)} />
                  <span>Bautizado</span>
                </label>
                <input type="number" min={0} step={1} placeholder="Puntos" value={ui.editForm.puntos ?? 0} onChange={(e) => editField("puntos", Number(e.target.value) || 0)} />
                {canManagePermissions ? (
                  <>
                    <label>
                      Rol
                      <select value={ui.editRole} onChange={(e) => onEditRoleChange(e.target.value as PersonaRole)}>
                        <option value="joven">Joven</option>
                        <option value="coordinador">Coordinador</option>
                        <option value="lider">Lider</option>
                      </select>
                    </label>
                    <div className="stack-sm">
                      <strong>Permisos</strong>
                      {(Object.keys(PERMISO_LABELS) as Array<keyof PersonaPermisos>).map((key) => (
                        <label key={key} className="checkbox-item">
                          <input type="checkbox" checked={ui.editPermisos[key]} onChange={() => toggleEditPermiso(key)} />
                          <span>{PERMISO_LABELS[key]}</span>
                        </label>
                      ))}
                    </div>
                  </>
                ) : null}
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
                <p><strong>Rol:</strong> {ui.selectedPersona.role ?? "coordinador"}</p>
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
