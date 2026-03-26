import { useEffect, useState } from "react";
import { FirebaseError } from "firebase/app";
import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import type { Asistencia, AsistenciaDoc, Persona } from "../type/asistencia";
import StatusMessage from "./atoms/StatusMessage";
import AsistenciaCreationSection from "./organisms/AsistenciaCreationSection";
import RetoSection from "./organisms/RetoSection";
import AsistenciasListSection from "./organisms/AsistenciasListSection";

export default function AsistenciaPage() {
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [selectedAsistenciaId, setSelectedAsistenciaId] = useState("");

  const [newFecha, setNewFecha] = useState("2026-03-07");
  const [personasSeleccionadas, setPersonasSeleccionadas] = useState<string[]>([]);

  const [nombreReto, setNombreReto] = useState("");
  const [puntosReto, setPuntosReto] = useState(5);
  const [descripcionReto, setDescripcionReto] = useState("");
  const [personasCompletaron, setPersonasCompletaron] = useState<string[]>([]);

  const nombreCompleto = (p?: Persona) => `${p?.nombre ?? ""} ${p?.apellido1 ?? ""} ${p?.apellido2 ?? ""}`.trim();

  const ordenarPersonas = (lista: Persona[]) =>
    [...lista].sort((a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b), "es", { sensitivity: "base" }));

  const ordenarIdsPorNombre = (ids: string[]) =>
    [...ids].sort((a, b) => {
      const pa = personas.find((p) => p.id === a);
      const pb = personas.find((p) => p.id === b);
      return nombreCompleto(pa).localeCompare(nombreCompleto(pb), "es", { sensitivity: "base" });
    });

  const nombrePersonaById = (id: string) => {
    const p = personas.find((item) => item.id === id);
    return p ? `${p.nombre} ${p.apellido1 ?? ""}`.trim() : "Persona desconocida";
  };

  const cargarAsistencias = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, "asistencias"));
      const data = snapshot.docs.map((d) => {
        const raw = d.data() as AsistenciaDoc;
        return {
          id: d.id,
          fecha: raw.fecha ?? "",
          personas: Array.isArray(raw.personas) ? raw.personas : [],
          reto: raw.reto,
          completaron: Array.isArray(raw.completaron) ? raw.completaron : [],
        } as Asistencia;
      });
      data.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      setAsistencias(data);
    } catch (err) {
      console.error("Error al cargar asistencias:", err);
      setMensaje("Error al cargar asistencias.");
    } finally {
      setLoading(false);
    }
  };

  const cargarPersonas = async () => {
    try {
      const snapshot = await getDocs(collection(db, "personas"));
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as unknown as Persona));
      setPersonas(ordenarPersonas(data));
    } catch (err) {
      console.error("Error al cargar personas:", err);
      setMensaje("Error al cargar personas.");
    }
  };

  useEffect(() => {
    void cargarAsistencias();
    void cargarPersonas();
  }, []);

  const crearAsistencia = async () => {
    if (!newFecha) {
      setMensaje("Selecciona una fecha.");
      return;
    }
    if (personasSeleccionadas.length === 0) {
      setMensaje("Selecciona al menos una persona.");
      return;
    }

    try {
      setMensaje("");
      await addDoc(collection(db, "asistencias"), {
        fecha: newFecha,
        personas: personasSeleccionadas,
        completaron: [],
        createdAt: serverTimestamp(),
      });

      setNewFecha("2026-03-07");
      setPersonasSeleccionadas([]);
      setMensaje("Asistencia creada.");
      await cargarAsistencias();
    } catch (err) {
      console.error("Error al crear asistencia:", err);
      if (err instanceof FirebaseError && err.code === "permission-denied") {
        setMensaje("No hay permisos para escribir en asistencias. Revisa reglas de Firestore.");
      } else {
        setMensaje("Error al crear asistencia.");
      }
    }
  };

  const agregarReto = async () => {
    if (!selectedAsistenciaId) {
      setMensaje("Selecciona una asistencia.");
      return;
    }
    if (!nombreReto) {
      setMensaje("El nombre del reto es obligatorio.");
      return;
    }
    if (personasCompletaron.length === 0) {
      setMensaje("Selecciona al menos una persona que completo el reto.");
      return;
    }

    try {
      setMensaje("");
      const ref = doc(db, "asistencias", selectedAsistenciaId);
      await updateDoc(ref, {
        reto: {
          nombre: nombreReto,
          puntos: puntosReto,
          descripcion: descripcionReto,
        },
        completaron: personasCompletaron,
      });

      for (const personaId of personasCompletaron) {
        const persona = personas.find((p) => p.id === personaId);
        if (!persona) continue;

        const personaRef = doc(db, "personas", personaId);
        const nuevosPuntos = (persona.puntos ?? 0) + puntosReto;
        await updateDoc(personaRef, { puntos: nuevosPuntos });
      }

      setNombreReto("");
      setPuntosReto(5);
      setDescripcionReto("");
      setPersonasCompletaron([]);
      setMensaje("Reto agregado y puntos asignados.");
      await cargarAsistencias();
    } catch (err) {
      console.error("Error al agregar reto:", err);
      setMensaje("Error al agregar reto.");
    }
  };

  const eliminarAsistencia = async (id: string) => {
    if (!confirm("¿Eliminar esta asistencia?")) return;

    try {
      await deleteDoc(doc(db, "asistencias", id));
      setMensaje("Asistencia eliminada.");
      await cargarAsistencias();
    } catch (err) {
      console.error("Error al eliminar:", err);
      setMensaje("Error al eliminar asistencia.");
    }
  };

  const togglePersonaSeleccionada = (id: string) => {
    setPersonasSeleccionadas((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const togglePersonaCompleto = (id: string) => {
    setPersonasCompletaron((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  return (
    <div className="stack-md">
      <h1>Gestion de asistencias y retos</h1>
      <StatusMessage message={mensaje} />

      <AsistenciaCreationSection
        fecha={newFecha}
        onFechaChange={setNewFecha}
        personas={personas}
        seleccionadas={personasSeleccionadas}
        onTogglePersona={togglePersonaSeleccionada}
        onCreate={() => void crearAsistencia()}
        loading={loading}
      />

      <RetoSection
        asistencias={asistencias}
        selectedAsistenciaId={selectedAsistenciaId}
        onSelectedAsistenciaId={setSelectedAsistenciaId}
        nombreReto={nombreReto}
        onNombreReto={setNombreReto}
        puntosReto={puntosReto}
        onPuntosReto={setPuntosReto}
        descripcionReto={descripcionReto}
        onDescripcionReto={setDescripcionReto}
        personas={personas}
        personasCompletaron={personasCompletaron}
        onTogglePersonaCompleto={togglePersonaCompleto}
        onAddReto={() => void agregarReto()}
      />

      <AsistenciasListSection
        asistencias={asistencias}
        loading={loading}
        getNombrePersona={nombrePersonaById}
        ordenarIdsPorNombre={ordenarIdsPorNombre}
        onDelete={(id) => {
          void eliminarAsistencia(id);
        }}
      />
    </div>
  );
}
