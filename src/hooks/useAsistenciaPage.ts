import { useCallback, useEffect, useMemo, useState } from "react";
import { FirebaseError } from "firebase/app";
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, increment, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import Swal from "sweetalert2";
import { db } from "../firebase";
import type { Asistencia, AsistenciaDoc, Persona } from "../type/asistencia";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const RETO_PROXIMA_SEMANA_DOC = doc(db, "configuracion", "retoProximaSemana");
type ProximoRetoEstado = "sin-reto" | "borrador" | "programado" | "aplicado";

export default function useAsistenciaPage() {
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [selectedAsistenciaId, setSelectedAsistenciaId] = useState("");

  const [newFecha, setNewFecha] = useState("2026-03-07");
  const [personasSeleccionadas, setPersonasSeleccionadas] = useState<string[]>([]);

  const [nombreReto, setNombreReto] = useState("");
  const [puntosReto, setPuntosReto] = useState(10);
  const [descripcionReto, setDescripcionReto] = useState("");
  const [personasCompletaron, setPersonasCompletaron] = useState<string[]>([]);
  const [proximoRetoNombre, setProximoRetoNombre] = useState("");
  const [proximoRetoPuntos, setProximoRetoPuntos] = useState(10);
  const [proximoRetoDescripcion, setProximoRetoDescripcion] = useState("");
  const [proximoRetoEstado, setProximoRetoEstado] = useState<ProximoRetoEstado>("sin-reto");
  const [savingProximoReto, setSavingProximoReto] = useState(false);

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

  const cargarProximoReto = useCallback(async () => {
    try {
      const snapshot = await getDoc(RETO_PROXIMA_SEMANA_DOC);
      if (!snapshot.exists()) {
        setProximoRetoNombre("");
        setProximoRetoPuntos(10);
        setProximoRetoDescripcion("");
        setProximoRetoEstado("sin-reto");
        return;
      }

      const data = snapshot.data() as {
        activo?: boolean;
        nombre?: string;
        puntos?: number;
        descripcion?: string;
        estado?: ProximoRetoEstado;
      };

      const estado = data.estado ?? (data.activo ? "programado" : "sin-reto");

      if (!(data.nombre ?? "").trim()) {
        setProximoRetoNombre("");
        setProximoRetoPuntos(10);
        setProximoRetoDescripcion("");
        setProximoRetoEstado("sin-reto");
        return;
      }

      setProximoRetoNombre((data.nombre ?? "").trim());
      setProximoRetoPuntos(Math.max(1, Math.floor(Number(data.puntos ?? 10))));
      setProximoRetoDescripcion(data.descripcion ?? "");
      setProximoRetoEstado(estado);
    } catch (err) {
      console.error("Error al cargar reto de la proxima semana:", err);
      setMensaje("Error al cargar reto semanal.");
    }
  }, []);

  useEffect(() => {
    void cargarAsistencias();
    void cargarPersonas();
    void cargarProximoReto();
  }, [cargarAsistencias, cargarPersonas, cargarProximoReto]);

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

  const hasProximoReto = useMemo(
    () => Boolean(proximoRetoNombre.trim()),
    [proximoRetoNombre],
  );

  const ensureRetoBaseValido = async (): Promise<{ nombre: string; descripcion: string; puntos: number } | null> => {
    const nombre = proximoRetoNombre.trim();
    const descripcion = proximoRetoDescripcion;
    const puntos = Math.max(1, Math.floor(Number(proximoRetoPuntos) || 1));

    if (!nombre) {
      await Swal.fire({
        icon: "warning",
        title: "Nombre requerido",
        text: "Escribe el nombre del reto semanal.",
      });
      return null;
    }

    return { nombre, descripcion, puntos };
  };

  const guardarBorradorProximoReto = useCallback(async (): Promise<boolean> => {
    const payload = await ensureRetoBaseValido();
    if (!payload) return false;

    try {
      setSavingProximoReto(true);
      await setDoc(
        RETO_PROXIMA_SEMANA_DOC,
        {
          activo: false,
          estado: "borrador",
          nombre: payload.nombre,
          puntos: payload.puntos,
          descripcion: payload.descripcion,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      setProximoRetoNombre(payload.nombre);
      setProximoRetoPuntos(payload.puntos);
      setProximoRetoEstado("borrador");
      setMensaje("Borrador de reto guardado.");
      await Swal.fire({
        icon: "success",
        title: "Borrador guardado",
        text: "Cuando lo programes, se aplicara automaticamente en la proxima asistencia.",
      });
      return true;
    } catch (err) {
      console.error("Error al guardar borrador de reto:", err);
      setMensaje("Error al guardar borrador de reto.");
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo guardar el borrador del reto.",
      });
      return false;
    } finally {
      setSavingProximoReto(false);
    }
  }, [proximoRetoDescripcion, proximoRetoNombre, proximoRetoPuntos]);

  const programarProximoReto = useCallback(async (): Promise<boolean> => {
    const payload = await ensureRetoBaseValido();
    if (!payload) return false;

    try {
      setSavingProximoReto(true);
      await setDoc(
        RETO_PROXIMA_SEMANA_DOC,
        {
          activo: true,
          estado: "programado",
          nombre: payload.nombre,
          puntos: payload.puntos,
          descripcion: payload.descripcion,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      setProximoRetoNombre(payload.nombre);
      setProximoRetoPuntos(payload.puntos);
      setProximoRetoEstado("programado");
      setMensaje("Reto semanal programado.");
      await Swal.fire({
        icon: "success",
        title: "Reto programado",
        text: "Se aplicara automaticamente en la proxima asistencia creada.",
      });
      return true;
    } catch (err) {
      console.error("Error al programar reto semanal:", err);
      setMensaje("Error al programar reto semanal.");
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo programar el reto semanal.",
      });
      return false;
    } finally {
      setSavingProximoReto(false);
    }
  }, [proximoRetoDescripcion, proximoRetoNombre, proximoRetoPuntos]);

  const limpiarProximoReto = useCallback(async (): Promise<boolean> => {
    try {
      setSavingProximoReto(true);
      await setDoc(
        RETO_PROXIMA_SEMANA_DOC,
        {
          activo: false,
          estado: "sin-reto",
          nombre: "",
          puntos: 10,
          descripcion: "",
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      setProximoRetoNombre("");
      setProximoRetoPuntos(10);
      setProximoRetoDescripcion("");
      setProximoRetoEstado("sin-reto");
      setMensaje("Reto semanal eliminado.");
      await Swal.fire({
        icon: "success",
        title: "Reto semanal eliminado",
        text: "La proxima asistencia se creara sin reto automatico.",
      });
      return true;
    } catch (err) {
      console.error("Error al limpiar reto semanal:", err);
      setMensaje("Error al limpiar reto semanal.");
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo eliminar el reto semanal.",
      });
      return false;
    } finally {
      setSavingProximoReto(false);
    }
  }, []);

  const crearAsistencia = useCallback(async (): Promise<boolean> => {
    if (!newFecha) {
      await Swal.fire({
        icon: "warning",
        title: "Fecha requerida",
        text: "Selecciona una fecha.",
      });
      setMensaje("Selecciona una fecha.");
      return false;
    }
    if (!DATE_PATTERN.test(newFecha)) {
      await Swal.fire({
        icon: "warning",
        title: "Fecha invalida",
        text: "La fecha debe tener formato YYYY-MM-DD.",
      });
      setMensaje("La fecha no tiene un formato valido.");
      return false;
    }
    if (personasSeleccionadas.length === 0) {
      await Swal.fire({
        icon: "warning",
        title: "Asistentes requeridos",
        text: "Selecciona al menos una persona.",
      });
      setMensaje("Selecciona al menos una persona.");
      return false;
    }

    try {
      setMensaje("");
      const nombreRetoSemanal = proximoRetoNombre.trim();
      const tieneRetoSemanal = Boolean(nombreRetoSemanal) && proximoRetoEstado === "programado";
      const puntosRetoSemanal = Math.max(1, Math.floor(Number(proximoRetoPuntos) || 1));

      await addDoc(collection(db, "asistencias"), {
        fecha: newFecha,
        personas: personasSeleccionadas,
        ...(tieneRetoSemanal
          ? {
              reto: {
                nombre: nombreRetoSemanal,
                puntos: puntosRetoSemanal,
                descripcion: proximoRetoDescripcion,
              },
            }
          : {}),
        completaron: [],
        createdAt: serverTimestamp(),
      });

      if (tieneRetoSemanal) {
        await setDoc(
          RETO_PROXIMA_SEMANA_DOC,
          {
            activo: false,
            estado: "aplicado",
            ultimaAplicacionFecha: newFecha,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
        setProximoRetoEstado("aplicado");
      }

      setNewFecha("2026-03-07");
      setPersonasSeleccionadas([]);
      setMensaje("Asistencia creada.");
      await Swal.fire({
        icon: "success",
        title: "Asistencia creada",
        text: tieneRetoSemanal
          ? "La asistencia se registro y se aplico el reto semanal automaticamente."
          : "La asistencia se registro correctamente.",
      });
      await cargarAsistencias();
      return true;
    } catch (err) {
      console.error("Error al crear asistencia:", err);
      if (err instanceof FirebaseError && err.code === "permission-denied") {
        await Swal.fire({
          icon: "error",
          title: "Sin permisos",
          text: "No hay permisos para escribir en asistencias. Revisa reglas de Firestore.",
        });
        setMensaje("No hay permisos para escribir en asistencias. Revisa reglas de Firestore.");
      } else {
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: "Error al crear asistencia.",
        });
        setMensaje("Error al crear asistencia.");
      }
      return false;
    }
  }, [
    cargarAsistencias,
    newFecha,
    personasSeleccionadas,
    proximoRetoDescripcion,
    proximoRetoNombre,
    proximoRetoPuntos,
  ]);

  const agregarReto = useCallback(async (): Promise<boolean> => {
    if (!selectedAsistenciaId) {
      await Swal.fire({
        icon: "warning",
        title: "Asistencia requerida",
        text: "Selecciona una asistencia.",
      });
      setMensaje("Selecciona una asistencia.");
      return false;
    }
    if (!asistenciaSeleccionada) {
      await Swal.fire({
        icon: "warning",
        title: "Asistencia invalida",
        text: "La asistencia seleccionada no existe.",
      });
      setMensaje("La asistencia seleccionada no existe.");
      return false;
    }
    if (!nombreReto.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "Nombre requerido",
        text: "El nombre del reto es obligatorio.",
      });
      setMensaje("El nombre del reto es obligatorio.");
      return false;
    }
    const puntosNormalizados = Math.floor(Number(puntosReto));
    if (!Number.isFinite(puntosNormalizados) || puntosNormalizados <= 0) {
      await Swal.fire({
        icon: "warning",
        title: "Puntos invalidos",
        text: "Los puntos del reto deben ser un numero positivo mayor a 0.",
      });
      setMensaje("Los puntos del reto deben ser un numero positivo mayor a 0.");
      return false;
    }
    if (!descripcionReto.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "Descripcion requerida",
        text: "La descripcion del reto es obligatoria.",
      });
      setMensaje("La descripcion del reto es obligatoria.");
      return false;
    }

    const asistentesSet = new Set(asistenciaSeleccionada.personas);
    const completaronValidos = personasCompletaron.filter((id) => asistentesSet.has(id));
    if (completaronValidos.length === 0) {
      await Swal.fire({
        icon: "warning",
        title: "Participantes requeridos",
        text: "Selecciona al menos una persona que completo el reto.",
      });
      setMensaje("Selecciona al menos una persona que completo el reto.");
      return false;
    }
    if (completaronValidos.length !== personasCompletaron.length) {
      await Swal.fire({
        icon: "warning",
        title: "Participantes invalidos",
        text: "Solo se pueden marcar personas que asistieron ese dia.",
      });
      setMensaje("Solo se pueden marcar personas que asistieron ese dia.");
      return false;
    }

    try {
      setMensaje("");
      const ref = doc(db, "asistencias", selectedAsistenciaId);
      await updateDoc(ref, {
        reto: {
          nombre: nombreReto.trim(),
          puntos: puntosNormalizados,
          descripcion: descripcionReto.trim(),
        },
        completaron: completaronValidos,
      });

      for (const personaId of completaronValidos) {
        const personaRef = doc(db, "personas", personaId);
        await updateDoc(personaRef, { puntos: increment(puntosNormalizados) });
      }

      setNombreReto("");
      setPuntosReto(10);
      setDescripcionReto("");
      setPersonasCompletaron([]);
      setMensaje("Reto agregado y puntos asignados.");
      await Swal.fire({
        icon: "success",
        title: "Reto agregado",
        text: "Reto agregado y puntos asignados.",
      });
      await cargarPersonas();
      await cargarAsistencias();
      return true;
    } catch (err) {
      console.error("Error al agregar reto:", err);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al agregar reto.",
      });
      setMensaje("Error al agregar reto.");
      return false;
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
    async (id: string): Promise<boolean> => {
      const result = await Swal.fire({
        icon: "warning",
        title: "Eliminar asistencia",
        text: "Esta accion no se puede deshacer.",
        showCancelButton: true,
        confirmButtonText: "Si, eliminar",
        cancelButtonText: "Cancelar",
      });
      if (!result.isConfirmed) return false;

      try {
        await deleteDoc(doc(db, "asistencias", id));
        setMensaje("Asistencia eliminada.");
        await Swal.fire({
          icon: "success",
          title: "Eliminada",
          text: "Asistencia eliminada.",
        });
        await cargarAsistencias();
        return true;
      } catch (err) {
        console.error("Error al eliminar:", err);
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: "Error al eliminar asistencia.",
        });
        setMensaje("Error al eliminar asistencia.");
        return false;
      }
    },
    [cargarAsistencias],
  );

  const editarAsistencia = useCallback(
    async (id: string, data: { fecha: string; personas: string[] }): Promise<boolean> => {
      if (!data.fecha) {
        await Swal.fire({
          icon: "warning",
          title: "Fecha requerida",
          text: "La fecha es obligatoria.",
        });
        setMensaje("La fecha es obligatoria.");
        return false;
      }
      if (!DATE_PATTERN.test(data.fecha)) {
        await Swal.fire({
          icon: "warning",
          title: "Fecha invalida",
          text: "La fecha debe tener formato YYYY-MM-DD.",
        });
        setMensaje("La fecha no tiene un formato valido.");
        return false;
      }
      if (data.personas.length === 0) {
        await Swal.fire({
          icon: "warning",
          title: "Asistentes requeridos",
          text: "Selecciona al menos una persona asistente.",
        });
        setMensaje("Selecciona al menos una persona asistente.");
        return false;
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
        await Swal.fire({
          icon: "success",
          title: "Actualizada",
          text: "Asistencia actualizada.",
        });
        await cargarAsistencias();
        return true;
      } catch (err) {
        console.error("Error al editar asistencia:", err);
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: "Error al editar asistencia.",
        });
        setMensaje("Error al editar asistencia.");
        return false;
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
    proximoRetoNombre,
    setProximoRetoNombre,
    proximoRetoPuntos,
    setProximoRetoPuntos,
    proximoRetoDescripcion,
    setProximoRetoDescripcion,
    proximoRetoEstado,
    setProximoRetoEstado,
    hasProximoReto,
    savingProximoReto,
    guardarBorradorProximoReto,
    programarProximoReto,
    limpiarProximoReto,
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
