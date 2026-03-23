import React, { useEffect, useState } from "react";
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

export default function Leaderboard() {
  const [personas, setPersonas] = useState<Persona[]>([]);

  const cargar = async () => {
    const snapshot = await getDocs(collection(db, "personas"));
    const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Persona));
    data.sort((a, b) => (b.puntos ?? 0) - (a.puntos ?? 0));
    setPersonas(data);
  };

  useEffect(() => { cargar(); }, []);

  const sumar = async (id: string, puntosActuales: number = 0) => {
    const ref = doc(db, "personas", id);
    await updateDoc(ref, { puntos: puntosActuales + 1 });
    cargar();
  };

  const restar = async (id: string, puntosActuales: number = 0) => {
    const ref = doc(db, "personas", id);
    await updateDoc(ref, { puntos: Math.max(0, puntosActuales - 1) });
    cargar();
  };

  return (
    <div>
      <h2>Leaderboard</h2>
      <ul>
        {personas.length === 0 ? (
          <li>No hay personas registradas</li>
        ) : (
          personas.map(p => (
            <li key={p.id}>
              {p.nombre} {p.apellido1} {p.apellido2} - {p.puntos ?? 0} puntos
              <button onClick={() => sumar(p.id, p.puntos ?? 0)}>+</button>
              <button onClick={() => restar(p.id, p.puntos ?? 0)}>-</button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
