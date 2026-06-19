import { Helmet } from "react-helmet-async";
import SignupForm from "../organisms/SignupForm";

export default function SignupPage() {
  return (
    <>
      <Helmet>
        <title>Registrarse — Código 316</title>
        <meta name="description" content="Crea tu cuenta en la plataforma de gestión de jóvenes Código 316." />
      </Helmet>
      <SignupForm />
    </>
  );
}
