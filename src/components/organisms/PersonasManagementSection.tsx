import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import Swal from "sweetalert2";
import { supabase } from "../../supabase";
import type { Persona, PersonaForm } from "../../type/persona";
import Button from "../atoms/Button";
import Input from "../atoms/Input";
import Select from "../atoms/Select";
import PageSection from "../templates/PageSection";
import StatusMessage from "../atoms/StatusMessage";
import PersonaCreateModal from "./PersonaCreateModal";
import PersonaEditModal from "./PersonaEditModal";
import Spinner from "../atoms/Spinner";

type UiState = {
  query: string;
  sexoEdadFilter: string;
  mensaje: string;
  loading: boolean;
  selectedPersona: Persona | null;
  showCreateModal: boolean;
};

const initialUiState: UiState = {
  query: "",
  sexoEdadFilter: "",
  mensaje: "",
  loading: true,
  selectedPersona: null,
  showCreateModal: false,
};

const RELACION_ORDEN: Record<string, number> = {
  "Cabeza de familia": 0,
  "Conyuge": 1,
  "Padre/Madre": 2,
  "Hijo/a": 3,
  "Hermano/a": 4,
  "Otro": 5,
};

const PAGE_SIZE = 40;

export default function PersonasManagementSection() {
  "use no memo";

  const [personas, setPersonas] = useState<Persona[]>([]);
  const [ui, setUi] = useState<UiState>(initialUiState);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const patchUi = (next: Partial<UiState>) => {
    setUi((prev) => ({ ...prev, ...next }));
  };

  const fetchPersonas = async (from: number, to: number) => {
    const { data, error } = await supabase
      .from("personas")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;
    return data as Persona[];
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetchPersonas(0, PAGE_SIZE - 1);
        if (cancelled) return;
        setPersonas(data);
        setHasMore(data.length === PAGE_SIZE);
        setPage(0);
      } catch {
        if (cancelled) return;
        setPersonas([]);
      }
      if (!cancelled) patchUi({ loading: false });
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  const recargarPersonas = async () => {
    patchUi({ loading: true });
    try {
      const data = await fetchPersonas(0, PAGE_SIZE - 1);
      setPersonas(data);
      setHasMore(data.length === PAGE_SIZE);
      setPage(0);
    } catch {
      setPersonas([]);
    }
    patchUi({ loading: false });
  };

  const cargarMas = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const from = nextPage * PAGE_SIZE;
      const data = await fetchPersonas(from, from + PAGE_SIZE - 1);
      setPersonas((prev) => [...prev, ...data]);
      setPage(nextPage);
      setHasMore(data.length === PAGE_SIZE);
    } catch {
      patchUi({ mensaje: "No se pudieron cargar mas personas." });
    }
    setLoadingMore(false);
  };

  const filtered = useMemo(() => {
    let result = personas;
    const q = ui.query.trim().toLowerCase();
    if (q) {
      result = result.filter((p) => {
        const fullName = `${p.nombre} ${p.apellido1} ${p.apellido2}`.toLowerCase();
        return fullName.includes(q) || p.cedula.includes(q);
      });
    }
    if (ui.sexoEdadFilter) {
      result = result.filter((p) => {
        switch (ui.sexoEdadFilter) {
          case "Hombres": return p.sexo === "M";
          case "Mujeres": return p.sexo === "F";
          case "Menores Hombres": return (p.edad ?? 0) < 18 && p.sexo === "M";
          case "Menores Mujeres": return (p.edad ?? 0) < 18 && p.sexo === "F";
          case "Adultos Hombres": return (p.edad ?? 0) >= 18 && (p.edad ?? 0) < 65 && p.sexo === "M";
          case "Adultos Mujeres": return (p.edad ?? 0) >= 18 && (p.edad ?? 0) < 65 && p.sexo === "F";
          case "Mayores Hombres": return (p.edad ?? 0) >= 65 && p.sexo === "M";
          case "Mayores Mujeres": return (p.edad ?? 0) >= 65 && p.sexo === "F";
          default: return true;
        }
      });
    }

    const grupos: Record<string, Persona[]> = {};
    const sinFamilia: Persona[] = [];
    for (const p of result) {
      if (p.familiar) {
        const arr = grupos[p.familiar];
        if (arr) {
          arr.push(p);
        } else {
          grupos[p.familiar] = [p];
        }
      } else {
        sinFamilia.push(p);
      }
    }

    const ordenados: Persona[] = [];
    for (const miembros of Object.values(grupos)) {
      miembros.sort((a, b) => {
        const ra = RELACION_ORDEN[a.relacion] ?? 99;
        const rb = RELACION_ORDEN[b.relacion] ?? 99;
        return ra - rb;
      });
      ordenados.push(...miembros);
    }
    ordenados.push(...sinFamilia);

    return ordenados;
  }, [personas, ui.query, ui.sexoEdadFilter]);

  const guardarNuevaPersona = async (form: PersonaForm) => {
    const { error } = await supabase.from("personas").insert(form);
    if (error) {
      if (error.code === "23505") {
        await Swal.fire({ icon: "warning", title: "Cedula duplicada", text: "Ya existe una persona con esa cedula." });
        return;
      }
      throw error;
    }
    patchUi({ showCreateModal: false, mensaje: "Persona registrada correctamente." });
    await Swal.fire({ icon: "success", title: "Registro exitoso", text: "Persona registrada correctamente." });
    await recargarPersonas();
  };

  const guardarEdicion = async (id: string, form: PersonaForm) => {
    const { error } = await supabase.from("personas").update(form).eq("id", id);
    if (error) {
      if (error.code === "23505") {
        await Swal.fire({ icon: "warning", title: "Cedula duplicada", text: "Ya existe otra persona con esa cedula." });
        return;
      }
      throw error;
    }
    patchUi({ mensaje: "Persona actualizada correctamente.", selectedPersona: null });
    await Swal.fire({ icon: "success", title: "Actualizacion exitosa", text: "Persona actualizada correctamente." });
    await recargarPersonas();
  };

  return (
    <PageSection title="Gestion de personas">
      <StatusMessage message={ui.mensaje} />

      <div className="table-toolbar">
        <Input
          placeholder="Buscar por nombre o cedula..."
          value={ui.query}
          onChange={(e: ChangeEvent<HTMLInputElement>) => patchUi({ query: e.target.value })}
        />
        <Select
          value={ui.sexoEdadFilter}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => patchUi({ sexoEdadFilter: e.target.value })}
        >
          <option value="">Todos</option>
          <option value="Hombres">Hombres</option>
          <option value="Mujeres">Mujeres</option>
          <option value="Menores Hombres">Menores Hombres (&lt;18)</option>
          <option value="Menores Mujeres">Menores Mujeres (&lt;18)</option>
          <option value="Adultos Hombres">Adultos Hombres (18-64)</option>
          <option value="Adultos Mujeres">Adultos Mujeres (18-64)</option>
          <option value="Mayores Hombres">Mayores Hombres (65+)</option>
          <option value="Mayores Mujeres">Mayores Mujeres (65+)</option>
        </Select>
        <Button variant="secondary" onClick={() => patchUi({ showCreateModal: true })}>
          Agregar persona
        </Button>
      </div>

      {ui.loading ? (
        <Spinner text="Cargando personas..." />
      ) : (
        <div className="stack-sm">
          <p className="personas-count">
            {ui.query.trim() || ui.sexoEdadFilter
              ? `${filtered.length} de ${personas.length} personas`
              : `${personas.length} personas`}
          </p>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Cedula</th>
                  <th>Edad</th>
                  <th>Sexo</th>
                  <th>Familiar</th>
                  <th>Relacion</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td data-label="Nombre">
                      {`${p.nombre} ${p.apellido1} ${p.apellido2}`.trim()}
                    </td>
                    <td data-label="Cedula">{p.cedula}</td>
                    <td data-label="Edad">{p.edad}</td>
                    <td data-label="Sexo">{p.sexo}</td>
                    <td data-label="Familiar">{p.familiar || "-"}</td>
                    <td data-label="Relacion">{p.relacion || "-"}</td>
                    <td data-label="Estado">{p.estado || "-"}</td>
                    <td data-label="Acciones">
                      <div className="table-actions">
                        <Button variant="secondary" onClick={() => patchUi({ selectedPersona: p })}>
                          Ver detalles
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasMore ? (
            <Button variant="secondary" onClick={() => void cargarMas()} disabled={loadingMore}>
              {loadingMore ? "Cargando..." : "Cargar mas personas"}
            </Button>
          ) : null}
        </div>
      )}

      <PersonaCreateModal
        isOpen={ui.showCreateModal}
        onClose={() => patchUi({ showCreateModal: false })}
        onConfirm={guardarNuevaPersona}
      />

      <PersonaEditModal
        isOpen={ui.selectedPersona !== null}
        persona={ui.selectedPersona}
        onConfirm={guardarEdicion}
        onClose={() => patchUi({ selectedPersona: null })}
      />
    </PageSection>
  );
}
