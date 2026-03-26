import Button from "../atoms/Button";
import type { AppHeaderProps } from "../../type/componentProps";

export default function AppHeader({ onLogout }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div>
        <img src="/codigo3_16.PNG" alt="Logo de Codigo316" className="logo" />
        <p className="eyebrow"> Codigo  3:16</p>

        <h1 className="app-title">Panel de Administracion</h1>


      </div>
      <Button onClick={onLogout}>Cerrar sesion</Button>
    </header>
  );
}
