import { useCallback, useEffect, useMemo, useState } from "react";
import { FirebaseError } from "firebase/app";
import { addDoc, collection, deleteDoc, doc, getDocs, increment, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import type { Asistencia, AsistenciaDoc, Persona } from "../type/asistencia";

export default function useAsistenciaPage() {
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

  const nombreCompleto = useCallback(
    (p?: Persona) => `${p?.nombre ?? ""} ${p?.apellido1 ?? ""} ${p?.apellido2 ?? ""}`.trim(),
    [],
  );

  const ordenarPersonas = useCallback(
    (lista: Persona[]) =>
      [...lista].sort((a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b), "es", { sensitivity: "base" })),
    [nombreCompleto],
  );

  const ordenarIdsPorNombre = useCallback(
    (ids: string[]) =>
      [...ids].sort((a, b) => {
        const pa = personas.find((p) => p.id === a);
        const pb = personas.find((p) => p.id === b);
        return nombreCompleto(pa).localeCompare(nombreCompleto(pb), "es", { sensitivity: "base" });
      }),
    [nombreCompleto, personas],
  );

  const nombrePersonaById = useCallback(
    (id: string) => {
      const p = personas.find((item) => item.id === id);
      return p ? `${p.nombre} ${p.apellido1 ?? ""}`.trim() : "Persona desconocida";
    },
    [personas],
  );

  const cargarAsistencias = useCallback(async () => {
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
  }, []);

  const cargarPersonas = useCallback(async () => {
    try {
      const snapshot = await getDocs(collection(db, "personas"));
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as unknown as Persona));
      setPersonas(ordenarPersonas(data));
    } catch (err) {
      console.error("Error al cargar personas:", err);
      setMensaje("Error al cargar personas.");
    }
  }, [ordenarPersonas]);

  useEffect(() => {
    void cargarAsistencias();
    void cargarPersonas();
  }, [cargarAsistencias, cargarPersonas]);

  const asistenciaSeleccionada = useMemo(
    () => asistencias.find((a) => a.id === selectedAsistenciaId),
    [asistencias, selectedAsistenciaId],
  );

  const personasParaReto = useMemo(() => {
    if (!asistenciaSeleccionada) return [];
    const asistentesSet = new Set(asistenciaSeleccionada.personas);
    return personas.filter((p) => asistentesSet.has(p.id));
  }, [asistenciaSeleccionada, personas]);

  useEffect(() => {
    if (!asistenciaSeleccionada) {
      setPersonasCompletaron([]);
      return;
    }

    const asistentesSet = new Set(asistenciaSeleccionada.personas);
    setPersonasCompletaron((asistenciaSeleccionada.completaron ?? []).filter((id) => asistentesSet.has(id)));
  }, [asistenciaSeleccionada]);

  const crearAsistencia = useCallback(async () => {
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
  }, [cargarAsistencias, newFecha, personasSeleccionadas]);

  const agregarReto = useCallback(async () => {
    if (!selectedAsistenciaId) {
      setMensaje("Selecciona una asistencia.");
      return;
    }
    if (!asistenciaSeleccionada) {
      setMensaje("La asistencia seleccionada no existe.");
      return;
    }
    if (!nombreReto) {
      setMensaje("El nombre del reto es obligatorio.");
      return;
    }

    const asistentesSet = new Set(asistenciaSeleccionada.personas);
    const completaronValidos = personasCompletaron.filter((id) => asistentesSet.has(id));
    if (completaronValidos.length === 0) {
      setMensaje("Selecciona al menos una persona que completo el reto.");
      return;
    }
    if (completaronValidos.length !== personasCompletaron.length) {
      setMensaje("Solo se pueden marcar personas que asistieron ese dia.");
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
        completaron: completaronValidos,
      });

      for (const personaId of completaronValidos) {
        const personaRef = doc(db, "personas", personaId);
        await updateDoc(personaRef, { puntos: increment(puntosReto) });
      }

      setNombreReto("");
      setPuntosReto(5);
      setDescripcionReto("");
      setPersonasCompletaron([]);
      setMensaje("Reto agregado y puntos asignados.");
      await cargarPersonas();
      await cargarAsistencias();
    } catch (err) {
      console.error("Error al agregar reto:", err);
      setMensaje("Error al agregar reto.");
    }
  }, [
    asistenciaSeleccionada,
    cargarAsistencias,
    cargarPersonas,
    descripcionReto,
    nombreReto,
    personasCompletaron,
    puntosReto,
    selectedAsistenciaId,
  ]);

  const eliminarAsistencia = useCallback(
    async (id: string) => {
      if (!confirm("¿Eliminar esta asistencia?")) return;

      try {
        await deleteDoc(doc(db, "asistencias", id));
        setMensaje("Asistencia eliminada.");
        await cargarAsistencias();
      } catch (err) {
        console.error("Error al eliminar:", err);
        setMensaje("Error al eliminar asistencia.");
      }
    },
    [cargarAsistencias],
  );

  const editarAsistencia = useCallback(
    async (id: string, data: { fecha: string; personas: string[] }) => {
      if (!data.fecha) {
        setMensaje("La fecha es obligatoria.");
        return;
      }
      if (data.personas.length === 0) {
        setMensaje("Selecciona al menos una persona asistente.");
        return;
      }

      try {
        const asistenciaActual = asistencias.find((a) => a.id === id);
        const asistentesSet = new Set(data.personas);
        const completaronFiltrados = (asistenciaActual?.completaron ?? []).filter((pid) => asistentesSet.has(pid));

        await updateDoc(doc(db, "asistencias", id), {
          fecha: data.fecha,
          personas: data.personas,
          completaron: completaronFiltrados,
        });

        setMensaje("Asistencia actualizada.");
        await cargarAsistencias();
      } catch (err) {
        console.error("Error al editar asistencia:", err);
        setMensaje("Error al editar asistencia.");
      }
    },
    [asistencias, cargarAsistencias],
  );

  const togglePersonaSeleccionada = useCallback((id: string) => {
    setPersonasSeleccionadas((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }, []);

  const togglePersonaCompleto = useCallback((id: string) => {
    setPersonasCompletaron((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }, []);

  return {
    asistencias,
    personas,
    personasParaReto,
    loading,
    mensaje,
    selectedAsistenciaId,
    setSelectedAsistenciaId,
    newFecha,
    setNewFecha,
    personasSeleccionadas,
    nombreReto,
    setNombreReto,
    puntosReto,
    setPuntosReto,
    descripcionReto,
    setDescripcionReto,
    personasCompletaron,
    crearAsistencia,
    agregarReto,
    eliminarAsistencia,
    editarAsistencia,
    togglePersonaSeleccionada,
    togglePersonaCompleto,
    nombrePersonaById,
    ordenarIdsPorNombre,
  };
}
