import CalendarSection from "./organisms/CalendarSection";
import type { CalendarViewProps } from "../type/componentProps";

export default function CalendarView({ onlyCurrentMonth = false }: CalendarViewProps) {
  return <CalendarSection onlyCurrentMonth={onlyCurrentMonth} />;
}
