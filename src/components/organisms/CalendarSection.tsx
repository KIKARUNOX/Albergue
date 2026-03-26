import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import type { CalendarSectionProps } from "../../type/componentProps";
import type { PersonaCumple } from "../../type/persona";
import Button from "../atoms/Button";
import PageSection from "../templates/PageSection";

const monthNames = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const weekDays = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

const getMonthDayFromDateString = (value?: string) => {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const ymdMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (ymdMatch) {
    const month = Number(ymdMatch[2]);
    const day = Number(ymdMatch[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { month, day };
    }
    return null;
  }

  const slashParts = trimmed.split("/");
  if (slashParts.length === 3) {
    const month = Number(slashParts[0]);
    const day = Number(slashParts[1]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { month, day };
    }
    return null;
  }

  const date = new Date(trimmed);
  if (!Number.isNaN(date.getTime())) {
    return { month: date.getMonth() + 1, day: date.getDate() };
  }

  return null;
};

export default function CalendarSection({ onlyCurrentMonth = false }: CalendarSectionProps) {
  const [cumples, setCumples] = useState<PersonaCumple[]>([]);
  const [error, setError] = useState("");
  const now = new Date();
  const [monthIndex, setMonthIndex] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError("");
        const snapshot = await getDocs(collection(db, "personas"));
        const data = snapshot.docs.map((doc) => doc.data() as PersonaCumple);
        const withBirthday = data.filter((p) => p.fechaNacimiento);
        setCumples(withBirthday);
      } catch (err) {
        console.error("Error al cargar cumpleanos:", err);
        setError("No tienes permisos para ver cumpleanos.");
        setCumples([]);
      }
    };
    void fetchData();
  }, []);

  useEffect(() => {
    if (!onlyCurrentMonth) return;
    const current = new Date();
    setMonthIndex(current.getMonth());
    setYear(current.getFullYear());
  }, [onlyCurrentMonth]);

  const birthdaysByDay = useMemo(() => {
    const map = new Map<number, PersonaCumple[]>();
    const targetMonth = monthIndex + 1;

    for (const p of cumples) {
      const parts = getMonthDayFromDateString(p.fechaNacimiento);
      if (!parts || parts.month !== targetMonth) continue;

      const dayList = map.get(parts.day) ?? [];
      dayList.push(p);
      map.set(parts.day, dayList);
    }

    return map;
  }, [cumples, monthIndex]);

  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const mondayFirstOffset = (firstDay + 6) % 7;
  const calendarCells = [...Array(mondayFirstOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  while (calendarCells.length % 7 !== 0) {
    calendarCells.push(null);
  }

  const goPrevMonth = () => {
    if (onlyCurrentMonth) return;
    if (monthIndex === 0) {
      setMonthIndex(11);
      setYear((prev) => prev - 1);
      return;
    }
    setMonthIndex((prev) => prev - 1);
  };

  const goNextMonth = () => {
    if (onlyCurrentMonth) return;
    if (monthIndex === 11) {
      setMonthIndex(0);
      setYear((prev) => prev + 1);
      return;
    }
    setMonthIndex((prev) => prev + 1);
  };

  return (
    <PageSection title={onlyCurrentMonth ? "Cumpleaños del mes" : "Cumpleaños"}>
      {error ? <p className="form-message error">{error}</p> : null}

      <div className="calendar-head">
        {!onlyCurrentMonth ? (
          <Button variant="secondary" onClick={goPrevMonth}>
            Mes anterior
          </Button>
        ) : null}
        <h3>{monthNames[monthIndex]} {year}</h3>
        {!onlyCurrentMonth ? (
          <Button variant="secondary" onClick={goNextMonth}>
            Mes siguiente
          </Button>
        ) : null}
      </div>

      <div className="birthday-calendar">
        {weekDays.map((day) => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}

        {calendarCells.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="calendar-day is-empty" />;
          }

          const birthdays = birthdaysByDay.get(day) ?? [];
          const isBirthday = birthdays.length > 0;
          const isToday =
            day === now.getDate() && monthIndex === now.getMonth() && year === now.getFullYear();

          return (
            <div key={`day-${day}-${index}`} className={`calendar-day${isBirthday ? " has-birthday" : ""}${isToday ? " is-today" : ""}`}>
              <div className="calendar-day-number">{day}</div>
              {isBirthday ? (
                <ul className="calendar-birthdays">
                  {birthdays.map((p, i) => (
                    <li key={`${p.nombre}-${i}`}>{`${p.nombre} ${p.apellido1 ?? ""}`.trim()}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>
    </PageSection>
  );
}
