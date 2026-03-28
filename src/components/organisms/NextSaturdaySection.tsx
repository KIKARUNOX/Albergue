import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase";
import type { Evento } from "../../type/evento";
import "./NextSaturdaySection.css";

export default function NextSaturdaySection() {
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [intentosPorImagen, setIntentosPorImagen] = useState<Record<number, number>>({});

  const extraerDriveId = (url: string): string | null => {
    try {
      const parsed = new URL(url);
      const idFromParam = parsed.searchParams.get("id");
      if (idFromParam) return idFromParam;
    } catch {
      // Ignore malformed URL.
    }

    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match?.[1] ?? null;
  };

  const construirCandidatas = (url: string): string[] => {
    const driveId = extraerDriveId(url);
    if (!driveId) return [url];

    return [
      `https://drive.google.com/thumbnail?id=${driveId}&sz=w2000`,
      `https://lh3.googleusercontent.com/d/${driveId}=w2000`,
      `https://drive.google.com/uc?export=view&id=${driveId}`,
      `https://drive.google.com/uc?id=${driveId}`,
    ];
  };

  useEffect(() => {
    const obtenerProximoEvento = async () => {
      setLoading(true);
      try {
        // Obtener todos los eventos
        const q = query(collection(db, "eventos"), orderBy("fecha", "asc"));
        const querySnapshot = await getDocs(q);

        // Hoy en formato YYYY-MM-DD
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const fechaHoy = hoy.toISOString().split("T")[0];

        // Filtrar solo eventos futuros (no pasados)
        const eventosFuturos = querySnapshot.docs
          .map((doc) => doc.data() as Evento)
          .filter((evento) => evento.fecha >= fechaHoy)
          .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

        if (eventosFuturos.length > 0) {
          // Mostrar el evento más cercano
          setEvento(eventosFuturos[0]);
        }
      } catch (error) {
        console.error("Error al obtener eventos:", error);
      } finally {
        setLoading(false);
      }
    };

    obtenerProximoEvento();
  }, []);

  if (loading) {
    return (
      <section className="next-saturday">
        <div className="saturday-header">
          <h2>Próximos Eventos</h2>
        </div>
        <p className="loading">Cargando...</p>
      </section>
    );
  }

  if (!evento) {
    return (
      <section className="next-saturday">
        <div className="saturday-header">
          <h2>Próximos Eventos</h2>
        </div>
        <p className="no-evento">No hay próximos eventos</p>
      </section>
    );
  }

  return (
    <section className="next-saturday">
      <div className="saturday-header">
        <h2>Próximos Eventos</h2>
        <p className="evento-fecha">
          {new Date(evento.fecha).toLocaleDateString("es-ES", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="evento-content">
        {evento.titulo && <h3 className="evento-titulo">{evento.titulo}</h3>}
        {evento.descripcion && <p className="evento-desc">{evento.descripcion}</p>}
      </div>

      {evento.imagenes && evento.imagenes.length > 0 && (
        <div className="imagenes-grid">
          {evento.imagenes.map((imagen, index) => (
            <div key={index} className="imagen-container">
              {(() => {
                const candidatas = construirCandidatas(imagen);
                const intentoActual = intentosPorImagen[index] ?? 0;
                const srcActual = candidatas[Math.min(intentoActual, candidatas.length - 1)];

                return (
              <img
                src={srcActual}
                alt={`Evento ${evento.titulo} - Imagen ${index + 1}`}
                className="evento-imagen"
                onError={() => {
                  setIntentosPorImagen((prev) => {
                    const siguiente = (prev[index] ?? 0) + 1;
                    if (siguiente >= candidatas.length) return prev;
                    return { ...prev, [index]: siguiente };
                  });
                }}
              />
                );
              })()}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
