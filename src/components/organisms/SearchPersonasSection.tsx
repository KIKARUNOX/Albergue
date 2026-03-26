import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import type { PersonaBusqueda } from "../../type/persona";
import PageSection from "../templates/PageSection";

export default function SearchPersonasSection() {
  const [query, setQuery] = useState("");
  const [personas, setPersonas] = useState<PersonaBusqueda[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError("");
        const snapshot = await getDocs(collection(db, "personas"));
        setPersonas(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as PersonaBusqueda)));
      } catch (err) {
        console.error("Error al buscar personas:", err);
        setError("No tienes permisos para consultar personas.");
        setPersonas([]);
      }
    };
    void fetchData();
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return personas.filter((p) => {
      const fullName = `${p.nombre} ${p.apellido1 ?? ""} ${p.apellido2 ?? ""}`.toLowerCase();
      return fullName.includes(normalized);
    });
  }, [personas, query]);

  return (
    <PageSection title="Buscar personas">
      <input placeholder="Buscar por nombre..." value={query} onChange={(e) => setQuery(e.target.value)} />
      {error ? <p className="form-message error">{error}</p> : null}
      <ul className="compact-list">
        {filtered.map((p) => (
          <li key={p.id}>
            {p.nombre} {p.apellido1} {p.apellido2}
          </li>
        ))}
      </ul>
    </PageSection>
  );
}
