import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
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
    <div className="container">
      <h2>Login Admin</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
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
      <button onClick={login} disabled={loading}>
        {loading ? "Ingresando..." : "Ingresar"}
      </button>
    </div>
  );
}
