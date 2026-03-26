import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "./firebase";
import LoginPage from "./components/pages/LoginPage";
import SignupPage from "./components/pages/SignupPage";
import DashboardPage from "./components/pages/DashboardPage";
import ImportarPage from "./components/pages/ImportarPage";
import PersonasPageView from "./components/pages/PersonasPageView";
import AsistenciaPageView from "./components/pages/AsistenciaPageView";
import AppHeader from "./components/organisms/AppHeader";
import AppNavigation from "./components/organisms/AppNavigation";
import { Navigate, Route, Routes } from "react-router-dom";
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
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app-shell">
      <AppHeader onLogout={() => void handleLogout()} />
      <AppNavigation />

      <main className="page-body">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/personas" element={<PersonasPageView />} />
          <Route path="/asistencias" element={<AsistenciaPageView />} />
          <Route path="/import" element={<ImportarPage />} />
          <Route path="/signup" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
