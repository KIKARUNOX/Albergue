import { useState } from "react";
import type { SyntheticEvent } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

type FormData = {
  nombre: string;
  apellido1: string;
  apellido2: string;
  email: string;
  telefono: string;
  localidad: string;
  fechaNacimiento: string;
  bautizado: boolean;
};

const initialForm: FormData = {
  nombre: "",
  apellido1: "",
  apellido2: "",
  email: "",
  telefono: "",
  localidad: "",
  fechaNacimiento: "",
  bautizado: false,
};

export default function RegistrarPersona() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.nombre.trim()) {
      setMensaje("El nombre es obligatorio.");
      return;
    }

    setSaving(true);
    setMensaje("");

    try {
      await addDoc(collection(db, "personas"), {
        nombre: form.nombre.trim(),
        apellido1: form.apellido1.trim(),
        apellido2: form.apellido2.trim(),
        email: form.email.trim(),
        telefono: form.telefono.trim(),
        localidad: form.localidad.trim(),
        fechaNacimiento: form.fechaNacimiento || "",
        bautizado: form.bautizado,
        puntos: 0,
        createdAt: serverTimestamp(),
      });

      setForm(initialForm);
      setMensaje("Persona registrada correctamente.");
    } catch (error) {
      console.error("Error al registrar persona:", error);
      setMensaje("No se pudo registrar la persona. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16, marginBottom: 16 }}>
      <h2>Registrar persona</h2>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8 }}>
        <input
          placeholder="Nombre *"
          value={form.nombre}
          onChange={(e) => updateField("nombre", e.target.value)}
          required
        />
        <input
          placeholder="Primer apellido"
          value={form.apellido1}
          onChange={(e) => updateField("apellido1", e.target.value)}
        />
        <input
          placeholder="Segundo apellido"
          value={form.apellido2}
          onChange={(e) => updateField("apellido2", e.target.value)}
        />
        <input
          type="email"
          placeholder="Correo"
          value={form.email}
          onChange={(e) => updateField("email", e.target.value)}
        />
        <input
          placeholder="Telefono"
          value={form.telefono}
          onChange={(e) => updateField("telefono", e.target.value)}
        />
        <input
          placeholder="Localidad"
          value={form.localidad}
          onChange={(e) => updateField("localidad", e.target.value)}
        />
        <label>
          Fecha de nacimiento
          <input
            type="date"
            value={form.fechaNacimiento}
            onChange={(e) => updateField("fechaNacimiento", e.target.value)}
          />
        </label>
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={form.bautizado}
            onChange={(e) => updateField("bautizado", e.target.checked)}
          />
          Bautizado
        </label>

        <button type="submit" disabled={saving}>
          {saving ? "Guardando..." : "Registrar"}
        </button>
      </form>
      {mensaje && <p>{mensaje}</p>}
    </div>
  );
}
