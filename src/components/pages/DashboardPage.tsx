import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "../../supabase";
import type { Persona } from "../../type/persona";
import PageSection from "../templates/PageSection";
import Spinner from "../atoms/Spinner";

type DashboardPageProps = {
  email?: string;
};

type Stats = {
  total: number;
  hombres: number;
  mujeres: number;
  edadPromedio: number;
};

export default function DashboardPage({ email }: DashboardPageProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadStats = async () => {
      const { data, error } = await supabase.from("personas").select("sexo, edad");
      if (error || !mounted) return;

      const rows = data as Pick<Persona, "sexo" | "edad">[];
      const total = rows.length;
      const hombres = rows.filter((r) => r.sexo === "M").length;
      const mujeres = rows.filter((r) => r.sexo === "F").length;
      const edadPromedio = total > 0
        ? Math.round(rows.reduce((sum, r) => sum + (r.edad ?? 0), 0) / total)
        : 0;

      setStats({ total, hombres, mujeres, edadPromedio });
      setLoading(false);
    };

    void loadStats();
    return () => { mounted = false; };
  }, []);

  return (
    <>
      <Helmet>
        <title>Inicio — Albergue</title>
        <meta name="description" content="Panel principal del sistema de gestion del albergue." />
      </Helmet>
      <div className="page-stack">
        <h1>Bienvenido{email ? `, ${email.split("@")[0]}` : ""}</h1>

        <PageSection title="Estadisticas generales">
          {loading ? (
            <Spinner text="Cargando estadisticas..." />
          ) : stats ? (
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-value">{stats.total}</span>
                <span className="stat-label">Total personas</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{stats.hombres}</span>
                <span className="stat-label">Hombres</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{stats.mujeres}</span>
                <span className="stat-label">Mujeres</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{stats.edadPromedio}</span>
                <span className="stat-label">Edad promedio</span>
              </div>
            </div>
          ) : (
            <p>No se pudieron cargar las estadisticas.</p>
          )}
        </PageSection>
      </div>
    </>
  );
}
