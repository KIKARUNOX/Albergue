import { NavLink } from "react-router-dom";

type AppNavigationProps = {
  isAdmin: boolean;
};

export default function AppNavigation({ isAdmin }: AppNavigationProps) {
  return (
    <nav className="app-nav" aria-label="Secciones principales">
      <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
        Inicio
      </NavLink>
      {isAdmin ? (
        <NavLink to="/personas" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
          Personas
        </NavLink>
      ) : null}
      {isAdmin ? (
        <NavLink to="/import" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
          Importar
        </NavLink>
      ) : null}
    </nav>
  );
}
