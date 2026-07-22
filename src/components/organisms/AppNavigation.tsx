import { NavLink } from "react-router-dom";

export default function AppNavigation() {
  return (
    <nav className="app-nav" aria-label="Secciones principales">
      <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
        Inicio
      </NavLink>
      <NavLink to="/personas" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
        Personas
      </NavLink>
      <NavLink to="/import" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
        Importar
      </NavLink>
    </nav>
  );
}
