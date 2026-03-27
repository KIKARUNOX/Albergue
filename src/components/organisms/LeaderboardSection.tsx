import { useEffect, useState } from "react";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import type { LeaderboardSectionProps } from "../../type/componentProps";
import type { PersonaPuntaje } from "../../type/persona";
import Button from "../atoms/Button";
import PageSection from "../templates/PageSection";

export default function LeaderboardSection({ limit, showControls = true }: LeaderboardSectionProps) {
  const [personas, setPersonas] = useState<PersonaPuntaje[]>([]);
  const [error, setError] = useState("");

  const cargar = async () => {
    try {
      const snapshot = await getDocs(collection(db, "personas"));
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as PersonaPuntaje));
      data.sort((a, b) => (b.puntos ?? 0) - (a.puntos ?? 0));
      setPersonas(data);
      setError("");
    } catch (err) {
      console.error("Error al cargar leaderboard:", err);
      setError("No tienes permisos para leer personas.");
      setPersonas([]);
    }
  };

  useEffect(() => {
    void cargar();
  }, []);

  const sumar = async (id: string, puntosActuales = 0) => {
    try {
      setError("");
      await updateDoc(doc(db, "personas", id), { puntos: puntosActuales + 1 });
      await cargar();
    } catch (err) {
      console.error("Error al sumar puntos:", err);
      setError("No tienes permisos para actualizar puntos.");
    }
  };

  const restar = async (id: string, puntosActuales = 0) => {
    try {
      setError("");
      await updateDoc(doc(db, "personas", id), { puntos: Math.max(0, puntosActuales - 1) });
      await cargar();
    } catch (err) {
      console.error("Error al restar puntos:", err);
      setError("No tienes permisos para actualizar puntos.");
    }
  };

  const visibles = limit ? personas.slice(0, limit) : personas;
  const shouldRenderPodium = !showControls && limit === 5;

  const renderPersonaLabel = (p: PersonaPuntaje) =>
    `${p.nombre} ${p.apellido1 ?? ""} ${p.apellido2 ?? ""}`.replace(/\s+/g, " ").trim();

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
      {error ? <p className="form-message error">{error}</p> : null}
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
                  <strong className="podium-name">{renderPersonaLabel(persona)}</strong>
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
                  <strong className="podium-name">{renderPersonaLabel(persona)}</strong>
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
              {renderPersonaLabel(p)} - {p.puntos ?? 0} puntos
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
