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
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
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
    return <div className="loading-state">Cargando...</div>;
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
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Codigo316</p>
          <h1 className="app-title">Panel de Administracion</h1>
        </div>
        <button className="btn-primary" onClick={() => void handleLogout()}>
          Cerrar sesion
        </button>
      </header>

      <nav className="app-nav" aria-label="Secciones principales">
        <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
          Dashboard
        </NavLink>
        <NavLink to="/personas" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
          Personas
        </NavLink>
        <NavLink to="/asistencias" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
          Asistencias
        </NavLink>
        <NavLink to="/import" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
          Importar
        </NavLink>
      </nav>

      <main className="page-body">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/personas" element={<PersonasPage />} />
          <Route path="/asistencias" element={<AsistenciaPage />} />
          <Route path="/import" element={<ImportarJovenes />} />
          <Route path="/signup" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
