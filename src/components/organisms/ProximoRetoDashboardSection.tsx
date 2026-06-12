import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import PageSection from "../templates/PageSection";

type ProximoRetoDoc = {
  nombre?: string;
  puntos?: number;
  descripcion?: string;
  activo?: boolean;
  estado?: "sin-reto" | "borrador" | "programado" | "aplicado";
  ultimaAplicacionFecha?: string;
};

export default function ProximoRetoDashboardSection() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reto, setReto] = useState<ProximoRetoDoc | null>(null);

  useEffect(() => {
    let mounted = true;

    void getDoc(doc(db, "configuracion", "retoProximaSemana"))
      .then((snap) => {
        if (!mounted) return;
        if (!snap.exists()) {
          setReto(null);
          return;
        }

        const data = snap.data() as ProximoRetoDoc;
        const nombre = (data.nombre ?? "").trim();
        const estado = data.estado ?? (data.activo ? "programado" : "sin-reto");
        if (!nombre || estado === "sin-reto") {
          setReto(null);
          return;
        }

        setReto({
          nombre,
          puntos: Number(data.puntos ?? 0),
          descripcion: data.descripcion ?? "",
          activo: Boolean(data.activo),
          estado,
          ultimaAplicacionFecha: data.ultimaAplicacionFecha,
        });
      })
      .catch((err: unknown) => {
        console.error("Error al cargar reto semanal:", err);
        if (!mounted) return;
        setError("No se pudo cargar el reto de la proxima semana.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return null;
  if (error) return null;
  if (!reto) return null;

  return (
    <PageSection title="Reto de la proxima semana">
      <div className="stack-sm">
        <p>
          <strong>{reto.nombre}</strong> (+{reto.puntos ?? 0} pts)
        </p>
        {reto.descripcion?.trim() ? (
          <p className="small-text reto-descripcion">{reto.descripcion}</p>
        ) : null}
        {reto.estado === "aplicado" && reto.ultimaAplicacionFecha ? (
          <p className="small-text">
            Aplicado en asistencia: {reto.ultimaAplicacionFecha}
          </p>
        ) : null}
      </div>
    </PageSection>
  );
}
