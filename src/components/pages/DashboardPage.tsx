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
  menores18: number;
  adultos: number;
  adultosMayores: number;
  familias: number;
};

export default function DashboardPage({ email }: DashboardPageProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadStats = async () => {
      const { data, error } = await supabase.from("personas").select("sexo, edad, relacion");
      if (error || !mounted) return;

      const rows = data as Pick<Persona, "sexo" | "edad" | "relacion">[];
      const total = rows.length;
      const hombres = rows.filter((r) => r.sexo === "M").length;
      const mujeres = rows.filter((r) => r.sexo === "F").length;
      const menores18 = rows.filter((r) => (r.edad ?? 0) < 18).length;
      const adultos = rows.filter((r) => (r.edad ?? 0) >= 18 && (r.edad ?? 0) < 65).length;
      const adultosMayores = rows.filter((r) => (r.edad ?? 0) >= 65).length;
      const familias = rows.filter((r) => r.relacion === "Cabeza de familia").length;

      setStats({ total, hombres, mujeres, menores18, adultos, adultosMayores, familias });
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
            <>
              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-value">{stats.total}</span>
                  <span className="stat-label">Total personas</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{stats.familias}</span>
                  <span className="stat-label">Familias</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{stats.hombres}</span>
                  <span className="stat-label">Hombres</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{stats.mujeres}</span>
                  <span className="stat-label">Mujeres</span>
                </div>
              </div>

              <h3 className="stats-subtitle">Por grupo de edad</h3>
              <div className="stats-grid">
                <div className="stat-card stat-card--blue">
                  <span className="stat-value">{stats.menores18}</span>
                  <span className="stat-label">Menores de 18</span>
                </div>
                <div className="stat-card stat-card--green">
                  <span className="stat-value">{stats.adultos}</span>
                  <span className="stat-label">Adultos (18-64)</span>
                </div>
                <div className="stat-card stat-card--orange">
                  <span className="stat-value">{stats.adultosMayores}</span>
                  <span className="stat-label">Adultos mayores (65+)</span>
                </div>
              </div>
            </>
          ) : (
            <p>No se pudieron cargar las estadisticas.</p>
          )}
        </PageSection>
      </div>
    </>
  );
}
