import { Helmet } from "react-helmet-async";
import LoginForm from "../organisms/LoginForm";

export default function LoginPage() {
  return (
    <>
      <Helmet>
        <title>Iniciar sesion — Albergue</title>
        <meta name="description" content="Accede al sistema de gestion del albergue." />
      </Helmet>
      <LoginForm />
    </>
  );
}
