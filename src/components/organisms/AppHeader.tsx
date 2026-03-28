import Button from "../atoms/Button";
import type { AppHeaderProps } from "../../type/componentProps";

export default function AppHeader({ onLogout, persona }: AppHeaderProps) {
  const fullName = `${persona?.nombre ?? ""} ${persona?.apellido1 ?? ""} ${persona?.apellido2 ?? ""}`.trim();

  return (
    <header className="app-header">
      <div>
        <img src="/codigo3_16.PNG" alt="Logo de Codigo316" className="logo" />
        <p className="eyebrow"> Codigo  3:16</p>

        <h1 className="app-title">Panel de Administracion</h1>
        <p className="small-text">
          {fullName || persona?.email || "Usuario"} · Rol: {persona?.role ?? "coordinador"}
        </p>


      </div>
      <Button onClick={onLogout}>Cerrar sesion</Button>
    </header>
  );
}
