import { useReducer } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";

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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: "setError", value: "" });
    dispatch({ type: "setLoading", value: true });

    try {
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, state.email, state.password);
      const uid = userCredential.user.uid;

      // Guardar datos en Firestore
      await addDoc(collection(db, "personas"), {
        id: uid,
        nombre: state.nombre,
        apellido1: state.apellido1,
        apellido2: state.apellido2,
        email: state.email,
        puntos: 0,
        bautizado: false,
        createdAt: new Date(),
      });

      navigate("/"); // Redirigir al dashboard
    } catch (err: unknown) {
      if (err instanceof Error) {
        dispatch({ type: "setError", value: err.message });
      } else {
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
      <p className="auth-subtitle">Registra un nuevo administrador en el sistema.</p>
      <form className="stack" onSubmit={handleSignup}>
        <input
          type="text"
          placeholder="Nombre"
          value={state.nombre}
          onChange={(e) => dispatch({ type: "setField", field: "nombre", value: e.target.value })}
          required
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