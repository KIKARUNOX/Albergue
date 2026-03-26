import { useState } from "react";
import type { FormEvent } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      setError("Email y contraseña son requeridos");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Error al iniciar sesión";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <section className="auth-card">
        <p className="eyebrow">Codigo316</p>
        <h2>Login Admin</h2>
        <p className="auth-subtitle">Ingresa con tu cuenta para gestionar asistencia y puntos.</p>
        <form className="stack" onSubmit={login}>
          {error && <p className="form-message error">{error}</p>}
          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </section>
    </div>
  );
}
