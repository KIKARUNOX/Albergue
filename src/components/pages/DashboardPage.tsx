import CalendarSection from "../organisms/CalendarSection";
import LeaderboardSection from "../organisms/LeaderboardSection";
import NextSaturdaySection from "../organisms/NextSaturdaySection";
import ProximoRetoDashboardSection from "../organisms/ProximoRetoDashboardSection";

export default function DashboardPage() {
  return (
    <div className="page-stack">
      <h1>Dashboard</h1>
      <NextSaturdaySection />
      <ProximoRetoDashboardSection />
      <CalendarSection onlyCurrentMonth />
      <LeaderboardSection limit={5} showControls={false} />
    </div>
  );
}
