import { useState, useEffect, useRef } from "react";
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
import { buildPermisos, defaultPermisosByRole, normalizeRole } from "./lib/permissions";
import type { PersonaDetalle } from "./type/persona";

function buildFallbackPersona(u: User): PersonaDetalle {
  const normalizedEmail = (u.email ?? "").trim().toLowerCase();
  const nombreFromDisplayName = (u.displayName ?? "").trim();
  const nombreFromEmail = normalizedEmail.split("@")[0] ?? "";

  return {
    id: u.uid,
    nombre: nombreFromDisplayName || nombreFromEmail || "Usuario",
    email: normalizedEmail,
    role: "joven",
    permisos: defaultPermisosByRole("joven"),
  };
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [persona, setPersona] = useState<PersonaDetalle | null>(null);
  const [personaDocId, setPersonaDocId] = useState("");
  const [loading, setLoading] = useState(true);
  const isBootstrapUnavailableRef = useRef(false);

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
          if (isBootstrapUnavailableRef.current) {
            setPersona(buildFallbackPersona(u));
            setPersonaDocId(u.uid);
            return;
          }

          const idToken = await u.getIdToken();
          const response = await fetch("/api/bootstrap-session", {
            method: "POST",
            headers: {
              "content-type": "application/json",
              authorization: `Bearer ${idToken}`,
            },
          });

          if (response.status === 404 || response.status === 405) {
            isBootstrapUnavailableRef.current = true;
            setPersona(buildFallbackPersona(u));
            setPersonaDocId(u.uid);
            return;
          }

          const raw = await response.text();
          let parsed: unknown = {};
          if (raw) {
            try {
              parsed = JSON.parse(raw);
            } catch {
              parsed = {};
            }
          }

          const data = parsed as {
            persona?: PersonaDetalle | null;
            personaDocId?: string;
            error?: string;
          };

          if (!response.ok) {
            throw new Error(data.error || `No se pudo inicializar la sesion (HTTP ${response.status}).`);
          }

          const docFound = data.persona ?? null;
          const docId = data.personaDocId ?? "";
          const role = normalizeRole(docFound?.role);
          const permisos = {
            ...defaultPermisosByRole(role),
            ...(docFound?.permisos ?? {}),
          };

          if (docFound) {
            setPersona({ ...docFound, permisos });
            setPersonaDocId(docId);
          } else {
            setPersona(buildFallbackPersona(u));
            setPersonaDocId(u.uid);
          }
        } catch (error) {
          console.error("Error cargando perfil de persona:", error);
          setPersona(buildFallbackPersona(u));
          setPersonaDocId(u.uid);
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
                : user
                  ? <ProfilePage persona={buildFallbackPersona(user)} personaId={user.uid} />
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
