import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "./firebase";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Dashboard from "./components/Dashboard";
import ImportarJovenes from "./components/ImportarJovenes";
import PersonasPage from "./components/PersonasPage";
import AsistenciaPage from "./components/AsistenciaPage";
import './App.css'
import { Link, Navigate, Route, Routes } from "react-router-dom";
import { signOut } from "firebase/auth";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <div>
      <nav style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
        <Link to="/">Dashboard</Link>
        <Link to="/personas">Personas</Link>
        <Link to="/asistencias">Asistencias</Link>
        <Link to="/import">Importar</Link>
        <button onClick={() => void handleLogout()}>Cerrar sesion</button>
      </nav>

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/personas" element={<PersonasPage />} />
        <Route path="/asistencias" element={<AsistenciaPage />} />
        <Route path="/import" element={<ImportarJovenes />} />
        <Route path="/signup" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
