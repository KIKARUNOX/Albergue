import { NavLink } from "react-router-dom";
import type { AppNavigationProps } from "../../type/componentProps";

export default function AppNavigation({ permisos }: AppNavigationProps) {
  return (
    <nav className="app-nav" aria-label="Secciones principales">
      <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
        Inicio
      </NavLink>
      {permisos.personas ? (
        <NavLink to="/personas" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
          Personas
        </NavLink>
      ) : null}
      {permisos.asistencias ? (
        <NavLink to="/asistencias" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
          Asistencias
        </NavLink>
      ) : null}
      {permisos.importacion ? (
        <NavLink to="/import" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
          Importar
        </NavLink>
      ) : null}
      {permisos.gestionarPermisos ? (
        <NavLink to="/eventos" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
          Eventos
        </NavLink>
      ) : null}
      <NavLink to="/perfil" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
        Perfil
      </NavLink>
    </nav>
  );
}
