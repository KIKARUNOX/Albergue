import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../../firebase";
import type { PersonaPuntaje } from "../../type/persona";
import PageSection from "../templates/PageSection";

type PersonaVictorias = PersonaPuntaje & {
  actividadVictorias: number;
};

function PersonaLabel({ persona }: { persona: PersonaVictorias }) {
  return <>{`${persona.nombre} ${persona.apellido1 ?? ""} ${persona.apellido2 ?? ""}`.replace(/\s+/g, " ").trim()}</>;
}

export default function ActividadesTopSection() {
  const [top, setTop] = useState<PersonaVictorias[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    void getDocs(
      query(
        collection(db, "personas"),
        orderBy("actividadVictorias", "desc"),
      ),
    )
      .then((snapshot) => {
        if (!mounted) return;
        const data: PersonaVictorias[] = snapshot.docs
          .map((d) => {
            const raw = d.data() as Record<string, unknown>;
            const victorias = Number(raw.actividadVictorias ?? 0);
            return {
              id: d.id,
              nombre: String(raw.nombre ?? ""),
              apellido1: typeof raw.apellido1 === "string" ? raw.apellido1 : undefined,
              apellido2: typeof raw.apellido2 === "string" ? raw.apellido2 : undefined,
              puntos: typeof raw.puntos === "number" ? raw.puntos : Number(raw.puntos ?? 0),
              actividadVictorias: Number.isFinite(victorias) ? victorias : 0,
            };
          })
          .filter((p) => p.actividadVictorias > 0)
          .slice(0, 3);
        setTop(data);
      })
      .catch((err: unknown) => {
        console.error("Error al cargar top de actividades:", err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return null;
  if (top.length === 0) return null;

  const podiumLeaders = [
    { persona: top[1], rank: 2 },
    { persona: top[0], rank: 1 },
    { persona: top[2], rank: 3 },
  ].filter((item) => item.persona);

  return (
    <PageSection title="Top 3 Actividades">
      <div className="leaderboard-podium" aria-label="Podio top 3 actividades">
        <div className="leaderboard-podium-top">
          {podiumLeaders.map(({ persona, rank }) => (
            <article
              key={persona.id}
              className={`podium-card podium-rank-${rank}${rank === 1 ? " is-winner" : ""}`}
            >
              <div className="podium-rank-label">#{rank}</div>
              <strong className="podium-name"><PersonaLabel persona={persona} /></strong>
              <span className="podium-points">{persona.actividadVictorias} victorias</span>
            </article>
          ))}
        </div>
      </div>
    </PageSection>
  );
}
