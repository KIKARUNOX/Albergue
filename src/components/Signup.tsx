import { useReducer } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { normalizeEmail, normalizeName } from "../lib/textNormalization";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SignupState = {
  email: string;
  password: string;
  nombre: string;
  apellido1: string;
  apellido2: string;
  error: string;
  loading: boolean;
};

type SignupAction =
  | { type: "setField"; field: "email" | "password" | "nombre" | "apellido1" | "apellido2"; value: string }
  | { type: "setError"; value: string }
  | { type: "setLoading"; value: boolean };

const initialState: SignupState = {
  email: "",
  password: "",
  nombre: "",
  apellido1: "",
  apellido2: "",
  error: "",
  loading: false,
};

function signupReducer(state: SignupState, action: SignupAction): SignupState {
  switch (action.type) {
    case "setField":
      return { ...state, [action.field]: action.value };
    case "setError":
      return { ...state, error: action.value };
    case "setLoading":
      return { ...state, loading: action.value };
    default:
      return state;
  }
}

export default function Signup() {
  const [state, dispatch] = useReducer(signupReducer, initialState);
  const navigate = useNavigate();

  const linkPersonaOnServer = async (payload: {
    nombre: string;
    apellido1: string;
    apellido2: string;
    idToken: string;
  }): Promise<{ status: "linked" | "no_match" | "conflict"; reason?: string; email?: string }> => {
    let response: Response;
    try {
      response = await fetch("/api/link-persona", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${payload.idToken}`,
        },
        body: JSON.stringify({
          nombre: payload.nombre,
          apellido1: payload.apellido1,
          apellido2: payload.apellido2,
        }),
      });
    } catch {
      throw new Error("No se pudo validar la persona en el servidor. Intenta de nuevo en unos minutos.");
    }

    const raw = await response.text();
    let parsed: unknown = {};
    if (raw) {
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = {};
      }
    }

    const data = parsed as {
      status?: "linked" | "no_match" | "conflict";
      reason?: string;
      email?: string;
      error?: string;
    };

    if (!response.ok && (response.status === 404 || response.status === 405)) {
      throw new Error("El endpoint de vinculacion no esta desplegado. Contacta al administrador.");
    }

    if (!response.ok && data.status !== "conflict") {
      throw new Error(data.error || `No se pudo vincular la persona en el servidor (HTTP ${response.status}).`);
    }

    if (data.status === "linked" || data.status === "no_match" || data.status === "conflict") {
      return {
        status: data.status,
        reason: data.reason,
        email: data.email,
      };
    }

    throw new Error("Respuesta invalida del servidor al vincular persona.");
  };

  const createPersonaOnServer = async (payload: {
    nombre: string;
    apellido1: string;
    apellido2: string;
    idToken: string;
  }): Promise<void> => {
    let response: Response;
    try {
      response = await fetch("/api/register-persona", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${payload.idToken}`,
        },
        body: JSON.stringify({
          nombre: payload.nombre,
          apellido1: payload.apellido1,
          apellido2: payload.apellido2,
        }),
      });
    } catch {
      throw new Error("No se pudo crear la persona en el servidor. Intenta de nuevo en unos minutos.");
    }

    const raw = await response.text();
    let parsed: unknown = {};
    if (raw) {
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = {};
      }
    }

    const data = parsed as { error?: string };
    if (!response.ok) {
      throw new Error(data.error || `No se pudo crear la persona en el servidor (HTTP ${response.status}).`);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: "setError", value: "" });

    const nombre = state.nombre.trim();
    const apellido1 = state.apellido1.trim();
    const apellido2 = state.apellido2.trim();
    const email = normalizeEmail(state.email);
    const password = state.password;

    if (!nombre) {
      await Swal.fire({ icon: "warning", title: "Nombre requerido", text: "El nombre es obligatorio." });
      dispatch({ type: "setError", value: "El nombre es obligatorio." });
      return;
    }
    if (!email) {
      await Swal.fire({ icon: "warning", title: "Email requerido", text: "El email es obligatorio." });
      dispatch({ type: "setError", value: "El email es obligatorio." });
      return;
    }
    if (!EMAIL_PATTERN.test(email)) {
      await Swal.fire({ icon: "warning", title: "Email invalido", text: "Ingresa un email valido." });
      dispatch({ type: "setError", value: "Ingresa un email valido." });
      return;
    }
    if (!password || password.length < 6) {
      await Swal.fire({
        icon: "warning",
        title: "Contraseña invalida",
        text: "La contraseña debe tener al menos 6 caracteres.",
      });
      dispatch({ type: "setError", value: "La contraseña debe tener al menos 6 caracteres." });
      return;
    }

    dispatch({ type: "setLoading", value: true });

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();

      const linkResult = await linkPersonaOnServer({
        nombre,
        apellido1,
        apellido2,
        idToken,
      });

      if (linkResult.status === "conflict") {
        if (linkResult.reason === "email_mismatch" && linkResult.email) {
          throw new Error(`Existe una persona con ese nombre y apellidos, pero con otro email: ${linkResult.email}`);
        }
        if (linkResult.reason === "multiple_matches") {
          throw new Error("Hay varias personas con ese nombre y apellidos. Contacta a un coordinador para vincular tu cuenta.");
        }
        throw new Error("Esa persona ya esta vinculada a otra cuenta.");
      }

      if (linkResult.status === "no_match") {
        await createPersonaOnServer({
          nombre: normalizeName(nombre),
          apellido1: normalizeName(apellido1),
          apellido2: normalizeName(apellido2),
          idToken,
        });
      }

      await Swal.fire({
        icon: "success",
        title: "Registro exitoso",
        text: linkResult.status === "linked"
          ? "Tu cuenta se vinculo con una persona existente."
          : "La cuenta se creo correctamente.",
      });
      navigate("/");
    } catch (err: unknown) {
      if (err instanceof Error) {
        await Swal.fire({ icon: "error", title: "Error al registrarse", text: err.message });
        dispatch({ type: "setError", value: err.message });
      } else {
        await Swal.fire({ icon: "error", title: "Error al registrarse", text: "Error al registrarse" });
        dispatch({ type: "setError", value: "Error al registrarse" });
      }
    }

    dispatch({ type: "setLoading", value: false });
  };

  return (
    <div className="auth-layout">
      <section className="auth-card">
      <p className="eyebrow">Codigo316</p>
      <h2>Crear Cuenta</h2>
      <p className="auth-subtitle">Registrate en el sistema.</p>
      <form className="stack" onSubmit={handleSignup}>
        <input
          type="text"
          placeholder="Nombre"
          value={state.nombre}
          onChange={(e) => dispatch({ type: "setField", field: "nombre", value: e.target.value })}
          required
          minLength={2}
        />
        <input
          type="text"
          placeholder="Apellido 1"
          value={state.apellido1}
          onChange={(e) => dispatch({ type: "setField", field: "apellido1", value: e.target.value })}
        />
        <input
          type="text"
          placeholder="Apellido 2"
          value={state.apellido2}
          onChange={(e) => dispatch({ type: "setField", field: "apellido2", value: e.target.value })}
        />
        <input
          type="email"
          placeholder="Email"
          value={state.email}
          onChange={(e) => dispatch({ type: "setField", field: "email", value: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={state.password}
          onChange={(e) => dispatch({ type: "setField", field: "password", value: e.target.value })}
          required
          minLength={6}
        />
        {state.error && <p className="form-message error">{state.error}</p>}
        <button className="btn-primary" type="submit" disabled={state.loading}>
          {state.loading ? "Registrando..." : "Registrarse"}
        </button>
      </form>
      <p className="auth-footer">
        ¿Ya tienes cuenta? <Link to="/">Inicia sesion</Link>
      </p>
      </section>
    </div>
  );
}