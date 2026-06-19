import useSignup from "../../hooks/useSignup";
import Input from "../atoms/Input";
import Button from "../atoms/Button";
import { Link } from "react-router-dom";

export default function SignupForm() {
  const { state, dispatch, handleSignup } = useSignup();

  return (
    <div className="auth-layout">
      <section className="auth-card">
        <p className="eyebrow">Codigo316</p>
        <h2>Crear Cuenta</h2>
        <p className="auth-subtitle">Registrate en el sistema.</p>
        <form className="stack" onSubmit={handleSignup}>
          <Input
            type="text"
            placeholder="Nombre"
            value={state.nombre}
            onChange={(e) =>
              dispatch({
                type: "setField",
                field: "nombre",
                value: e.target.value,
              })
            }
            required
            minLength={2}
          />
          <Input
            type="text"
            placeholder="Apellido 1"
            value={state.apellido1}
            onChange={(e) =>
              dispatch({
                type: "setField",
                field: "apellido1",
                value: e.target.value,
              })
            }
            required
          />
          <Input
            type="text"
            placeholder="Apellido 2"
            value={state.apellido2}
            onChange={(e) =>
              dispatch({
                type: "setField",
                field: "apellido2",
                value: e.target.value,
              })
            }
          />
          <Input
            type="email"
            placeholder="Email"
            value={state.email}
            onChange={(e) =>
              dispatch({
                type: "setField",
                field: "email",
                value: e.target.value,
              })
            }
            required
          />
          <Input
            type="password"
            placeholder="Contraseña"
            value={state.password}
            onChange={(e) =>
              dispatch({
                type: "setField",
                field: "password",
                value: e.target.value,
              })
            }
            required
            minLength={6}
          />
          {state.error && <p className="form-message error">{state.error}</p>}
          <Button type="submit" disabled={state.loading}>
            {state.loading ? "Registrando..." : "Registrarse"}
          </Button>
        </form>
        <p className="auth-footer">
          ¿Ya tienes cuenta? <Link to="/">Inicia sesion</Link>
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
