import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";

interface Persona {
  id: string;
  nombre: string;
  apellido1?: string;
  apellido2?: string;
  puntos?: number;
}

interface Reto {
  nombre: string;
  puntos: number;
  descripcion?: string;
}

interface Asistencia {
  id: string;
  fecha: string;
  personas: string[]; // IDs de personas que asistieron
  reto?: Reto;
  completaron: string[]; // IDs de personas que completaron el reto
}

type AsistenciaDoc = Partial<{
  fecha: string;
  personas: string[];
  reto: Reto;
  completaron: string[];
}>;

export default function AsistenciaPage() {
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [selectedAsistenciaId, setSelectedAsistenciaId] = useState("");
  
  // Formulario nueva asistencia
  const [newFecha, setNewFecha] = useState("2026-03-07");
  const [personasSeleccionadas, setPersonasSeleccionadas] = useState<string[]>([]);
  
  // Formulario reto
  const [nombreReto, setNombreReto] = useState("");
  const [puntosReto, setPuntosReto] = useState(5);
  const [descripcionReto, setDescripcionReto] = useState("");
  const [personasCompletaron, setPersonasCompletaron] = useState<string[]>([]);

  const nombreCompleto = (p?: Persona) =>
    `${p?.nombre ?? ""} ${p?.apellido1 ?? ""} ${p?.apellido2 ?? ""}`.trim();

  const ordenarPersonas = (lista: Persona[]) =>
    [...lista].sort((a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b), "es", { sensitivity: "base" }));

  const ordenarIdsPorNombre = (ids: string[]) =>
    [...ids].sort((a, b) => {
      const pa = personas.find((p) => p.id === a);
      const pb = personas.find((p) => p.id === b);
      return nombreCompleto(pa).localeCompare(nombreCompleto(pb), "es", { sensitivity: "base" });
    });

  // Cargar asistencias
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
      setMensaje("Error al cargar asistencias");
    } finally {
      setLoading(false);
    }
  };

  // Cargar personas
  const cargarPersonas = async () => {
    try {
      const snapshot = await getDocs(collection(db, "personas"));
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as unknown as Persona));
      setPersonas(ordenarPersonas(data));
    } catch (err) {
      console.error("Error al cargar personas:", err);
      setMensaje("Error al cargar personas");
    }
  };

  useEffect(() => {
    void cargarAsistencias();
    void cargarPersonas();
  }, []);

  // Crear nueva asistencia
  const crearAsistencia = async () => {
    if (!newFecha) {
      setMensaje("Selecciona una fecha");
      return;
    }
    if (personasSeleccionadas.length === 0) {
      setMensaje("Selecciona al menos una persona");
      return;
    }

    try {
      setMensaje("");
      await addDoc(collection(db, "asistencias"), {
        fecha: newFecha,
        personas: personasSeleccionadas,
        completaron: [],
        createdAt: new Date(),
      });
      
      setNewFecha("2026-03-07");
      setPersonasSeleccionadas([]);
      setMensaje("✅ Asistencia creada");
      await cargarAsistencias();
    } catch (err) {
      console.error("Error al crear asistencia:", err);
      setMensaje("Error al crear asistencia");
    }
  };

  // Agregar reto a asistencia
  const agregarReto = async () => {
    if (!selectedAsistenciaId) {
      setMensaje("Selecciona una asistencia");
      return;
    }
    if (!nombreReto) {
      setMensaje("El nombre del reto es obligatorio");
      return;
    }
    if (personasCompletaron.length === 0) {
      setMensaje("Selecciona al menos una persona que completó el reto");
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

      // Sumar puntos a las personas que completaron
      for (const personaId of personasCompletaron) {
        const persona = personas.find((p) => p.id === personaId);
        if (persona) {
          const personaRef = doc(db, "personas", personaId);
          const nuevosPuntos = (persona.puntos ?? 0) + puntosReto;
          await updateDoc(personaRef, { puntos: nuevosPuntos });
        }
      }

      setNombreReto("");
      setPuntosReto(5);
      setDescripcionReto("");
      setPersonasCompletaron([]);
      setMensaje("🎯 Reto agregado y puntos asignados");
      await cargarAsistencias();
    } catch (err) {
      console.error("Error al agregar reto:", err);
      setMensaje("Error al agregar reto");
    }
  };

  // Eliminar asistencia
  const eliminarAsistencia = async (id: string) => {
    if (!confirm("¿Eliminar esta asistencia?")) return;
    try {
      await deleteDoc(doc(db, "asistencias", id));
      setMensaje("✅ Asistencia eliminada");
      await cargarAsistencias();
    } catch (err) {
      console.error("Error al eliminar:", err);
      setMensaje("Error al eliminar");
    }
  };

  const togglePersonaSeleccionada = (id: string) => {
    setPersonasSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const togglePersonaCompletó = (id: string) => {
    setPersonasCompletaron((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  return (
    <div style={{ padding: 16 }}>
      <h1>🎯 Gestión de Asistencias y Retos</h1>
      {mensaje && <p style={{ color: mensaje.includes("✅") || mensaje.includes("🎯") ? "green" : "red" }}>{mensaje}</p>}

      {/* Crear nueva asistencia */}
      <div style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <h2>Nueva Asistencia (Sábado)</h2>
        <label>
          Fecha:
          <input
            type="date"
            value={newFecha}
            onChange={(e) => setNewFecha(e.target.value)}
            style={{ marginLeft: 8 }}
          />
        </label>

        <h3>Selecciona personas que asistieron:</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 12 }}>
          {personas.map((p) => (
            <label key={p.id} style={{ display: "flex", gap: 8 }}>
              <input
                type="checkbox"
                checked={personasSeleccionadas.includes(p.id)}
                onChange={() => togglePersonaSeleccionada(p.id)}
              />
              {p.nombre} {p.apellido1}
            </label>
          ))}
        </div>

        <button onClick={() => void crearAsistencia()} disabled={loading}>
          Crear Asistencia
        </button>
      </div>

      {/* Agregar reto a asistencia */}
      <div style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <h2>🎯 Agregar Reto a Asistencia</h2>

        <label>
          Selecciona asistencia:
          <select
            value={selectedAsistenciaId}
            onChange={(e) => setSelectedAsistenciaId(e.target.value)}
            style={{ marginLeft: 8, width: "100%", marginBottom: 12 }}
          >
            <option value="">-- Selecciona --</option>
            {asistencias.map((a) => (
              <option key={a.id} value={a.id}>
                {a.fecha} - {a.personas.length} personas {a.reto ? "✓ Con reto" : ""}
              </option>
            ))}
          </select>
        </label>

        <input
          type="text"
          placeholder="Nombre del reto"
          value={nombreReto}
          onChange={(e) => setNombreReto(e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
        />

        <input
          type="number"
          placeholder="Puntos"
          value={puntosReto}
          onChange={(e) => setPuntosReto(Number(e.target.value))}
          style={{ width: "100%", marginBottom: 8 }}
        />

        <textarea
          placeholder="Descripción (opcional)"
          value={descripcionReto}
          onChange={(e) => setDescripcionReto(e.target.value)}
          style={{ width: "100%", marginBottom: 12, minHeight: 60 }}
        />

        <h3>Personas que completaron el reto:</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 12 }}>
          {personas.map((p) => (
            <label key={p.id} style={{ display: "flex", gap: 8 }}>
              <input
                type="checkbox"
                checked={personasCompletaron.includes(p.id)}
                onChange={() => togglePersonaCompletó(p.id)}
              />
              {p.nombre} {p.apellido1}
            </label>
          ))}
        </div>

        <button onClick={() => void agregarReto()}>Agregar Reto</button>
      </div>

      {/* Lista de asistencias */}
      <div style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16 }}>
        <h2>Asistencias Registradas</h2>
        {loading ? (
          <p>Cargando...</p>
        ) : asistencias.length === 0 ? (
          <p>No hay asistencias registradas</p>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {asistencias.map((a) => (
              <div key={a.id} style={{ border: "1px solid #ddd", padding: 12, borderRadius: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <div>
                    <h3>📅 {a.fecha}</h3>
                    <p>
                      <strong>✓ Personas asistentes:</strong> {a.personas.length}
                    </p>
                    <ul style={{ fontSize: 14, margin: "4px 0" }}>
                      {ordenarIdsPorNombre(a.personas).map((pid) => {
                        const p = personas.find((x) => x.id === pid);
                        return <li key={pid}>{p?.nombre} {p?.apellido1}</li>;
                      })}
                    </ul>

                    {a.reto && (
                      <>
                        <p style={{ marginTop: 8 }}>
                          <strong>🎯 Reto:</strong> {a.reto.nombre} (+{a.reto.puntos} pts)
                        </p>
                        {a.reto.descripcion && <p style={{ fontSize: 14, marginTop: 4 }}>{a.reto.descripcion}</p>}
                        <p style={{ fontSize: 14, marginTop: 8 }}>
                          <strong>Completaron:</strong> {a.completaron.length}
                        </p>
                        <ul style={{ fontSize: 13, margin: "4px 0" }}>
                          {ordenarIdsPorNombre(a.completaron).map((pid) => {
                            const p = personas.find((x) => x.id === pid);
                            return <li key={pid}>{p?.nombre} {p?.apellido1}</li>;
                          })}
                        </ul>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => eliminarAsistencia(a.id)}
                    style={{ background: "#ff6b6b", color: "white", padding: "6px 12px", borderRadius: 4 }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
