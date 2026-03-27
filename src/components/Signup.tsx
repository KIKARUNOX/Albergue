import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido1, setApellido1] = useState("");
  const [apellido2, setApellido2] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Guardar datos en Firestore
      await addDoc(collection(db, "personas"), {
        id: uid,
        nombre,
        apellido1,
        apellido2,
        email,
        puntos: 0,
        bautizado: false,
        createdAt: new Date(),
      });

      navigate("/"); // Redirigir al dashboard
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error al registrarse");
      }
    }

    setLoading(false);
  };

  return (
    <div className="auth-layout">
      <section className="auth-card">
      <p className="eyebrow">Codigo316</p>
      <h2>Crear Cuenta</h2>
      <p className="auth-subtitle">Registra un nuevo administrador en el sistema.</p>
      <form className="stack" onSubmit={handleSignup}>
        <input
          type="text"
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Apellido 1"
          value={apellido1}
          onChange={(e) => setApellido1(e.target.value)}
        />
        <input
          type="text"
          placeholder="Apellido 2"
          value={apellido2}
          onChange={(e) => setApellido2(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="form-message error">{error}</p>}
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "Registrando..." : "Registrarse"}
        </button>
      </form>
      <p className="auth-footer">
        ¿Ya tienes cuenta? <Link to="/">Inicia sesion</Link>
      </p>
      </section>
    </div>
  );
}