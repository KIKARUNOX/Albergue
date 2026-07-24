import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import Swal from "sweetalert2";
import { normalizeName, normalizeCedula } from "../../lib/textNormalization";
import { supabase } from "../../supabase";
import type { Persona, PersonaForm } from "../../type/persona";
import Button from "../atoms/Button";
import Input from "../atoms/Input";
import Label from "../atoms/Label";
import Modal from "../atoms/Modal";
import Select from "../atoms/Select";

type Cabeza = {
  id: string;
  nombre: string;
  apellido1: string;
  apellido2: string;
};

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
    nombre: "",
    apellido1: "",
    apellido2: "",
    sexo: "",
    cedula: "",
    edad: 0,
    direccion: "",
    estado_salud: "",
    escolaridad: "",
    familiar: "",
    relacion: "",
    estado: "",
  });
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [cabezas, setCabezas] = useState<Cabeza[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchCabezas = async () => {
      const { data } = await supabase
        .from("personas")
        .select("id, nombre, apellido1, apellido2")
        .eq("relacion", "Cabeza de familia")
        .order("created_at", { ascending: true });
      if (data) setCabezas(data as Cabeza[]);
    };
    void fetchCabezas();
  }, [isOpen]);

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
        familiar: persona.familiar ?? "",
        relacion: persona.relacion ?? "",
        estado: persona.estado ?? "",
      });
      setEditing(false);
    }
  }, [persona]);

  const setField = <K extends keyof PersonaForm>(
    key: K,
    value: PersonaForm[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const guardar = async () => {
    if (!form.nombre.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "Nombre requerido",
        text: "El nombre es obligatorio.",
      });
      return;
    }
    if (!form.cedula.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "Cedula requerida",
        text: "La cedula es obligatoria.",
      });
      return;
    }

    const nombreCompleto = `${normalizeName(form.nombre)} ${normalizeName(form.apellido1)} ${normalizeName(form.apellido2)}`.trim();

    setSaving(true);
    try {
      await onConfirm(persona!.id, {
        ...form,
        nombre: normalizeName(form.nombre),
        apellido1: normalizeName(form.apellido1),
        apellido2: normalizeName(form.apellido2),
        cedula: normalizeCedula(form.cedula),
        direccion: form.direccion.trim(),
        estado_salud: form.estado_salud.trim(),
        escolaridad: form.escolaridad.trim(),
        familiar: form.relacion === "Cabeza de familia" ? nombreCompleto : form.familiar.trim(),
        relacion: form.relacion.trim(),
        estado: form.estado.trim(),
      });
    } finally {
      setSaving(false);
    }
  };

  if (!persona) return null;

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) =>
    setField("nombre", e.target.value);
  const onInputApe1 = (e: ChangeEvent<HTMLInputElement>) =>
    setField("apellido1", e.target.value);
  const onInputApe2 = (e: ChangeEvent<HTMLInputElement>) =>
    setField("apellido2", e.target.value);
  const onInputCedula = (e: ChangeEvent<HTMLInputElement>) =>
    setField("cedula", e.target.value);
  const onInputEdad = (e: ChangeEvent<HTMLInputElement>) =>
    setField("edad", Number(e.target.value) || 0);
  const onInputDir = (e: ChangeEvent<HTMLInputElement>) =>
    setField("direccion", e.target.value);
  const onSelectSalud = (e: ChangeEvent<HTMLSelectElement>) =>
    setField("estado_salud", e.target.value);
  const onSelectEsc = (e: ChangeEvent<HTMLSelectElement>) =>
    setField("escolaridad", e.target.value);
  const onSelectSexo = (e: ChangeEvent<HTMLSelectElement>) =>
    setField("sexo", e.target.value);
  const onSelectRelacion = (e: ChangeEvent<HTMLSelectElement>) =>
    setField("relacion", e.target.value);
  const onSelectFamiliar = (e: ChangeEvent<HTMLSelectElement>) =>
    setField("familiar", e.target.value);
  const onSelectEstado = (e: ChangeEvent<HTMLSelectElement>) =>
    setField("estado", e.target.value);

  const esCabeza = form.relacion === "Cabeza de familia";

  return (
    <Modal
      isOpen={isOpen}
      title={editing ? "Editar persona" : "Detalle de persona"}
      onClose={onClose}
    >
      <div className="stack-sm">
        {editing ? (
          <>
            <Label htmlFor="e-nombre">
              Nombre *
              <Input
                id="e-nombre"
                placeholder="Nombre"
                required
                minLength={2}
                value={form.nombre}
                onChange={onInputChange}
              />
            </Label>
            <Label htmlFor="e-ape1">
              Primer apellido
              <Input
                id="e-ape1"
                placeholder="Primer apellido"
                value={form.apellido1}
                onChange={onInputApe1}
              />
            </Label>
            <Label htmlFor="e-ape2">
              Segundo apellido
              <Input
                id="e-ape2"
                placeholder="Segundo apellido"
                value={form.apellido2}
                onChange={onInputApe2}
              />
            </Label>
            <Label htmlFor="e-sexo">
              Sexo
              <Select id="e-sexo" value={form.sexo} onChange={onSelectSexo}>
                <option value="">Seleccionar...</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </Select>
            </Label>
            <Label htmlFor="e-cedula">
              Cedula *
              <Input
                id="e-cedula"
                placeholder="Cedula"
                required
                value={form.cedula}
                onChange={onInputCedula}
              />
            </Label>
            <Label htmlFor="e-edad">
              Edad
              <Input
                id="e-edad"
                type="number"
                min={0}
                max={120}
                placeholder="Edad"
                value={form.edad || ""}
                onChange={onInputEdad}
              />
            </Label>
            <Label htmlFor="e-dir">
              Direccion
              <Input
                id="e-dir"
                placeholder="Direccion"
                value={form.direccion}
                onChange={onInputDir}
              />
            </Label>
            <Label htmlFor="e-salud">
              Estado de salud
              <Select
                id="e-salud"
                value={form.estado_salud}
                onChange={onSelectSalud}
              >
                <option value="">Seleccionar...</option>
                <option value="Sano">Sano</option>
                <option value="Enfermo">Enfermo</option>
              </Select>
            </Label>
            <Label htmlFor="e-esc">
              Escolaridad
              <Select
                id="e-esc"
                value={form.escolaridad}
                onChange={onSelectEsc}
              >
                <option value="">Seleccionar...</option>
                <option value="Primaria">Primaria</option>
                <option value="Secundaria">Secundaria</option>
                <option value="Bachillerato">Bachillerato</option>
                <option value="Superior">Superior</option>
              </Select>
            </Label>
            <Label htmlFor="e-relacion">
              Relacion con el familiar
              <Select
                id="e-relacion"
                value={form.relacion}
                onChange={onSelectRelacion}
              >
                <option value="">Seleccionar...</option>
                <option value="Cabeza de familia">Cabeza de familia</option>
                <option value="Conyuge">Conyuge</option>
                <option value="Hijo/a">Hijo/a</option>
                <option value="Padre/Madre">Padre/Madre</option>
                <option value="Hermano/a">Hermano/a</option>
                <option value="Otro">Otro</option>
              </Select>
            </Label>
            {!esCabeza && (
              <Label htmlFor="e-familiar">
                Cabeza de familia
                <Select
                  id="e-familiar"
                  value={form.familiar}
                  onChange={onSelectFamiliar}
                >
                  <option value="">Seleccionar cabeza de familia...</option>
                  {cabezas.map((c) => (
                    <option key={c.id} value={`${c.nombre} ${c.apellido1} ${c.apellido2}`.trim()}>
                      {`${c.nombre} ${c.apellido1} ${c.apellido2}`.trim()}
                    </option>
                  ))}
                </Select>
              </Label>
            )}
            <Label htmlFor="e-estado">
              Estado
              <Select id="e-estado" value={form.estado} onChange={onSelectEstado}>
                <option value="">Seleccionar...</option>
                <option value="Presente">presente</option>
                <option value="Salio">Salio</option>
                <option value="Ausente">Ausente</option>
                <option value="Salio con permiso">Salio con permiso</option>
              </Select>
            </Label>
            <div className="table-actions">
              <Button onClick={() => void guardar()} disabled={saving}>
                {saving ? "Guardando..." : "Guardar cambios"}
              </Button>
              <Button variant="secondary" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
            </div>
          </>
        ) : (
          <>
            <p>
              <strong>Nombre:</strong>{" "}
              {`${persona.nombre} ${persona.apellido1} ${persona.apellido2}`.trim()}
            </p>
            <p>
              <strong>Sexo:</strong>{" "}
              {persona.sexo === "M"
                ? "Masculino"
                : persona.sexo === "F"
                  ? "Femenino"
                  : persona.sexo || "-"}
            </p>
            <p>
              <strong>Cedula:</strong> {persona.cedula}
            </p>
            <p>
              <strong>Edad:</strong> {persona.edad}
            </p>
            <p>
              <strong>Direccion:</strong> {persona.direccion || "-"}
            </p>
            <p>
              <strong>Estado de salud:</strong> {persona.estado_salud || "-"}
            </p>
            <p>
              <strong>Escolaridad:</strong> {persona.escolaridad || "-"}
            </p>
            <p>
              <strong>Familiar:</strong> {persona.familiar || "-"}
            </p>
            <p>
              <strong>Relacion:</strong> {persona.relacion || "-"}
            </p>
            <p>
              <strong>Estado:</strong> {persona.estado || "-"}
            </p>
            <div className="table-actions">
              <Button onClick={() => setEditing(true)}>Editar</Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
