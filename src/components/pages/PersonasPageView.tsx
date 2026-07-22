import { Helmet } from "react-helmet-async";
import PersonasManagementSection from "../organisms/PersonasManagementSection";

export default function PersonasPageView() {
  return (
    <>
      <Helmet>
        <title>Personas — Albergue</title>
        <meta name="description" content="Administra los registros de personas del albergue." />
      </Helmet>
      <div className="page-stack">
        <h1>Gestion de personas</h1>
        <PersonasManagementSection />
      </div>
    </>
  );
}
