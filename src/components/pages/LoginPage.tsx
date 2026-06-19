import { Helmet } from "react-helmet-async";
import LoginForm from "../organisms/LoginForm";

export default function LoginPage() {
  return (
    <>
      <Helmet>
        <title>Iniciar sesión — Código 316</title>
        <meta name="description" content="Accede a la plataforma de gestión de jóvenes Código 316." />
      </Helmet>
      <LoginForm />
    </>
  );
}
