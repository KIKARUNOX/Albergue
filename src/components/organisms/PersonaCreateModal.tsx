import { useState } from "react";
import type { ChangeEvent } from "react";
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

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => setField("nombre", e.target.value);
  const onInputApe1 = (e: ChangeEvent<HTMLInputElement>) => setField("apellido1", e.target.value);
  const onInputApe2 = (e: ChangeEvent<HTMLInputElement>) => setField("apellido2", e.target.value);
  const onInputCedula = (e: ChangeEvent<HTMLInputElement>) => setField("cedula", e.target.value);
  const onInputEdad = (e: ChangeEvent<HTMLInputElement>) => setField("edad", Number(e.target.value) || 0);
  const onInputDir = (e: ChangeEvent<HTMLInputElement>) => setField("direccion", e.target.value);
  const onInputSalud = (e: ChangeEvent<HTMLInputElement>) => setField("estado_salud", e.target.value);
  const onInputEsc = (e: ChangeEvent<HTMLInputElement>) => setField("escolaridad", e.target.value);
  const onSelectSexo = (e: ChangeEvent<HTMLSelectElement>) => setField("sexo", e.target.value);

  return (
    <Modal isOpen={isOpen} title="Agregar persona" onClose={cerrar}>
      <div className="stack-sm">
        <Label htmlFor="c-nombre" required>Nombre<Input id="c-nombre" placeholder="Nombre" required minLength={2} value={form.nombre} onChange={onInputChange} /></Label>
        <Label htmlFor="c-ape1">Primer apellido<Input id="c-ape1" placeholder="Primer apellido" value={form.apellido1} onChange={onInputApe1} /></Label>
        <Label htmlFor="c-ape2">Segundo apellido<Input id="c-ape2" placeholder="Segundo apellido" value={form.apellido2} onChange={onInputApe2} /></Label>
        <Label htmlFor="c-sexo">Sexo<Select id="c-sexo" value={form.sexo} onChange={onSelectSexo}>
          <option value="">Seleccionar...</option>
          <option value="M">Masculino</option>
          <option value="F">Femenino</option>
        </Select></Label>
        <Label htmlFor="c-cedula" required>Cedula<Input id="c-cedula" placeholder="Cedula" required value={form.cedula} onChange={onInputCedula} /></Label>
        <Label htmlFor="c-edad">Edad<Input id="c-edad" type="number" min={0} max={120} placeholder="Edad" value={form.edad || ""} onChange={onInputEdad} /></Label>
        <Label htmlFor="c-dir">Direccion<Input id="c-dir" placeholder="Direccion" value={form.direccion} onChange={onInputDir} /></Label>
        <Label htmlFor="c-salud">Estado de salud<Input id="c-salud" placeholder="Estado de salud" value={form.estado_salud} onChange={onInputSalud} /></Label>
        <Label htmlFor="c-esc">Escolaridad<Input id="c-esc" placeholder="Escolaridad" value={form.escolaridad} onChange={onInputEsc} /></Label>
        <Button onClick={() => void guardar()} disabled={saving}>{saving ? "Guardando..." : "Guardar persona"}</Button>
      </div>
    </Modal>
  );
}
