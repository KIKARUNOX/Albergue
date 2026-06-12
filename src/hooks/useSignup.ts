import { useReducer } from "react";
import type { FormEvent } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { normalizeEmail, normalizeName } from "../lib/textNormalization";
import { linkPersonaOnServer, createPersonaOnServer } from "../lib/api";

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
  | {
      type: "setField";
      field: "email" | "password" | "nombre" | "apellido1" | "apellido2";
      value: string;
    }
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

export default function useSignup() {
  const [state, dispatch] = useReducer(signupReducer, initialState);
  const navigate = useNavigate();

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    dispatch({ type: "setError", value: "" });

    const nombre = state.nombre.trim();
    const apellido1 = state.apellido1.trim();
    const apellido2 = state.apellido2.trim();
    const email = normalizeEmail(state.email);
    const password = state.password;

    if (!nombre) {
      await Swal.fire({
        icon: "warning",
        title: "Nombre requerido",
        text: "El nombre es obligatorio.",
      });
      dispatch({ type: "setError", value: "El nombre es obligatorio." });
      return;
    }
    if (!apellido1) {
      await Swal.fire({
        icon: "warning",
        title: "Apellido requerido",
        text: "El primer apellido es obligatorio.",
      });
      dispatch({
        type: "setError",
        value: "El primer apellido es obligatorio.",
      });
      return;
    }
    if (!email) {
      await Swal.fire({
        icon: "warning",
        title: "Email requerido",
        text: "El email es obligatorio.",
      });
      dispatch({ type: "setError", value: "El email es obligatorio." });
      return;
    }
    if (!EMAIL_PATTERN.test(email)) {
      await Swal.fire({
        icon: "warning",
        title: "Email invalido",
        text: "Ingresa un email valido.",
      });
      dispatch({ type: "setError", value: "Ingresa un email valido." });
      return;
    }
    if (!password || password.length < 6) {
      await Swal.fire({
        icon: "warning",
        title: "Contraseña invalida",
        text: "La contraseña debe tener al menos 6 caracteres.",
      });
      dispatch({
        type: "setError",
        value: "La contraseña debe tener al menos 6 caracteres.",
      });
      return;
    }

    dispatch({ type: "setLoading", value: true });

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const idToken = await userCredential.user.getIdToken();

      const linkResult = await linkPersonaOnServer({
        nombre,
        apellido1,
        apellido2,
        idToken,
      });

      if (linkResult.status === "conflict") {
        if (linkResult.reason === "email_mismatch" && linkResult.email) {
          throw new Error(
            `Existe una persona con ese nombre y apellidos, pero con otro email: ${linkResult.email}`,
          );
        }
        if (linkResult.reason === "multiple_matches") {
          throw new Error(
            "Hay varias personas con ese nombre y apellidos. Contacta a un coordinador para vincular tu cuenta.",
          );
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
        text:
          linkResult.status === "linked"
            ? "Tu cuenta se vinculo con una persona existente."
            : "La cuenta se creo correctamente.",
      });
      navigate("/");
    } catch (err: unknown) {
      if (err instanceof Error) {
        await Swal.fire({
          icon: "error",
          title: "Error al registrarse",
          text: err.message,
        });
        dispatch({ type: "setError", value: err.message });
      } else {
        await Swal.fire({
          icon: "error",
          title: "Error al registrarse",
          text: "Error al registrarse",
        });
        dispatch({ type: "setError", value: "Error al registrarse" });
      }
    }

    dispatch({ type: "setLoading", value: false });
  };

  return { state, dispatch, handleSignup };
}
