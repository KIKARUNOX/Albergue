import { useReducer } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { collection, addDoc, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { defaultPermisosByRole } from "../lib/permissions";

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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: "setError", value: "" });

    const nombre = state.nombre.trim();
    const apellido1 = state.apellido1.trim();
    const apellido2 = state.apellido2.trim();
    const email = state.email.trim().toLowerCase();
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
      // Buscar si ya existe una persona con ese nombre y apellido
      const q = query(
        collection(db, "personas"),
        where("nombre", "==", nombre),
        where("apellido1", "==", apellido1)
      );
      const querySnapshot = await getDocs(q);

      let personaExistente: any = null;
      querySnapshot.forEach((docSnapshot) => {
        const rawData = docSnapshot.data();
        personaExistente = {
          nombre: rawData.nombre as string,
          apellido1: rawData.apellido1,
          apellido2: rawData.apellido2,
          email: rawData.email,
          authUid: rawData.authUid,
          role: rawData.role,
          permisos: rawData.permisos,
          docId: docSnapshot.id,
        } as any;
      });

      if (personaExistente && "docId" in personaExistente) {
        // Persona ya existe
        const docId = personaExistente.docId;
        const emailExistente = personaExistente.email;
        const role = personaExistente.role;
        const permisos = personaExistente.permisos;

        if (emailExistente && emailExistente !== email) {
          await Swal.fire({
            icon: "error",
            title: "Ya existe",
            text: `Existe una persona con ese nombre pero con email diferente: ${emailExistente}`,
          });
          dispatch({ type: "setLoading", value: false });
          return;
        }

        // Persona existe sin email o con el mismo email - actualizar
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        // Actualizar la persona existente con authUid y email
        const personaRef = doc(db, "personas", docId);
        await updateDoc(personaRef, {
          authUid: uid,
          email,
          role: role || "joven",
          permisos: permisos || defaultPermisosByRole("joven"),
        });

        await Swal.fire({
          icon: "success",
          title: "Registro exitoso",
          text: "Tu cuenta se vinculó correctamente.",
        });
        navigate("/");
      } else {
        // Nueva persona - crear desde cero
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        // Guardar datos en Firestore
        await addDoc(collection(db, "personas"), {
          id: uid,
          authUid: uid,
          role: "joven",
          permisos: defaultPermisosByRole("joven"),
          nombre,
          apellido1,
          apellido2,
          email,
          puntos: 0,
          bautizado: false,
          createdAt: new Date(),
        });

        await Swal.fire({
          icon: "success",
          title: "Registro exitoso",
          text: "La cuenta se creo correctamente.",
        });
        navigate("/");
      }
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