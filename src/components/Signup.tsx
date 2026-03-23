import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", padding: "20px", border: "1px solid #ccc", borderRadius: "8px" }}>
      <h2>Crear Cuenta</h2>
      <form onSubmit={handleSignup}>
        <input
          type="text"
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          style={{ width: "100%", padding: "8px", margin: "10px 0" }}
        />
        <input
          type="text"
          placeholder="Apellido 1"
          value={apellido1}
          onChange={(e) => setApellido1(e.target.value)}
          style={{ width: "100%", padding: "8px", margin: "10px 0" }}
        />
        <input
          type="text"
          placeholder="Apellido 2"
          value={apellido2}
          onChange={(e) => setApellido2(e.target.value)}
          style={{ width: "100%", padding: "8px", margin: "10px 0" }}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: "100%", padding: "8px", margin: "10px 0" }}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: "100%", padding: "8px", margin: "10px 0" }}
        />
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ width: "100%", padding: "10px", marginTop: "10px" }}>
          {loading ? "Registrando..." : "Registrarse"}
        </button>
      </form>
      <p>
        ¿Ya tienes cuenta? <a href="/">Inicia sesión</a>
      </p>
    </div>
  );
}