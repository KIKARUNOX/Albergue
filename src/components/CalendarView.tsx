import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

interface Persona {
  nombre: string;
  apellido1?: string;
  apellido2?: string;
  fechaNacimiento?: string;
  [key: string]: unknown;
}

export default function CalendarView() {
  const [cumples, setCumples] = useState<Persona[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError("");
        const snapshot = await getDocs(collection(db, "personas"));
        const data = snapshot.docs.map(doc => doc.data() as Persona);
        setCumples(data.filter(p => p.fechaNacimiento));
      } catch (err) {
        console.error("Error al cargar cumpleanos:", err);
        setError("No tienes permisos para ver cumpleanos.");
        setCumples([]);
      }
    };
    void fetchData();
  }, []);

  return (
    <div>
      <h2>Cumpleaños</h2>
      {error && <p>{error}</p>}
      <ul>
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
    </div>
  );
}
