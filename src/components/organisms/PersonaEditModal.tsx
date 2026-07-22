import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import Swal from "sweetalert2";
import { normalizeName, normalizeCedula } from "../../lib/textNormalization";
import type { Persona, PersonaForm } from "../../type/persona";
import Button from "../atoms/Button";
import Input from "../atoms/Input";
import Label from "../atoms/Label";
import Modal from "../atoms/Modal";
import Select from "../atoms/Select";

type PersonaEditModalProps = {
  isOpen: boolean;
  persona: Persona | null;
  onConfirm: (id: string, form: PersonaForm) => Promise<void>;
  onClose: () => void;
};

export default function PersonaEditModal({
  isOpen,
  persona,
  onConfirm,
  onClose,
}: PersonaEditModalProps) {
  const [form, setForm] = useState<PersonaForm>({
    nombre: "", apellido1: "", apellido2: "", sexo: "", cedula: "",
    edad: 0, direccion: "", estado_salud: "", escolaridad: "",
  });
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (persona) {
      setForm({
        nombre: persona.nombre ?? "",
        apellido1: persona.apellido1 ?? "",
        apellido2: persona.apellido2 ?? "",
        sexo: persona.sexo ?? "",
        cedula: persona.cedula ?? "",
        edad: persona.edad ?? 0,
        direccion: persona.direccion ?? "",
        estado_salud: persona.estado_salud ?? "",
        escolaridad: persona.escolaridad ?? "",
      });
      setEditing(false);
    }
  }, [persona]);

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
      await onConfirm(
        persona!.id,
        {
          ...form,
          nombre: normalizeName(form.nombre),
          apellido1: normalizeName(form.apellido1),
          apellido2: normalizeName(form.apellido2),
          cedula: normalizeCedula(form.cedula),
          direccion: form.direccion.trim(),
          estado_salud: form.estado_salud.trim(),
          escolaridad: form.escolaridad.trim(),
        },
      );
    } finally {
      setSaving(false);
    }
  };

  if (!persona) return null;

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
    <Modal isOpen={isOpen} title={editing ? "Editar persona" : "Detalle de persona"} onClose={onClose}>
      <div className="stack-sm">
        {editing ? (
          <>
            <Input placeholder="Nombre" required minLength={2} value={form.nombre} onChange={onInputChange} />
            <Input placeholder="Primer apellido" value={form.apellido1} onChange={onInputApe1} />
            <Input placeholder="Segundo apellido" value={form.apellido2} onChange={onInputApe2} />
            <Label>Sexo<Select value={form.sexo} onChange={onSelectSexo}>
              <option value="">Seleccionar...</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </Select></Label>
            <Input placeholder="Cedula" required value={form.cedula} onChange={onInputCedula} />
            <Input type="number" min={0} max={120} placeholder="Edad" value={form.edad || ""} onChange={onInputEdad} />
            <Input placeholder="Direccion" value={form.direccion} onChange={onInputDir} />
            <Input placeholder="Estado de salud" value={form.estado_salud} onChange={onInputSalud} />
            <Input placeholder="Escolaridad" value={form.escolaridad} onChange={onInputEsc} />
            <div className="table-actions">
              <Button onClick={() => void guardar()} disabled={saving}>{saving ? "Guardando..." : "Guardar cambios"}</Button>
              <Button variant="secondary" onClick={() => setEditing(false)}>Cancelar</Button>
            </div>
          </>
        ) : (
          <>
            <p><strong>Nombre:</strong> {`${persona.nombre} ${persona.apellido1} ${persona.apellido2}`.trim()}</p>
            <p><strong>Sexo:</strong> {persona.sexo === "M" ? "Masculino" : persona.sexo === "F" ? "Femenino" : persona.sexo || "-"}</p>
            <p><strong>Cedula:</strong> {persona.cedula}</p>
            <p><strong>Edad:</strong> {persona.edad}</p>
            <p><strong>Direccion:</strong> {persona.direccion || "-"}</p>
            <p><strong>Estado de salud:</strong> {persona.estado_salud || "-"}</p>
            <p><strong>Escolaridad:</strong> {persona.escolaridad || "-"}</p>
            <div className="table-actions">
              <Button onClick={() => setEditing(true)}>Editar</Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
