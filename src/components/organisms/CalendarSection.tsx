import { useEffect, useMemo, useState } from "react";
import { CalendarDate, getLocalTimeZone, today } from "@internationalized/date";
import {
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  Heading,
  I18nProvider,
  Text,
} from "react-aria-components";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import type { CalendarSectionProps } from "../../type/componentProps";
import type { PersonaCumple } from "../../type/persona";
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
  const [calendarData, setCalendarData] = useState<{ cumples: PersonaCumple[]; error: string }>({
    cumples: [],
    error: "",
  });
  const todayDate = today(getLocalTimeZone());
  const [selectedDate, setSelectedDate] = useState<CalendarDate>(todayDate);
  const [visibleMonth, setVisibleMonth] = useState<CalendarDate>(todayDate);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snapshot = await getDocs(collection(db, "personas"));
        const data = snapshot.docs.map((doc) => doc.data() as PersonaCumple);
        const withBirthday = data.filter((p) => p.fechaNacimiento);
        setCalendarData({ cumples: withBirthday, error: "" });
      } catch (err) {
        console.error("Error al cargar cumpleanos:", err);
        setCalendarData({ cumples: [], error: "No tienes permisos para ver cumpleanos." });
      }
    };
    void fetchData();
  }, []);

  const birthdaysByMonthDay = useMemo(() => {
    const map = new Map<string, PersonaCumple[]>();

    for (const p of calendarData.cumples) {
      const parts = getMonthDayFromDateString(p.fechaNacimiento);
      if (!parts) continue;

      const key = `${parts.month}-${parts.day}`;
      const dayList = map.get(key) ?? [];
      dayList.push(p);
      map.set(key, dayList);
    }

    return map;
  }, [calendarData.cumples]);

  const monthBirthdays = useMemo(() => {
    const targetMonth = visibleMonth.month;
    const rows: Array<{ sortDay: number; label: string; personName: string }> = [];

    for (const [key, people] of birthdaysByMonthDay) {
      const [month, day] = key.split("-").map(Number);
      if (month !== targetMonth || Number.isNaN(day)) continue;

      for (const person of people) {
        rows.push({
          sortDay: day,
          label: `${day.toString().padStart(2, "0")} de ${monthNames[month - 1]}`,
          personName: `${person.nombre} ${person.apellido1 ?? ""}`.trim(),
        });
      }
    }

    return rows.sort((a, b) => {
      if (a.sortDay !== b.sortDay) return a.sortDay - b.sortDay;
      return a.personName.localeCompare(b.personName, "es");
    });
  }, [birthdaysByMonthDay, visibleMonth.month]);

  const minValue = onlyCurrentMonth
    ? new CalendarDate(todayDate.year, todayDate.month, 1)
    : undefined;
  const maxValue = onlyCurrentMonth
    ? new CalendarDate(todayDate.year, todayDate.month, new Date(todayDate.year, todayDate.month, 0).getDate())
    : undefined;

  return (
    <PageSection title={onlyCurrentMonth ? "Cumpleaños del mes" : "Cumpleaños"}>
      {calendarData.error ? <p className="form-message error">{calendarData.error}</p> : null}

      <div className="calendar-picker-wrap">
        <I18nProvider locale="es-ES">
          <Calendar
            aria-label="Calendario de cumpleaños"
            value={selectedDate}
            onChange={(date) => {
              setSelectedDate(date);
              setVisibleMonth(date);
            }}
            onFocusChange={(date) => setVisibleMonth(date)}
            minValue={minValue}
            maxValue={maxValue}
            className="birthday-rac-calendar"
          >
            <div className="birthday-rac-calendar-head">
              <Heading className="birthday-rac-heading" />
            </div>

            <CalendarGrid className="birthday-rac-grid" weekdayStyle="short">
              <CalendarGridHeader>
                {(day) => <CalendarHeaderCell className="birthday-rac-weekday">{day}</CalendarHeaderCell>}
              </CalendarGridHeader>
              <CalendarGridBody>
                {(date) => {
                  const hasBirthday = (birthdaysByMonthDay.get(`${date.month}-${date.day}`)?.length ?? 0) > 0;
                  return (
                    <CalendarCell
                      date={date}
                      className={({ isSelected, isToday, isOutsideMonth }) =>
                        `birthday-rac-cell${hasBirthday ? " has-birthday" : ""}${isSelected ? " is-selected" : ""}${isToday ? " is-today" : ""}${isOutsideMonth ? " is-outside" : ""}`
                      }
                    />
                  );
                }}
              </CalendarGridBody>
            </CalendarGrid>
            <Text slot="errorMessage" className="small-text" />
          </Calendar>
        </I18nProvider>
      </div>

      <div className="calendar-all-birthdays">
        <h4>{`Cumpleaños de ${monthNames[visibleMonth.month - 1]} ${visibleMonth.year}`}</h4>

        {monthBirthdays.length > 0 ? (
          <ul className="calendar-birthdays-list">
            {monthBirthdays.map((item) => (
              <li key={`${item.label}-${item.personName}`}>
                <strong>{item.label}:</strong> {item.personName}
              </li>
            ))}
          </ul>
        ) : (
          <p className="small-text">No hay cumpleaños registrados para este mes.</p>
        )}
      </div>
    </PageSection>
  );
}
