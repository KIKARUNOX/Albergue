import { useEffect, useState } from "react";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import type { LeaderboardSectionProps } from "../../type/componentProps";
import type { PersonaPuntaje } from "../../type/persona";
import Button from "../atoms/Button";
import PageSection from "../templates/PageSection";

export default function LeaderboardSection({ limit, showControls = true }: LeaderboardSectionProps) {
  const [personas, setPersonas] = useState<PersonaPuntaje[]>([]);
  const [error, setError] = useState("");

  const cargar = async () => {
    try {
      setError("");
      const snapshot = await getDocs(collection(db, "personas"));
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as PersonaPuntaje));
      data.sort((a, b) => (b.puntos ?? 0) - (a.puntos ?? 0));
      setPersonas(data);
    } catch (err) {
      console.error("Error al cargar leaderboard:", err);
      setError("No tienes permisos para leer personas.");
      setPersonas([]);
    }
  };

  useEffect(() => {
    void cargar();
  }, []);

  const sumar = async (id: string, puntosActuales = 0) => {
    try {
      setError("");
      await updateDoc(doc(db, "personas", id), { puntos: puntosActuales + 1 });
      await cargar();
    } catch (err) {
      console.error("Error al sumar puntos:", err);
      setError("No tienes permisos para actualizar puntos.");
    }
  };

  const restar = async (id: string, puntosActuales = 0) => {
    try {
      setError("");
      await updateDoc(doc(db, "personas", id), { puntos: Math.max(0, puntosActuales - 1) });
      await cargar();
    } catch (err) {
      console.error("Error al restar puntos:", err);
      setError("No tienes permisos para actualizar puntos.");
    }
  };

  const visibles = limit ? personas.slice(0, limit) : personas;

  return (
    <PageSection title={limit ? `Top ${limit} personas` : "Leaderboard"}>
      {error ? <p className="form-message error">{error}</p> : null}
      <ul className="compact-list">
        {visibles.length === 0 ? (
          <li>No hay personas registradas</li>
        ) : (
          visibles.map((p) => (
            <li key={p.id}>
              {p.nombre} {p.apellido1} {p.apellido2} - {p.puntos ?? 0} puntos
              {showControls ? (
                <span className="inline-actions">
                  <Button onClick={() => void sumar(p.id, p.puntos ?? 0)}>+</Button>
                  <Button variant="secondary" onClick={() => void restar(p.id, p.puntos ?? 0)}>
                    -
                  </Button>
                </span>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </PageSection>
  );
}
