import { Helmet } from "react-helmet-async";
import CalendarSection from "../organisms/CalendarSection";
import LeaderboardSection from "../organisms/LeaderboardSection";
import NextSaturdaySection from "../organisms/NextSaturdaySection";
import ProximoRetoDashboardSection from "../organisms/ProximoRetoDashboardSection";
import ActividadesTopSection from "../organisms/ActividadesTopSection";
import AboutUsSection from "../organisms/AboutUsSection";
import type { PersonaDetalle } from "../../type/persona";

type DashboardPageProps = {
  persona: PersonaDetalle | null;
};

export default function DashboardPage({ persona }: DashboardPageProps) {
  return (
    <>
      <Helmet>
        <title>Inicio — Código 316</title>
        <meta name="description" content="Panel principal con calendario, líderes, retos y actividades del grupo." />
      </Helmet>
      <div className="page-stack">
        <h1>Inicio</h1>
        <NextSaturdaySection persona={persona} />
        <ProximoRetoDashboardSection />
        <CalendarSection onlyCurrentMonth />
        <LeaderboardSection limit={5} />
        <ActividadesTopSection />
        <AboutUsSection />
      </div>
  );
}
