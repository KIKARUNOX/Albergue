import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import type { CalendarSectionProps } from "../../type/componentProps";
import type { PersonaCumple } from "../../type/persona";
import PageSection from "../templates/PageSection";

const getMonthFromDateString = (value?: string) => {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const ymdMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (ymdMatch) {
    return Number(ymdMatch[2]);
  }

  const slashParts = trimmed.split("/");
  if (slashParts.length === 3) {
    const month = Number(slashParts[0]);
    if (month >= 1 && month <= 12) return month;
  }

  const date = new Date(trimmed);
  if (!Number.isNaN(date.getTime())) {
    return date.getMonth() + 1;
  }

  return null;
};

export default function CalendarSection({ onlyCurrentMonth = false }: CalendarSectionProps) {
  const [cumples, setCumples] = useState<PersonaCumple[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError("");
        const snapshot = await getDocs(collection(db, "personas"));
        const data = snapshot.docs.map((doc) => doc.data() as PersonaCumple);
        const withBirthday = data.filter((p) => p.fechaNacimiento);

        if (!onlyCurrentMonth) {
          setCumples(withBirthday);
          return;
        }

        const currentMonth = new Date().getMonth() + 1;
        setCumples(withBirthday.filter((p) => getMonthFromDateString(p.fechaNacimiento) === currentMonth));
      } catch (err) {
        console.error("Error al cargar cumpleanos:", err);
        setError("No tienes permisos para ver cumpleanos.");
        setCumples([]);
      }
    };
    void fetchData();
  }, [onlyCurrentMonth]);

  return (
    <PageSection title={onlyCurrentMonth ? "Cumpleanos del mes" : "Cumpleanos"}>
      {error ? <p className="form-message error">{error}</p> : null}
      <ul className="compact-list">
        {cumples.length === 0 ? (
          <li>No hay fechas de nacimiento registradas</li>
        ) : (
          cumples.map((p, i) => (
            <li key={i}>
              {p.nombre} {p.apellido1} {p.apellido2} - {p.fechaNacimiento}
            </li>
          ))
        )}
      </ul>
    </PageSection>
  );
}
