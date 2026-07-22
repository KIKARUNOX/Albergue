import { useState, useEffect } from "react";
import type { ReactElement } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, ADMIN_EMAIL } from "./supabase";
import LoginPage from "./components/pages/LoginPage";
import DashboardPage from "./components/pages/DashboardPage";
import ImportarPage from "./components/pages/ImportarPage";
import PersonasPageView from "./components/pages/PersonasPageView";
import AppHeader from "./components/organisms/AppHeader";
import AppNavigation from "./components/organisms/AppNavigation";
import { Navigate, Route, Routes } from "react-router-dom";

function ProtectedRoute({ allow, element }: { allow: boolean; element: ReactElement }) {
  if (!allow) return <Navigate to="/" replace />;
  return element;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

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
      setIsAdmin(session?.user?.email === ADMIN_EMAIL);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setIsAdmin(session?.user?.email === ADMIN_EMAIL);
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
      <AppNavigation isAdmin={isAdmin} />

      <main className="page-body">
        <Routes>
          <Route path="/" element={<DashboardPage email={user.email} />} />
          <Route
            path="/personas"
            element={<ProtectedRoute allow={isAdmin} element={<PersonasPageView />} />}
          />
          <Route
            path="/import"
            element={<ProtectedRoute allow={isAdmin} element={<ImportarPage />} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
