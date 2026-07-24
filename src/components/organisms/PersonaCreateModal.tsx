import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import Swal from "sweetalert2";
import { normalizeName, normalizeCedula } from "../../lib/textNormalization";
import { supabase } from "../../supabase";
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
  familiar: "",
  relacion: "",
  estado: "",
};

type Cabeza = {
  id: string;
  nombre: string;
  apellido1: string;
  apellido2: string;
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
      await onConfirm({
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
      setForm(emptyForm);
    } finally {
      setSaving(false);
    }
  };

  const cerrar = () => {
    setForm(emptyForm);
    onClose();
  };

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
    <Modal isOpen={isOpen} title="Agregar persona" onClose={cerrar}>
      <div className="stack-sm">
        <Label htmlFor="c-nombre">
          Nombre *
          <Input
            id="c-nombre"
            placeholder="Nombre"
            required
            minLength={2}
            value={form.nombre}
            onChange={onInputChange}
          />
        </Label>
        <Label htmlFor="c-ape1">
          Primer apellido
          <Input
            id="c-ape1"
            placeholder="Primer apellido"
            value={form.apellido1}
            onChange={onInputApe1}
          />
        </Label>
        <Label htmlFor="c-ape2">
          Segundo apellido
          <Input
            id="c-ape2"
            placeholder="Segundo apellido"
            value={form.apellido2}
            onChange={onInputApe2}
          />
        </Label>
        <Label htmlFor="c-sexo">
          Sexo
          <Select id="c-sexo" value={form.sexo} onChange={onSelectSexo}>
            <option value="">Seleccionar...</option>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
          </Select>
        </Label>
        <Label htmlFor="c-cedula">
          Cedula *
          <Input
            id="c-cedula"
            placeholder="Cedula"
            required
            value={form.cedula}
            onChange={onInputCedula}
          />
        </Label>
        <Label htmlFor="c-edad">
          Edad
          <Input
            id="c-edad"
            type="number"
            min={0}
            max={120}
            placeholder="Edad"
            value={form.edad || ""}
            onChange={onInputEdad}
          />
        </Label>
        <Label htmlFor="c-dir">
          Direccion
          <Input
            id="c-dir"
            placeholder="Direccion"
            value={form.direccion}
            onChange={onInputDir}
          />
        </Label>
        <Label htmlFor="c-salud">
          Estado de salud
          <Select
            id="c-salud"
            value={form.estado_salud}
            onChange={onSelectSalud}
          >
            <option value="">Seleccionar...</option>
            <option value="Sano">Sano</option>
            <option value="Enfermo">Enfermo</option>
          </Select>
        </Label>
        <Label htmlFor="c-esc">
          Escolaridad
          <Select id="c-esc" value={form.escolaridad} onChange={onSelectEsc}>
            <option value="">Seleccionar...</option>
            <option value="Primaria">Primaria</option>
            <option value="Secundaria">Secundaria</option>
            <option value="Bachillerato">Bachillerato</option>
            <option value="Superior">Superior</option>
          </Select>
        </Label>
        <Label htmlFor="c-relacion">
          Relacion con el familiar
          <Select
            id="c-relacion"
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
          <Label htmlFor="c-familiar">
            Cabeza de familia
            <Select
              id="c-familiar"
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
        <Label htmlFor="c-estado">
          Estado
          <Select id="c-estado" value={form.estado} onChange={onSelectEstado}>
            <option value="">Seleccionar...</option>
            <option value="Presente">presente</option>
            <option value="Salio">Salio</option>
            <option value="Ausente">Ausente</option>
            <option value="Salio con permiso">Salio con permiso</option>
          </Select>
        </Label>
        <Button onClick={() => void guardar()} disabled={saving}>
          {saving ? "Guardando..." : "Guardar persona"}
        </Button>
      </div>
    </Modal>
  );
}
