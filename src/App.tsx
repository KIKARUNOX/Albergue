import { useState, useEffect } from "react";
import type { ReactElement } from "react";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "./firebase";
import LoginPage from "./components/pages/LoginPage";
import SignupPage from "./components/pages/SignupPage";
import DashboardPage from "./components/pages/DashboardPage";
import ImportarPage from "./components/pages/ImportarPage";
import PersonasPageView from "./components/pages/PersonasPageView";
import AsistenciaPageView from "./components/pages/AsistenciaPageView";
import ProfilePage from "./components/pages/ProfilePage";
import EventosPage from "./components/pages/EventosPage";
import AppHeader from "./components/organisms/AppHeader";
import AppNavigation from "./components/organisms/AppNavigation";
import { Navigate, Route, Routes } from "react-router-dom";
import { signOut } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { buildPermisos } from "./lib/permissions";
import type { PersonaDetalle } from "./type/persona";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [persona, setPersona] = useState<PersonaDetalle | null>(null);
  const [personaDocId, setPersonaDocId] = useState("");
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
      if (!u) {
        setPersona(null);
        setPersonaDocId("");
        setLoading(false);
        return;
      }

      const loadPersona = async () => {
        try {
          const personasRef = collection(db, "personas");
          let docFound: PersonaDetalle | null = null;
          let docId = "";

          const byAuthUid = await getDocs(query(personasRef, where("authUid", "==", u.uid)));
          if (!byAuthUid.empty) {
            const match = byAuthUid.docs[0];
            docFound = { id: match.id, ...match.data() } as PersonaDetalle;
            docId = match.id;
          }

          if (!docFound && u.email) {
            const byEmail = await getDocs(query(personasRef, where("email", "==", u.email.toLowerCase())));
            if (!byEmail.empty) {
              const match = byEmail.docs[0];
              docFound = { id: match.id, ...match.data() } as PersonaDetalle;
              docId = match.id;
            }
          }

          if (!docFound) {
            const byLegacyId = await getDocs(query(personasRef, where("id", "==", u.uid)));
            if (!byLegacyId.empty) {
              const match = byLegacyId.docs[0];
              docFound = { id: match.id, ...match.data() } as PersonaDetalle;
              docId = match.id;
            }
          }

          setPersona(docFound);
          setPersonaDocId(docId);
        } catch (error) {
          console.error("Error cargando perfil de persona:", error);
          setPersona(null);
          setPersonaDocId("");
        } finally {
          setLoading(false);
        }
      };

      void loadPersona();
    });
  }, []);

  const permisos = buildPermisos(persona);

  const ProtectedRoute = ({ allow, element }: { allow: boolean; element: ReactElement }) => {
    if (!allow) return <Navigate to="/" replace />;
    return element;
  };

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
      <AppHeader onLogout={() => void handleLogout()} persona={persona} />
      <AppNavigation permisos={permisos} />

      <main className="page-body">
        <Routes>
          <Route path="/" element={<ProtectedRoute allow={permisos.dashboard} element={<DashboardPage />} />} />
          <Route
            path="/personas"
            element={<ProtectedRoute allow={permisos.personas} element={<PersonasPageView canManagePermissions={permisos.gestionarPermisos} />} />}
          />
          <Route
            path="/asistencias"
            element={<ProtectedRoute allow={permisos.asistencias} element={<AsistenciaPageView />} />}
          />
          <Route
            path="/import"
            element={<ProtectedRoute allow={permisos.importacion} element={<ImportarPage />} />}
          />
          <Route
            path="/eventos"
            element={<ProtectedRoute allow={permisos.gestionarPermisos} element={<EventosPage />} />}
          />
          <Route
            path="/perfil"
            element={
              persona && personaDocId
                ? <ProfilePage persona={persona} personaId={personaDocId} />
                : <Navigate to="/" replace />
            }
          />
          <Route path="/signup" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
