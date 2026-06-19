import useLogin from "../../hooks/useLogin";
import Input from "../atoms/Input";
import Button from "../atoms/Button";
import { Link } from "react-router-dom";

export default function LoginForm() {
  const { email, password, error, loading, login, setEmail, setPassword } = useLogin();

  return (
    <div className="auth-layout">
      <section className="auth-card">
        <p className="eyebrow">Codigo316</p>
        <h2>Login</h2>
        <p className="auth-subtitle">Ingresa con tu cuenta</p>
        <form className="stack" onSubmit={login}>
          {error && <p className="form-message error">{error}</p>}
          <Input
            placeholder="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </Button>
        </form>
        <p className="auth-footer">
          ¿No tienes cuenta? <Link to="/signup">Regístrate aquí</Link>
        </p>
        <p className="legal-links">
          <Link to="/terminos">Términos de Uso</Link>
          <span className="legal-sep">·</span>
          <Link to="/privacidad">Política de Privacidad</Link>
        </p>
      </section>
    </div>
  );
}
