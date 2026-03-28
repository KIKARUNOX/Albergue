import { useEffect, useState } from "react";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import type { LeaderboardSectionProps } from "../../type/componentProps";
import type { PersonaPuntaje } from "../../type/persona";
import { getCachedValue, invalidateCache, setCachedValue } from "../../lib/readCache";
import Button from "../atoms/Button";
import PageSection from "../templates/PageSection";

const LEADERBOARD_CACHE_KEY = "personas:leaderboard";
const LEADERBOARD_CACHE_TTL_MS = 60 * 1000;

type LeaderboardDataState = {
  personas: PersonaPuntaje[];
  error: string;
};

function PersonaLabel({ persona }: { persona: PersonaPuntaje }) {
  return <>{`${persona.nombre} ${persona.apellido1 ?? ""} ${persona.apellido2 ?? ""}`.replace(/\s+/g, " ").trim()}</>;
}

export default function LeaderboardSection({ limit, showControls = true }: LeaderboardSectionProps) {
  "use no memo";

  const [leaderboardData, setLeaderboardData] = useState<LeaderboardDataState>({ personas: [], error: "" });

  const cargar = async () => {
    const cached = getCachedValue<PersonaPuntaje[]>(LEADERBOARD_CACHE_KEY);
    if (cached && cached.length > 0) {
      return cached;
    }

    const snapshot = await getDocs(collection(db, "personas"));
    const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as PersonaPuntaje));
    data.sort((a, b) => (b.puntos ?? 0) - (a.puntos ?? 0));
    setCachedValue(LEADERBOARD_CACHE_KEY, data, LEADERBOARD_CACHE_TTL_MS);
    return data;
  };

  useEffect(() => {
    let mounted = true;

    void cargar()
      .then((data) => {
        if (!mounted) return;
        setLeaderboardData({ personas: data, error: "" });
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        console.error("Error al cargar leaderboard:", err);
        setLeaderboardData({ personas: [], error: "No tienes permisos para leer personas." });
      });

    return () => {
      mounted = false;
    };
  }, []);

  const sumar = async (id: string, puntosActuales = 0) => {
    setLeaderboardData((prev) => ({ ...prev, error: "" }));
    await updateDoc(doc(db, "personas", id), { puntos: puntosActuales + 1 })
      .then(() => {
        invalidateCache(LEADERBOARD_CACHE_KEY);
      })
      .then(() => cargar())
      .then((data) => {
        setLeaderboardData({ personas: data, error: "" });
      })
      .catch((err: unknown) => {
        console.error("Error al sumar puntos:", err);
        setLeaderboardData((prev) => ({ ...prev, error: "No tienes permisos para actualizar puntos." }));
      });
  };

  const restar = async (id: string, puntosActuales = 0) => {
    setLeaderboardData((prev) => ({ ...prev, error: "" }));
    await updateDoc(doc(db, "personas", id), { puntos: Math.max(0, puntosActuales - 1) })
      .then(() => {
        invalidateCache(LEADERBOARD_CACHE_KEY);
      })
      .then(() => cargar())
      .then((data) => {
        setLeaderboardData({ personas: data, error: "" });
      })
      .catch((err: unknown) => {
        console.error("Error al restar puntos:", err);
        setLeaderboardData((prev) => ({ ...prev, error: "No tienes permisos para actualizar puntos." }));
      });
  };

  const visibles = limit ? leaderboardData.personas.slice(0, limit) : leaderboardData.personas;
  const shouldRenderPodium = !showControls && limit === 5;

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
    <PageSection title={limit ? `Top ${limit} personas` : "Leaderboard"}>
      {leaderboardData.error ? <p className="form-message error">{leaderboardData.error}</p> : null}
      {visibles.length === 0 ? (
        <ul className="compact-list">
          <li>No hay personas registradas</li>
        </ul>
      ) : shouldRenderPodium ? (
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
                  <span className="podium-points">{persona.puntos ?? 0} puntos</span>
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
                  <span className="podium-points">{persona.puntos ?? 0} puntos</span>
                </article>
              ) : null,
            )}
          </div>
        </div>
      ) : (
        <ul className="compact-list">
          {visibles.map((p) => (
            <li key={p.id}>
              <PersonaLabel persona={p} /> - {p.puntos ?? 0} puntos
              {showControls ? (
                <span className="inline-actions">
                  <Button onClick={() => void sumar(p.id, p.puntos ?? 0)}>+</Button>
                  <Button variant="secondary" onClick={() => void restar(p.id, p.puntos ?? 0)}>
                    -
                  </Button>
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </PageSection>
  );
}
