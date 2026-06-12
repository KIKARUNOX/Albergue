import { useState } from "react";
import type { FormEvent } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import Swal from "sweetalert2";
import { auth } from "../firebase";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function useLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const emailNormalizado = email.trim().toLowerCase();
    if (!emailNormalizado || !password) {
      await Swal.fire({
        icon: "warning",
        title: "Datos requeridos",
        text: "Email y contraseña son requeridos.",
      });
      setError("Email y contraseña son requeridos");
      return;
    }
    if (!EMAIL_PATTERN.test(emailNormalizado)) {
      await Swal.fire({
        icon: "warning",
        title: "Email invalido",
        text: "Ingresa un email valido.",
      });
      setError("Ingresa un email valido");
      return;
    }
    if (password.length < 6) {
      await Swal.fire({
        icon: "warning",
        title: "Contraseña invalida",
        text: "La contraseña debe tener al menos 6 caracteres.",
      });
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, emailNormalizado, password);
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : "Error al iniciar sesión";
      await Swal.fire({
        icon: "error",
        title: "No se pudo iniciar sesion",
        text: errorMessage,
      });
      setError(errorMessage);
    }

    setLoading(false);
  };

  return { email, password, error, loading, login, setEmail, setPassword };
}
