import { useState } from "react";
import type { FormEvent } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import Swal from "sweetalert2";
import { auth } from "../firebase";
import { Link } from "react-router-dom";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
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
      const errorMessage = e instanceof Error ? e.message : "Error al iniciar sesión";
      await Swal.fire({
        icon: "error",
        title: "No se pudo iniciar sesion",
        text: errorMessage,
      });
      setError(errorMessage);
    }

    setLoading(false);
  };

  return (
    <div className="auth-layout">
      <section className="auth-card">
        <p className="eyebrow">Codigo316</p>
        <h2>Login</h2>
        <p className="auth-subtitle">Ingresa con tu cuenta</p>
        <form className="stack" onSubmit={login}>
          {error && <p className="form-message error">{error}</p>}
          <input
            placeholder="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
        <p className="auth-footer">
          ¿No tienes cuenta? <Link to="/signup">Regístrate aquí</Link>
        </p>
      </section>
    </div>
  );
}
