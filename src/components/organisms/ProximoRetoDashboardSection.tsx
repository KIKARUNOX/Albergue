import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import PageSection from "../templates/PageSection";

type ProximoRetoDoc = {
  nombre?: string;
  puntos?: number;
  descripcion?: string;
  activo?: boolean;
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
        const activo = Boolean(data.activo);
        if (!activo || !nombre) {
          setReto(null);
          return;
        }

        setReto({
          nombre,
          puntos: Number(data.puntos ?? 0),
          descripcion: data.descripcion ?? "",
          activo,
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

  return (
    <PageSection title="Reto de la proxima semana">
      {loading ? <p className="small-text">Cargando...</p> : null}
      {!loading && error ? <p className="form-message error">{error}</p> : null}
      {!loading && !error && !reto ? <p className="small-text">No hay reto programado.</p> : null}
      {!loading && !error && reto ? (
        <div className="stack-sm">
          <p><strong>{reto.nombre}</strong> (+{reto.puntos ?? 0} pts)</p>
          {reto.descripcion?.trim() ? <p className="small-text reto-descripcion">{reto.descripcion}</p> : null}
        </div>
      ) : null}
    </PageSection>
  );
}
