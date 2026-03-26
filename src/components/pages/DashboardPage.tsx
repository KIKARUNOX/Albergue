import CalendarSection from "../organisms/CalendarSection";
import LeaderboardSection from "../organisms/LeaderboardSection";

export default function DashboardPage() {
  return (
    <div className="page-stack">
      <h1>Dashboard</h1>
      <CalendarSection onlyCurrentMonth />
      <LeaderboardSection limit={5} showControls={false} />
    </div>
  );
}
