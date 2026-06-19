import { Helmet } from "react-helmet-async";
import PersonasManagementSection from "../organisms/PersonasManagementSection";
import type { PersonasPageViewProps } from "../../type/componentProps";

export default function PersonasPageView({ canManagePermissions }: PersonasPageViewProps) {
  return (
    <>
      <Helmet>
        <title>Personas — Código 316</title>
        <meta name="description" content="Administra los perfiles y permisos de los jóvenes registrados." />
      </Helmet>
      <div className="page-stack">
        <h1>Gestion de personas</h1>
        <PersonasManagementSection canManagePermissions={canManagePermissions} />
      </div>
    </>
  );
}
