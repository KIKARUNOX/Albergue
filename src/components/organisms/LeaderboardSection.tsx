import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import type { LeaderboardSectionProps } from "../../type/componentProps";
import type { AsistenciaDoc } from "../../type/asistencia";
import type { PersonaPuntaje } from "../../type/persona";
import { getCachedValue, setCachedValue } from "../../lib/readCache";
import PageSection from "../templates/PageSection";

const LEADERBOARD_MONTHLY_CACHE_KEY = "personas:leaderboard:monthly";
const LEADERBOARD_CACHE_TTL_MS = 60 * 1000;

type LeaderboardDataState = {
  personasMonth: PersonaPuntaje[];
  error: string;
};

function PersonaLabel({ persona }: { persona: PersonaPuntaje }) {
  return <>{`${persona.nombre} ${persona.apellido1 ?? ""} ${persona.apellido2 ?? ""}`.replace(/\s+/g, " ").trim()}</>;
}

export default function LeaderboardSection({ limit }: LeaderboardSectionProps) {
  "use no memo";

  const [leaderboardData, setLeaderboardData] = useState<LeaderboardDataState>({
    personasMonth: [],
    error: "",
  });

  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const monthLabel = new Date().toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
  });

  const mapPersonaForLeaderboard = (raw: Record<string, unknown>): PersonaPuntaje => {
    return {
      id: String(raw.id ?? ""),
      nombre: String(raw.nombre ?? ""),
      apellido1: typeof raw.apellido1 === "string" ? raw.apellido1 : "",
      apellido2: typeof raw.apellido2 === "string" ? raw.apellido2 : "",
      puntos: typeof raw.puntos === "number" ? raw.puntos : Number(raw.puntos ?? 0),
    };
  };

  const cargar = async () => {
    const cachedMonthly = getCachedValue<PersonaPuntaje[]>(`${LEADERBOARD_MONTHLY_CACHE_KEY}:${currentMonthKey}`);
    if (cachedMonthly) {
      return { personasMonth: cachedMonthly };
    }

    const [personasSnapshot, asistenciasSnapshot] = await Promise.all([
      getDocs(collection(db, "personas")),
      getDocs(collection(db, "asistencias")),
    ]);

    const personasBase = personasSnapshot.docs.map((d) => {
      const mapped = mapPersonaForLeaderboard({ id: d.id, ...d.data() });
      return {
        ...mapped,
        puntos: Number.isFinite(mapped.puntos ?? 0) ? (mapped.puntos ?? 0) : 0,
      };
    });

    const pointsByPersona = new Map<string, number>();
    asistenciasSnapshot.docs.forEach((asistenciaSnap) => {
      const data = asistenciaSnap.data() as AsistenciaDoc;
      const fecha = String(data.fecha ?? "");
      if (!fecha.startsWith(currentMonthKey)) return;

      const retoPuntos = data.reto?.puntos ?? 0;
      if (!retoPuntos || retoPuntos <= 0) return;

      const completaron = Array.isArray(data.completaron) ? data.completaron : [];
      completaron.forEach((personaId) => {
        const prev = pointsByPersona.get(personaId) ?? 0;
        pointsByPersona.set(personaId, prev + retoPuntos);
      });
    });

    const personasMonth = personasBase
      .map((p) => ({
        ...p,
        puntos: pointsByPersona.get(p.id) ?? 0,
      }))
      .filter((p) => (p.puntos ?? 0) > 0)
      .sort((a, b) => (b.puntos ?? 0) - (a.puntos ?? 0));

    setCachedValue(`${LEADERBOARD_MONTHLY_CACHE_KEY}:${currentMonthKey}`, personasMonth, LEADERBOARD_CACHE_TTL_MS);

    return { personasMonth };
  };

  useEffect(() => {
    let mounted = true;

    void cargar()
      .then((data) => {
        if (!mounted) return;
        setLeaderboardData({ personasMonth: data.personasMonth, error: "" });
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        console.error("Error al cargar leaderboard:", err);
        setLeaderboardData({ personasMonth: [], error: "No tienes permisos para leer personas." });
      });

    return () => {
      mounted = false;
    };
  }, []);

  const visibles = limit
    ? leaderboardData.personasMonth.slice(0, limit)
    : leaderboardData.personasMonth;

  if (visibles.length === 0) return null;

  const shouldRenderPodium = limit === 5;
  const title = `Top ${limit} del mes`;

  const podiumLeaders = shouldRenderPodium
    ? [
        { persona: visibles[1], rank: 2 },
        { persona: visibles[0], rank: 1 },
        { persona: visibles[2], rank: 3 },
      ]
    : [];

  const podiumChasers = shouldRenderPodium
    ? [
        { persona: visibles[3], rank: 4 },
        { persona: visibles[4], rank: 5 },
      ]
    : [];

  return (
    <PageSection title={title}>
      {leaderboardData.error ? <p className="form-message error">{leaderboardData.error}</p> : null}
      <p className="small-text">Periodo: {monthLabel}</p>
      {shouldRenderPodium ? (
        <div className="leaderboard-podium" aria-label="Podio top 5">
          <div className="leaderboard-podium-top">
            {podiumLeaders.map(({ persona, rank }) =>
              persona ? (
                <article
                  key={persona.id}
                  className={`podium-card podium-rank-${rank}${rank === 1 ? " is-winner" : ""}`}
                >
                  <div className="podium-rank-label">#{rank}</div>
                  <strong className="podium-name"><PersonaLabel persona={persona} /></strong>
                  <span className="podium-points">{persona.puntos ?? 0} pts mes</span>
                </article>
              ) : null,
            )}
          </div>

          <div className="leaderboard-podium-rest">
            {podiumChasers.map(({ persona, rank }) =>
              persona ? (
                <article key={persona.id} className={`podium-card podium-rank-${rank}`}>
                  <div className="podium-rank-label">#{rank}</div>
                  <strong className="podium-name"><PersonaLabel persona={persona} /></strong>
                  <span className="podium-points">{persona.puntos ?? 0} pts mes</span>
                </article>
              ) : null,
            )}
          </div>
        </div>
      ) : (
        <ul className="compact-list">
          {visibles.map((p) => (
            <li key={p.id}>
              <PersonaLabel persona={p} /> - {p.puntos ?? 0} pts mes
            </li>
          ))}
        </ul>
      )}
    </PageSection>
  );
}
