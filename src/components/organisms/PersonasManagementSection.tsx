import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { supabase } from "../../supabase";
import type { Persona, PersonaForm } from "../../type/persona";
import Button from "../atoms/Button";
import Input from "../atoms/Input";
import PageSection from "../templates/PageSection";
import StatusMessage from "../atoms/StatusMessage";
import PersonaCreateModal from "./PersonaCreateModal";
import PersonaEditModal from "./PersonaEditModal";
import Spinner from "../atoms/Spinner";

type UiState = {
  query: string;
  mensaje: string;
  loading: boolean;
  selectedPersona: Persona | null;
  showCreateModal: boolean;
};

const initialUiState: UiState = {
  query: "",
  mensaje: "",
  loading: true,
  selectedPersona: null,
  showCreateModal: false,
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
      .order("nombre", { ascending: true })
      .range(from, to);

    if (error) throw error;
    return data as Persona[];
  };

  const loadInitial = async () => {
    patchUi({ loading: true });
    try {
      const data = await fetchPersonas(0, PAGE_SIZE - 1);
      setPersonas(data);
      setHasMore(data.length === PAGE_SIZE);
      setPage(0);
    } catch {
      patchUi({ mensaje: "No se pudieron cargar las personas." });
      setPersonas([]);
    }
    patchUi({ loading: false });
  };

  useEffect(() => {
    let mounted = true;
    void loadInitial().then(() => {
      if (!mounted) return;
    });
    return () => { mounted = false; };
  }, []);

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
    const q = ui.query.trim().toLowerCase();
    if (!q) return personas;
    return personas.filter((p) => {
      const fullName = `${p.nombre} ${p.apellido1} ${p.apellido2}`.toLowerCase();
      return fullName.includes(q) || p.cedula.includes(q);
    });
  }, [personas, ui.query]);

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
    await loadInitial();
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
    await loadInitial();
  };

  return (
    <PageSection title="Gestion de personas">
      <StatusMessage message={ui.mensaje} />

      <div className="table-toolbar">
        <Input
          placeholder="Buscar por nombre o cedula..."
          value={ui.query}
          onChange={(e) => patchUi({ query: e.target.value })}
        />
        <Button variant="secondary" onClick={() => patchUi({ showCreateModal: true })}>
          Agregar persona
        </Button>
      </div>

      {ui.loading ? (
        <Spinner text="Cargando personas..." />
      ) : (
        <div className="stack-sm">
          <p className="personas-count">
            {ui.query.trim()
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
