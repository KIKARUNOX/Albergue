import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

interface Persona {
  id: string;
  nombre: string;
  apellido1?: string;
  apellido2?: string;
  edad?: number;
  fechaNacimiento?: string;
  telefono?: string;
  localidad?: string;
  bautizado?: boolean;
  puntos?: number;
}

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [personas, setPersonas] = useState<Persona[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const snapshot = await getDocs(collection(db, "personas"));
      setPersonas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Persona)));
    };
    fetchData();
  }, []);

  const filtered = personas.filter(p => {
    const fullName = `${p.nombre} ${p.apellido1 || ''} ${p.apellido2 || ''}`.toLowerCase();
    return fullName.includes(query.toLowerCase());
  });

  return (
    <div>
      <input placeholder="Buscar..." onChange={(e) => setQuery(e.target.value)} />
      <ul>
        {filtered.map(p => (
          <li key={p.id}>
            {p.nombre} {p.apellido1} {p.apellido2}
          </li>
        ))}
      </ul>
    </div>
  );
}
