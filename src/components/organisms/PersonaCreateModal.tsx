import { useState } from "react";
import Swal from "sweetalert2";
import { defaultPermisosByRole } from "../../lib/permissions";
import { normalizeRoleValue } from "../../lib/textNormalization";
import { normalizeEmail, normalizeName, normalizePhone } from "../../lib/textNormalization";
import type { PersonaForm, PersonaPermisos, PersonaRole } from "../../type/persona";
import Button from "../atoms/Button";
import Input from "../atoms/Input";
import Label from "../atoms/Label";
import Modal from "../atoms/Modal";
import Select from "../atoms/Select";

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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+()\s-]{7,20}$/;

const PERMISO_LABELS: Record<keyof PersonaPermisos, string> = {
  dashboard: "Ver dashboard",
  asistencias: "Gestionar asistencias",
  personas: "Gestionar personas",
  importacion: "Importar",
  gestionarPermisos: "Gestionar permisos",
};

type PersonaCreateModalProps = {
  isOpen: boolean;
  onClose: () => void;
  canManagePermissions: boolean;
  onConfirm: (form: PersonaForm, role: PersonaRole, permisos: PersonaPermisos) => Promise<void>;
};

export default function PersonaCreateModal({
  isOpen,
  onClose,
  canManagePermissions,
  onConfirm,
}: PersonaCreateModalProps) {
  const [form, setForm] = useState<PersonaForm>(emptyForm);
  const [role, setRole] = useState<PersonaRole>("joven");
  const [permisos, setPermisos] = useState<PersonaPermisos>(defaultPermisosByRole("joven"));
  const [saving, setSaving] = useState(false);

  const setField = <K extends keyof PersonaForm>(key: K, value: PersonaForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onRoleChange = (newRole: PersonaRole) => {
    setRole(newRole);
    setPermisos(defaultPermisosByRole(newRole));
  };

  const togglePermiso = (key: keyof PersonaPermisos) => {
    setPermisos((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const guardar = async () => {
    if (!form.nombre.trim()) {
      await Swal.fire({ icon: "warning", title: "Nombre requerido", text: "El nombre es obligatorio." });
      return;
    }
    if (form.email?.trim() && !EMAIL_PATTERN.test(form.email.trim())) {
      await Swal.fire({ icon: "warning", title: "Email invalido", text: "El correo no tiene un formato valido." });
      return;
    }
    if (form.telefono?.trim() && !PHONE_PATTERN.test(form.telefono.trim())) {
      await Swal.fire({ icon: "warning", title: "Telefono invalido", text: "El telefono solo puede contener numeros y simbolos basicos." });
      return;
    }

    setSaving(true);
    try {
      await onConfirm(
        {
          ...form,
          nombre: normalizeName(form.nombre),
          apellido1: normalizeName(form.apellido1),
          apellido2: normalizeName(form.apellido2),
          email: normalizeEmail(form.email),
          telefono: normalizePhone(form.telefono),
        },
        canManagePermissions ? normalizeRoleValue(role) : "joven",
        canManagePermissions ? permisos : defaultPermisosByRole("joven"),
      );
      setForm(emptyForm);
      setRole("joven");
      setPermisos(defaultPermisosByRole("joven"));
    } finally {
      setSaving(false);
    }
  };

  const cerrar = () => {
    setForm(emptyForm);
    setRole("joven");
    setPermisos(defaultPermisosByRole("joven"));
    onClose();
  };

  return (
    <Modal isOpen={isOpen} title="Agregar persona" onClose={cerrar}>
      <div className="stack-sm">
        <Input placeholder="Nombre *" required minLength={2} value={form.nombre} onChange={(e) => setField("nombre", e.target.value)} />
        <Input placeholder="Primer apellido" value={form.apellido1} onChange={(e) => setField("apellido1", e.target.value)} />
        <Input placeholder="Segundo apellido" value={form.apellido2} onChange={(e) => setField("apellido2", e.target.value)} />
        <Input type="email" placeholder="Correo" value={form.email} onChange={(e) => setField("email", e.target.value)} />
        <Input type="tel" pattern="[0-9+()\s-]{7,20}" placeholder="Telefono" value={form.telefono} onChange={(e) => setField("telefono", e.target.value)} />
        <Input placeholder="Localidad" value={form.localidad} onChange={(e) => setField("localidad", e.target.value)} />
        <Label>Fecha de nacimiento<Input type="date" value={form.fechaNacimiento} onChange={(e) => setField("fechaNacimiento", e.target.value)} /></Label>
        <label className="checkbox-item">
          <Input type="checkbox" checked={form.bautizado} onChange={(e) => setField("bautizado", e.target.checked)} />
          <span>Bautizado</span>
        </label>
        {canManagePermissions ? (
          <>
            <Label>Rol<Select value={role} onChange={(e) => onRoleChange(e.target.value as PersonaRole)}>
              <option value="joven">Joven</option>
              <option value="coordinador">Coordinador</option>
              <option value="lider">Lider</option>
            </Select></Label>
            <div className="stack-sm">
              <strong>Permisos</strong>
              {(Object.keys(PERMISO_LABELS) as Array<keyof PersonaPermisos>).map((key) => (
                <label key={key} className="checkbox-item">
                  <Input type="checkbox" checked={permisos[key]} onChange={() => togglePermiso(key)} />
                  <span>{PERMISO_LABELS[key]}</span>
                </label>
              ))}
            </div>
          </>
        ) : null}
        <Input type="number" min={0} step={1} placeholder="Puntos" value={form.puntos ?? 0} onChange={(e) => setField("puntos", Number(e.target.value) || 0)} />
        <Button onClick={() => void guardar()} disabled={saving}>{saving ? "Guardando..." : "Guardar persona"}</Button>
      </div>
    </Modal>
  );
}
