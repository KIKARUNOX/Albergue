import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  updateDoc,
  doc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../../firebase";
import type { Evento, EventoComentario } from "../../type/evento";
import type { PersonaDetalle } from "../../type/persona";
import "../../styles/NextSaturdaySection.css";
import EventImageGallery from "../molecules/EventImageGallery";
import ComentarioItem from "../molecules/ComentarioItem";
import ComentarioModal from "./ComentarioModal";
import Spinner from "../atoms/Spinner";
import Button from "../atoms/Button";

type NextSaturdaySectionProps = {
  persona: PersonaDetalle | null;
};

type EventoWithDocId = Evento & { docId: string };

export default function NextSaturdaySection({ persona }: NextSaturdaySectionProps) {
  const [evento, setEvento] = useState<EventoWithDocId | null>(null);
  const [loading, setLoading] = useState(true);
  const [showComentarioModal, setShowComentarioModal] = useState(false);

  useEffect(() => {
    const obtenerProximoEvento = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "eventos"), orderBy("fecha", "asc"));
        const querySnapshot = await getDocs(q);

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const fechaHoy = hoy.toISOString().split("T")[0];

        const eventosFuturos = querySnapshot.docs
          .map((doc) => ({
            docId: doc.id,
            ...(doc.data() as Evento),
          }))
          .filter((evento) => evento.fecha >= fechaHoy)
          .sort(
            (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
          );

        if (eventosFuturos.length > 0) {
          setEvento(eventosFuturos[0]);
        }
      } catch (error) {
        console.error("Error al obtener eventos:", error);
      } finally {
        setLoading(false);
      }
    };

    obtenerProximoEvento();
  }, []);

  const nombreAutor =
    `${persona?.nombre ?? ""} ${persona?.apellido1 ?? ""} ${persona?.apellido2 ?? ""}`.trim()
    || persona?.email
    || "Usuario";

  const comentariosOrdenados = [...(evento?.comentarios ?? [])].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const normalizedRole = (persona?.role ?? "joven").trim().toLowerCase();
  const canModerateComments =
    (normalizedRole === "lider" || normalizedRole === "coordinador" || normalizedRole === "cordinador")
    && Boolean(persona?.permisos?.gestionarPermisos);

  const enviarComentario = async (texto: string) => {
    if (!evento || !persona?.id) return;

    const nuevoComentario: EventoComentario = {
      id: crypto.randomUUID(),
      autorId: persona.id,
      autorNombre: nombreAutor,
      texto,
      createdAt: new Date().toISOString(),
    };

    const eventoRef = doc(db, "eventos", evento.docId);
    await updateDoc(eventoRef, {
      comentarios: arrayUnion(nuevoComentario),
    });

    setEvento((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        comentarios: [...(prev.comentarios ?? []), nuevoComentario],
      };
    });
  };

  const editarComentario = async (commentId: string, nuevoTexto: string) => {
    if (!evento || !persona?.id) return;

    const updatedComentarios = (evento.comentarios ?? []).map((item) => {
      if (item.id !== commentId || item.autorId !== persona.id) return item;
      return { ...item, texto: nuevoTexto };
    });

    const eventoRef = doc(db, "eventos", evento.docId);
    await updateDoc(eventoRef, { comentarios: updatedComentarios });

    setEvento((prev) => {
      if (!prev) return prev;
      return { ...prev, comentarios: updatedComentarios };
    });
  };

  const eliminarComentario = async (commentId: string) => {
    if (!evento || !canModerateComments) return;

    const updatedComentarios = (evento.comentarios ?? []).filter((item) => item.id !== commentId);

    const eventoRef = doc(db, "eventos", evento.docId);
    await updateDoc(eventoRef, { comentarios: updatedComentarios });

    setEvento((prev) => {
      if (!prev) return prev;
      return { ...prev, comentarios: updatedComentarios };
    });
  };

  if (loading) {
    return (
      <section className="next-saturday">
        <div className="saturday-header">
          <h2>Próximos Eventos</h2>
        </div>
        <Spinner />
      </section>
    );
  }

  if (!evento) {
    return null;
  }

  return (
    <section className="next-saturday">
      <div className="saturday-header">
        <h2>Próximos Eventos</h2>
        <p className="evento-fecha">
          {new Date(evento.fecha).toLocaleDateString("es-ES", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="evento-content">
        {evento.titulo && <h3 className="evento-titulo">{evento.titulo}</h3>}
        {evento.descripcion && (
          <p className="evento-desc">{evento.descripcion}</p>
        )}
      </div>

      <EventImageGallery imagenes={evento.imagenes} titulo={evento.titulo} />

      <div className="evento-comentarios">
        <h4>Comentarios</h4>

        {persona?.id ? (
          <div className="comentario-actions">
            <Button onClick={() => setShowComentarioModal(true)}>
              Dejar comentario
            </Button>
          </div>
        ) : (
          <p className="no-evento">Inicia sesión para comentar.</p>
        )}

        {comentariosOrdenados.length === 0 ? (
          <p className="no-evento">Aún no hay comentarios.</p>
        ) : (
          <ul className="comentarios-list">
            {comentariosOrdenados.map((item) => (
              <ComentarioItem
                key={item.id}
                item={item}
                currentUserId={persona?.id ?? ""}
                canDelete={canModerateComments}
                onEdit={editarComentario}
                onDelete={eliminarComentario}
              />
            ))}
          </ul>
        )}
      </div>

      <ComentarioModal
        isOpen={showComentarioModal}
        onClose={() => setShowComentarioModal(false)}
        onEnviar={enviarComentario}
      />
    </section>
  );
}
