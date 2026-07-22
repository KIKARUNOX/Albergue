import { useEffect, useState } from "react";
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

  return (
    <Modal isOpen={isOpen} title={editing ? "Editar persona" : "Detalle de persona"} onClose={onClose}>
      <div className="stack-sm">
        {editing ? (
          <>
            <Input placeholder="Nombre" required minLength={2} value={form.nombre} onChange={(e) => setField("nombre", e.target.value)} />
            <Input placeholder="Primer apellido" value={form.apellido1} onChange={(e) => setField("apellido1", e.target.value)} />
            <Input placeholder="Segundo apellido" value={form.apellido2} onChange={(e) => setField("apellido2", e.target.value)} />
            <Label>Sexo<Select value={form.sexo} onChange={(e) => setField("sexo", e.target.value)}>
              <option value="">Seleccionar...</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </Select></Label>
            <Input placeholder="Cedula" required value={form.cedula} onChange={(e) => setField("cedula", e.target.value)} />
            <Input type="number" min={0} max={120} placeholder="Edad" value={form.edad || ""} onChange={(e) => setField("edad", Number(e.target.value) || 0)} />
            <Input placeholder="Direccion" value={form.direccion} onChange={(e) => setField("direccion", e.target.value)} />
            <Input placeholder="Estado de salud" value={form.estado_salud} onChange={(e) => setField("estado_salud", e.target.value)} />
            <Input placeholder="Escolaridad" value={form.escolaridad} onChange={(e) => setField("escolaridad", e.target.value)} />
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
