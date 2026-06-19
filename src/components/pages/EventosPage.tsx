import { Helmet } from "react-helmet-async";
import EventosManagementSection from "../organisms/EventosManagementSection";

export default function EventosPage() {
  return (
    <>
      <Helmet>
        <title>Eventos — Código 316</title>
        <meta name="description" content="Administra los eventos e imágenes que se muestran en el dashboard del grupo." />
      </Helmet>
      <div className="page-stack">
        <h1>Gestión de Eventos</h1>
        <p className="page-subtitle">
          Administra los eventos y imágenes que se muestran en el dashboard
        </p>
        <EventosManagementSection />
      </div>
    </>
  );
}
