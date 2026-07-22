import { useState } from "react";
import Swal from "sweetalert2";
import { normalizeName, normalizeCedula } from "../../lib/textNormalization";
import type { PersonaForm } from "../../type/persona";
import Button from "../atoms/Button";
import Input from "../atoms/Input";
import Label from "../atoms/Label";
import Modal from "../atoms/Modal";
import Select from "../atoms/Select";

const emptyForm: PersonaForm = {
  nombre: "",
  apellido1: "",
  apellido2: "",
  sexo: "",
  cedula: "",
  edad: 0,
  direccion: "",
  estado_salud: "",
  escolaridad: "",
};

type PersonaCreateModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (form: PersonaForm) => Promise<void>;
};

export default function PersonaCreateModal({
  isOpen,
  onClose,
  onConfirm,
}: PersonaCreateModalProps) {
  const [form, setForm] = useState<PersonaForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const setField = <K extends keyof PersonaForm>(key: K, value: PersonaForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const guardar = async () => {
    if (!form.nombre.trim()) {
      await Swal.fire({ icon: "warning", title: "Nombre requerido", text: "El nombre es obligatorio." });
      return;
    }
    if (!form.cedula.trim()) {
      await Swal.fire({ icon: "warning", title: "Cedula requerida", text: "La cedula es obligatoria." });
      return;
    }

    setSaving(true);
    try {
      await onConfirm({
        ...form,
        nombre: normalizeName(form.nombre),
        apellido1: normalizeName(form.apellido1),
        apellido2: normalizeName(form.apellido2),
        cedula: normalizeCedula(form.cedula),
        direccion: form.direccion.trim(),
        estado_salud: form.estado_salud.trim(),
        escolaridad: form.escolaridad.trim(),
      });
      setForm(emptyForm);
    } finally {
      setSaving(false);
    }
  };

  const cerrar = () => {
    setForm(emptyForm);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} title="Agregar persona" onClose={cerrar}>
      <div className="stack-sm">
        <Input placeholder="Nombre *" required minLength={2} value={form.nombre} onChange={(e) => setField("nombre", e.target.value)} />
        <Input placeholder="Primer apellido" value={form.apellido1} onChange={(e) => setField("apellido1", e.target.value)} />
        <Input placeholder="Segundo apellido" value={form.apellido2} onChange={(e) => setField("apellido2", e.target.value)} />
        <Label>Sexo<Select value={form.sexo} onChange={(e) => setField("sexo", e.target.value)}>
          <option value="">Seleccionar...</option>
          <option value="M">Masculino</option>
          <option value="F">Femenino</option>
        </Select></Label>
        <Input placeholder="Cedula *" required value={form.cedula} onChange={(e) => setField("cedula", e.target.value)} />
        <Input type="number" min={0} max={120} placeholder="Edad" value={form.edad || ""} onChange={(e) => setField("edad", Number(e.target.value) || 0)} />
        <Input placeholder="Direccion" value={form.direccion} onChange={(e) => setField("direccion", e.target.value)} />
        <Input placeholder="Estado de salud" value={form.estado_salud} onChange={(e) => setField("estado_salud", e.target.value)} />
        <Input placeholder="Escolaridad" value={form.escolaridad} onChange={(e) => setField("escolaridad", e.target.value)} />
        <Button onClick={() => void guardar()} disabled={saving}>{saving ? "Guardando..." : "Guardar persona"}</Button>
      </div>
    </Modal>
  );
}
