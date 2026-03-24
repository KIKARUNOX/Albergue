import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";

interface Persona {
  id: string;
  nombre: string;
  apellido1?: string;
  apellido2?: string;
  puntos?: number;
  [key: string]: unknown;
}

type LeaderboardProps = {
  limit?: number;
  showControls?: boolean;
};

export default function Leaderboard({ limit, showControls = true }: LeaderboardProps) {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [error, setError] = useState("");

  const cargar = async () => {
    try {
      setError("");
      const snapshot = await getDocs(collection(db, "personas"));
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Persona));
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

  const sumar = async (id: string, puntosActuales: number = 0) => {
    try {
      setError("");
      const ref = doc(db, "personas", id);
      await updateDoc(ref, { puntos: puntosActuales + 1 });
      await cargar();
    } catch (err) {
      console.error("Error al sumar puntos:", err);
      setError("No tienes permisos para actualizar puntos.");
    }
  };

  const restar = async (id: string, puntosActuales: number = 0) => {
    try {
      setError("");
      const ref = doc(db, "personas", id);
      await updateDoc(ref, { puntos: Math.max(0, puntosActuales - 1) });
      await cargar();
    } catch (err) {
      console.error("Error al restar puntos:", err);
      setError("No tienes permisos para actualizar puntos.");
    }
  };

  return (
    <div>
      <h2>{limit ? `Top ${limit} personas` : "Leaderboard"}</h2>
      {error && <p>{error}</p>}
      <ul>
        {(limit ? personas.slice(0, limit) : personas).length === 0 ? (
          <li>No hay personas registradas</li>
        ) : (
          (limit ? personas.slice(0, limit) : personas).map(p => (
            <li key={p.id}>
              {p.nombre} {p.apellido1} {p.apellido2} - {p.puntos ?? 0} puntos
              {showControls ? <button onClick={() => sumar(p.id, p.puntos ?? 0)}>+</button> : null}
              {showControls ? <button onClick={() => restar(p.id, p.puntos ?? 0)}>-</button> : null}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
