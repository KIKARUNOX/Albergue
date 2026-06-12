import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
} from "firebase/firestore";
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import Swal from "sweetalert2";
import { db } from "../../firebase";
import {
  invalidateCache,
  setCachedValue,
  getCachedValue,
} from "../../lib/readCache";
import type {
  PersonaDetalle,
  PersonaForm,
  PersonaPermisos,
  PersonaRole,
} from "../../type/persona";
import Button from "../atoms/Button";
import Input from "../atoms/Input";
import PageSection from "../templates/PageSection";
import StatusMessage from "../atoms/StatusMessage";
import PersonaCreateModal from "./PersonaCreateModal";
import PersonaEditModal from "./PersonaEditModal";
import Spinner from "../atoms/Spinner";

type PersonasManagementUiState = {
  query: string;
  mensaje: string;
  loading: boolean;
  selectedPersona: PersonaDetalle | null;
  showCreateModal: boolean;
};

const initialUiState: PersonasManagementUiState = {
  query: "",
  mensaje: "",
  loading: true,
  selectedPersona: null,
  showCreateModal: false,
};

const PERSONAS_PAGE_SIZE = 40;
const PERSONAS_CACHE_KEY = "personas:first-page";
const PERSONAS_CACHE_TTL_MS = 2 * 60 * 1000;

type PersonasManagementSectionProps = {
  canManagePermissions: boolean;
};

export default function PersonasManagementSection({
  canManagePermissions,
}: PersonasManagementSectionProps) {
  "use no memo";

  const [personas, setPersonas] = useState<PersonaDetalle[]>([]);
  const [ui, setUi] = useState<PersonasManagementUiState>(initialUiState);
  const [lastDoc, setLastDoc] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const patchUi = (next: Partial<PersonasManagementUiState>) => {
    setUi((prev) => ({ ...prev, ...next }));
  };

  const fetchPersonasPage = async (
    cursor?: QueryDocumentSnapshot<DocumentData>,
  ) => {
    const personasQuery = cursor
      ? query(
          collection(db, "personas"),
          orderBy("nombre", "asc"),
          limit(PERSONAS_PAGE_SIZE),
          startAfter(cursor),
        )
      : query(
          collection(db, "personas"),
          orderBy("nombre", "asc"),
          limit(PERSONAS_PAGE_SIZE),
        );

    const snapshot = await getDocs(personasQuery);
    const data = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as PersonaDetalle,
    );
    data.sort((a, b) =>
      `${a.nombre} ${a.apellido1 ?? ""}`.localeCompare(
        `${b.nombre} ${b.apellido1 ?? ""}`,
        "es",
      ),
    );
    return {
      data,
      nextCursor:
        snapshot.docs.length > 0
          ? snapshot.docs[snapshot.docs.length - 1]
          : null,
      hasMore: snapshot.docs.length === PERSONAS_PAGE_SIZE,
    };
  };

  const loadInitialPersonas = async () => {
    patchUi({ loading: true });

    const cached = getCachedValue<PersonaDetalle[]>(PERSONAS_CACHE_KEY);
    if (cached && cached.length > 0) {
      setPersonas(cached);
      patchUi({ loading: false });
    }

    const {
      data,
      nextCursor,
      hasMore: nextHasMore,
    } = await fetchPersonasPage();
    setPersonas(data);
    setLastDoc(nextCursor);
    setHasMore(nextHasMore);
    setCachedValue(PERSONAS_CACHE_KEY, data, PERSONAS_CACHE_TTL_MS);
    patchUi({ loading: false });
  };

  useEffect(() => {
    let mounted = true;

    void loadInitialPersonas()
      .then(() => {
        if (!mounted) return;
      })
      .catch((error: unknown) => {
        if (!mounted) return;
        console.error("Error al cargar personas:", error);
        patchUi({
          mensaje: "No se pudieron cargar las personas.",
          loading: false,
        });
        setPersonas([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const recargarPersonas = async () => {
    invalidateCache(PERSONAS_CACHE_KEY);

    await loadInitialPersonas().catch((error: unknown) => {
      console.error("Error al cargar personas:", error);
      patchUi({ mensaje: "No se pudieron cargar las personas." });
      setPersonas([]);
      setLastDoc(null);
      setHasMore(false);
    });
  };

  const cargarMasPersonas = async () => {
    if (!hasMore || !lastDoc || loadingMore) return;

    setLoadingMore(true);
    await fetchPersonasPage(lastDoc)
      .then(({ data, nextCursor, hasMore: nextHasMore }) => {
        setPersonas((prev) => {
          const merged = [...prev, ...data];
          setCachedValue(
            PERSONAS_CACHE_KEY,
            merged.slice(0, PERSONAS_PAGE_SIZE),
            PERSONAS_CACHE_TTL_MS,
          );
          return merged;
        });
        setLastDoc(nextCursor);
        setHasMore(nextHasMore);
      })
      .catch((error: unknown) => {
        console.error("Error al cargar mas personas:", error);
        patchUi({ mensaje: "No se pudieron cargar mas personas." });
      });

    setLoadingMore(false);
  };

  const filtered = useMemo(() => {
    const normalized = ui.query.trim().toLowerCase();
    if (!normalized) return personas;

    return personas.filter((p) => {
      const fullName =
        `${p.nombre} ${p.apellido1 ?? ""} ${p.apellido2 ?? ""}`.toLowerCase();
      return fullName.includes(normalized);
    });
  }, [personas, ui.query]);

  const guardarNuevaPersona = async (
    form: PersonaForm,
    role: PersonaRole,
    permisos: PersonaPermisos,
  ) => {
    await addDoc(collection(db, "personas"), {
      ...form,
      role,
      permisos,
      createdAt: serverTimestamp(),
    });
    patchUi({ showCreateModal: false, mensaje: "Persona registrada correctamente." });
    await Swal.fire({
      icon: "success",
      title: "Registro exitoso",
      text: "Persona registrada correctamente.",
    });
    await recargarPersonas();
  };

  const guardarEdicion = async (
    id: string,
    form: PersonaForm,
    role: PersonaRole,
    permisos: PersonaPermisos,
  ) => {
    await updateDoc(doc(db, "personas", id), {
      ...form,
      ...(canManagePermissions ? { role, permisos } : {}),
    });
    patchUi({
      mensaje: "Persona actualizada correctamente.",
      selectedPersona: null,
    });
    await Swal.fire({
      icon: "success",
      title: "Actualizacion exitosa",
      text: "Persona actualizada correctamente.",
    });
    await recargarPersonas();
  };

  return (
    <PageSection title="Gestion de personas">
      <StatusMessage message={ui.mensaje} />

      <div className="table-toolbar">
        <Input
          placeholder="Buscar por nombre..."
          value={ui.query}
          onChange={(e) => patchUi({ query: e.target.value })}
        />
        <Button
          variant="secondary"
          onClick={() => patchUi({ showCreateModal: true })}
        >
          Agregar persona
        </Button>
      </div>

      {ui.loading ? (
        <Spinner text="Cargando personas..." />
      ) : (
        <div className="stack-sm">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Telefono</th>
                  <th>Rol</th>
                  <th>Puntos</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td data-label="Nombre">
                      {`${p.nombre} ${p.apellido1 ?? ""} ${p.apellido2 ?? ""}`.trim()}
                    </td>
                    <td data-label="Telefono">{p.telefono ?? "-"}</td>
                    <td data-label="Rol">{p.role ?? "coordinador"}</td>
                    <td data-label="Puntos">{p.puntos ?? 0}</td>
                    <td data-label="Acciones">
                      <div className="table-actions">
                        <Button
                          variant="secondary"
                          onClick={() => patchUi({ selectedPersona: p })}
                        >
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
            <Button
              variant="secondary"
              onClick={() => void cargarMasPersonas()}
              disabled={loadingMore}
            >
              {loadingMore ? "Cargando..." : "Cargar mas personas"}
            </Button>
          ) : null}
        </div>
      )}

      <PersonaCreateModal
        isOpen={ui.showCreateModal}
        onClose={() => patchUi({ showCreateModal: false })}
        canManagePermissions={canManagePermissions}
        onConfirm={guardarNuevaPersona}
      />

      <PersonaEditModal
        isOpen={ui.selectedPersona !== null}
        persona={ui.selectedPersona}
        canManagePermissions={canManagePermissions}
        onConfirm={guardarEdicion}
        onClose={() => patchUi({ selectedPersona: null })}
      />
    </PageSection>
  );
}
