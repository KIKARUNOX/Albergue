import Button from "../atoms/Button";
import type { AppHeaderProps } from "../../type/componentProps";

export default function AppHeader({ onLogout }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div>
        <p className="eyebrow">Codigo316</p>
        <h1 className="app-title">Panel de Administracion</h1>
      </div>
      <Button onClick={onLogout}>Cerrar sesion</Button>
    </header>
  );
}
