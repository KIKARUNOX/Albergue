import CalendarView from "./CalendarView";
import Leaderboard from "./Leaderboard";

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <CalendarView onlyCurrentMonth />
      <Leaderboard limit={5} showControls={false} />
    </div>
  );
}
