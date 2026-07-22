import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import LoginPage from "./components/pages/LoginPage";
import DashboardPage from "./components/pages/DashboardPage";
import ImportarPage from "./components/pages/ImportarPage";
import PersonasPageView from "./components/pages/PersonasPageView";
import AppHeader from "./components/organisms/AppHeader";
import AppNavigation from "./components/organisms/AppNavigation";
import { Navigate, Route, Routes } from "react-router-dom";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error al cerrar sesion:", error);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="loading-state">Cargando...</div>;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app-shell">
      <AppHeader onLogout={() => void handleLogout()} email={user.email} />
      <AppNavigation />

      <main className="page-body">
        <Routes>
          <Route path="/" element={<DashboardPage email={user.email} />} />
          <Route path="/personas" element={<PersonasPageView />} />
          <Route path="/import" element={<ImportarPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
