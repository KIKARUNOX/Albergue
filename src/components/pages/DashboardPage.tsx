import CalendarSection from "../organisms/CalendarSection";
import LeaderboardSection from "../organisms/LeaderboardSection";
import NextSaturdaySection from "../organisms/NextSaturdaySection";
import ProximoRetoDashboardSection from "../organisms/ProximoRetoDashboardSection";
import AboutUsSection from "../organisms/AboutUsSection";
import type { PersonaDetalle } from "../../type/persona";

type DashboardPageProps = {
  persona: PersonaDetalle | null;
};

export default function DashboardPage({ persona }: DashboardPageProps) {
  return (
    <div className="page-stack">
      <h1>Inicio</h1>
      <NextSaturdaySection persona={persona} />
      <ProximoRetoDashboardSection />
      <CalendarSection onlyCurrentMonth />
      <LeaderboardSection limit={5} showControls={false} />
      <AboutUsSection />
    </div>
  );
}
