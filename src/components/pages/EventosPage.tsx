import EventosManagementSection from "../organisms/EventosManagementSection";

export default function EventosPage() {
  return (
    <div className="page-stack">
      <h1>Gestión de Eventos</h1>
      <p className="page-subtitle">
        Administra los eventos y imágenes que se muestran en el dashboard
      </p>
      <EventosManagementSection />
    </div>
  );
}
