import type { PersonaDetalle } from "../../type/persona";
import ProfileSection from "../organisms/ProfileSection";

type ProfilePageProps = {
  persona: PersonaDetalle;
  personaId: string;
};

export default function ProfilePage({ persona, personaId }: ProfilePageProps) {
  return (
    <div className="page-stack">
      <h1>Perfil</h1>
      <ProfileSection persona={persona} personaId={personaId} />
    </div>
  );
}
