import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import type { PersonaDetalle, PersonaForm } from "../../type/persona";
import Button from "../atoms/Button";
import StatusMessage from "../atoms/StatusMessage";
import PageSection from "../templates/PageSection";

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

export default function EditarPersonasSection() {
  "use no memo";

  const [personas, setPersonas] = useState<PersonaDetalle[]>([]);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState<PersonaForm>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const cargar = async () => {
    setLoading(true);
    setMensaje("");

    try {
      const snapshot = await getDocs(collection(db, "personas"));
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as PersonaDetalle));
      data.sort((a, b) => {
        const na = `${a.nombre} ${a.apellido1 ?? ""} ${a.apellido2 ?? ""}`.toLowerCase();
        const nb = `${b.nombre} ${b.apellido1 ?? ""} ${b.apellido2 ?? ""}`.toLowerCase();
        return na.localeCompare(nb);
      });
      setPersonas(data);
    } catch (error) {
      console.error("Error al cargar personas:", error);
      setMensaje("No se pudieron cargar las personas. Revisa permisos de Firestore.");
    }

    setLoading(false);
  };

  useEffect(() => {
    void cargar();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return personas;

    return personas.filter((p) => {
      const fullName = `${p.nombre} ${p.apellido1 ?? ""} ${p.apellido2 ?? ""}`.toLowerCase();
      return fullName.includes(q);
    });
  }, [personas, query]);

  const seleccionar = (id: string) => {
    setSelectedId(id);
    const persona = personas.find((p) => p.id === id);

    if (!persona) {
      setForm(emptyForm);
      return;
    }

    setForm({
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
    setMensaje("");
  };

  const guardar = async () => {
    if (!selectedId) {
      setMensaje("Selecciona una persona para editar.");
      return;
    }

    if (!form.nombre.trim()) {
      setMensaje("El nombre es obligatorio.");
      return;
    }

    setSaving(true);
    setMensaje("");

    try {
      await updateDoc(doc(db, "personas", selectedId), {
        nombre: form.nombre.trim(),
        apellido1: form.apellido1?.trim() ?? "",
        apellido2: form.apellido2?.trim() ?? "",
        email: form.email?.trim() ?? "",
        telefono: form.telefono?.trim() ?? "",
        localidad: form.localidad?.trim() ?? "",
        fechaNacimiento: form.fechaNacimiento ?? "",
        bautizado: Boolean(form.bautizado),
        puntos: Number(form.puntos ?? 0),
      });

      setMensaje("Persona actualizada correctamente.");
      await cargar();
    } catch (error) {
      console.error("Error al actualizar persona:", error);
      setMensaje("No se pudo guardar. Revisa permisos de Firestore.");
    }

    setSaving(false);
  };

  return (
    <PageSection title="Editar personas">
      <input
        placeholder="Buscar por nombre..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {loading ? <p>Cargando personas...</p> : null}

      <select value={selectedId} onChange={(e) => seleccionar(e.target.value)}>
        <option value="">Selecciona una persona</option>
        {filtered.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nombre} {p.apellido1} {p.apellido2}
          </option>
        ))}
      </select>

      <div className="stack-sm">
        <input
          placeholder="Nombre"
          value={form.nombre}
          onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
        />
        <input
          placeholder="Primer apellido"
          value={form.apellido1}
          onChange={(e) => setForm((prev) => ({ ...prev, apellido1: e.target.value }))}
        />
        <input
          placeholder="Segundo apellido"
          value={form.apellido2}
          onChange={(e) => setForm((prev) => ({ ...prev, apellido2: e.target.value }))}
        />
        <input
          type="email"
          placeholder="Correo"
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
        />
        <input
          placeholder="Telefono"
          value={form.telefono}
          onChange={(e) => setForm((prev) => ({ ...prev, telefono: e.target.value }))}
        />
        <input
          placeholder="Localidad"
          value={form.localidad}
          onChange={(e) => setForm((prev) => ({ ...prev, localidad: e.target.value }))}
        />
        <label>
          Fecha de nacimiento
          <input
            type="date"
            value={form.fechaNacimiento}
            onChange={(e) => setForm((prev) => ({ ...prev, fechaNacimiento: e.target.value }))}
          />
        </label>
        <label className="checkbox-item">
          <input
            type="checkbox"
            checked={form.bautizado}
            onChange={(e) => setForm((prev) => ({ ...prev, bautizado: e.target.checked }))}
          />
          <span>Bautizado</span>
        </label>
        <input
          type="number"
          placeholder="Puntos"
          value={form.puntos ?? 0}
          onChange={(e) => setForm((prev) => ({ ...prev, puntos: Number(e.target.value) || 0 }))}
        />

        <Button type="button" onClick={() => void guardar()} disabled={saving}>
          {saving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>

      <StatusMessage message={mensaje} />
    </PageSection>
  );
}
