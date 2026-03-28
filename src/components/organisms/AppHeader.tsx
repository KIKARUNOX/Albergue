import Button from "../atoms/Button";
import type { AppHeaderProps } from "../../type/componentProps";
import { normalizeRole } from "../../lib/permissions";

export default function AppHeader({ onLogout, persona }: AppHeaderProps) {
  const fullName = `${persona?.nombre ?? ""} ${persona?.apellido1 ?? ""} ${persona?.apellido2 ?? ""}`.trim();
  const role = normalizeRole(persona?.role);
  const isYoung = role === "joven";
  const displayName = fullName || persona?.email || "Usuario";

  return (
    <header className={`app-header${isYoung ? " is-young" : ""}`}>
      <div className="app-header-main">
        <img src="/codigo3_16.PNG" alt="Logo de Codigo316" className="logo" />
        <p className="eyebrow">Codigo 3:16</p>

        {isYoung ? (
          <h1 className="app-title">Codigo 3:16 · {displayName}</h1>
        ) : (
          <h1 className="app-title">Panel de Administracion</h1>
        )}

        {isYoung ? (
          <p className="small-text">Bienvenido a tu panel.</p>
        ) : (
          <p className="small-text">{displayName} · Rol: {role}</p>
        )}

      </div>
      <Button onClick={onLogout}>Cerrar sesion</Button>
    </header>
  );
}
