import { Helmet } from "react-helmet-async";
import type { PersonaDetalle } from "../../type/persona";
import ProfileSection from "../organisms/ProfileSection";

type ProfilePageProps = {
  persona: PersonaDetalle;
  personaId: string;
};

export default function ProfilePage({ persona, personaId }: ProfilePageProps) {
  return (
    <>
      <Helmet>
        <title>Perfil — Código 316</title>
        <meta name="description" content="Tu perfil personal en la plataforma Código 316." />
      </Helmet>
      <div className="page-stack">
        <h1>Perfil</h1>
        <ProfileSection persona={persona} personaId={personaId} />
      </div>
    </>
  );
}
