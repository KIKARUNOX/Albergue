import Button from "../atoms/Button";

type AppHeaderProps = {
  onLogout: () => void;
  email?: string;
};

export default function AppHeader({ onLogout, email }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header-main">
        <h1 className="app-title">Albergue</h1>
        <p className="small-text">{email || "Usuario"}</p>
      </div>
      <Button onClick={onLogout}>Cerrar sesion</Button>
    </header>
  );
}
