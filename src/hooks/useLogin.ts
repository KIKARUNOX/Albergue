import { useState } from "react";
import type { FormEvent } from "react";
import Swal from "sweetalert2";
import { supabase } from "../supabase";

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
        text: "Email y contrasena son requeridos.",
      });
      setError("Email y contrasena son requeridos");
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
        title: "Contrasena invalida",
        text: "La contrasena debe tener al menos 6 caracteres.",
      });
      setError("La contrasena debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: emailNormalizado,
        password,
      });

      if (authError) {
        await Swal.fire({
          icon: "error",
          title: "No se pudo iniciar sesion",
          text: authError.message,
        });
        setError(authError.message);
      }
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : "Error al iniciar sesion";
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
