import { useMemo, useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import Swal from "sweetalert2";
import { db } from "../../firebase";
import type { ProfileSectionProps } from "../../type/componentProps";
import Button from "../atoms/Button";
import PageSection from "../templates/PageSection";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+()\s-]{7,20}$/;

export default function ProfileSection({
  personaId,
  persona,
}: ProfileSectionProps) {
  const [nombre, setNombre] = useState(persona.nombre ?? "");
  const [apellido1, setApellido1] = useState(persona.apellido1 ?? "");
  const [apellido2, setApellido2] = useState(persona.apellido2 ?? "");
  const [email, setEmail] = useState(persona.email ?? "");
  const [telefono, setTelefono] = useState(persona.telefono ?? "");
  const [localidad, setLocalidad] = useState(persona.localidad ?? "");
  const [fechaNacimiento, setFechaNacimiento] = useState(
    persona.fechaNacimiento ?? "",
  );
  const [saving, setSaving] = useState(false);

  const role = useMemo(() => persona.role ?? "joven", [persona.role]);

  const saveProfile = async () => {
    const nombreTrim = nombre.trim();
    const emailTrim = email.trim().toLowerCase();
    const telefonoTrim = telefono.trim();

    if (!nombreTrim) {
      await Swal.fire({
        icon: "warning",
        title: "Nombre requerido",
        text: "El nombre es obligatorio.",
      });
      return;
    }
    if (emailTrim && !EMAIL_PATTERN.test(emailTrim)) {
      await Swal.fire({
        icon: "warning",
        title: "Email invalido",
        text: "El correo no tiene un formato valido.",
      });
      return;
    }
    if (telefonoTrim && !PHONE_PATTERN.test(telefonoTrim)) {
      await Swal.fire({
        icon: "warning",
        title: "Telefono invalido",
        text: "El telefono solo puede contener numeros y simbolos basicos (+ - ( )).",
      });
      return;
    }

    setSaving(true);
    try {
      await setDoc(doc(db, "personas", personaId), {
        id: personaId,
        authUid: persona.authUid ?? personaId,
        role: role || "joven",
        permisos: persona.permisos ?? {},
        nombre: nombreTrim,
        apellido1: apellido1.trim(),
        apellido2: apellido2.trim(),
        email: emailTrim,
        telefono: telefonoTrim,
        localidad: localidad.trim(),
        fechaNacimiento,
      }, { merge: true });
      await Swal.fire({
        icon: "success",
        title: "Perfil actualizado",
        text: "Tus datos fueron guardados.",
      });
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo guardar el perfil.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageSection title="Mi perfil">
      <div className="stack-sm">
        <p className="small-text">Rol actual: {role}</p>
        <input
          type="text"
          required
          minLength={2}
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <input
          type="text"
          placeholder="Primer apellido"
          value={apellido1}
          onChange={(e) => setApellido1(e.target.value)}
        />
        <input
          type="text"
          placeholder="Segundo apellido"
          value={apellido2}
          onChange={(e) => setApellido2(e.target.value)}
        />
        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="tel"
          pattern="[0-9+()\s-]{7,20}"
          placeholder="Telefono"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
        />
        <input
          type="text"
          placeholder="Localidad"
          value={localidad}
          onChange={(e) => setLocalidad(e.target.value)}
        />
        <label>
          Fecha de nacimiento
          <input
            type="date"
            value={fechaNacimiento}
            onChange={(e) => setFechaNacimiento(e.target.value)}
          />
        </label>
        <Button onClick={() => void saveProfile()} disabled={saving}>
          {saving ? "Guardando..." : "Guardar perfil"}
        </Button>
      </div>
    </PageSection>
  );
}
