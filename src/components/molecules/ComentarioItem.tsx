import { useState } from "react";
import type { EventoComentario } from "../../type/evento";
import Button from "../atoms/Button";
import TextArea from "../atoms/TextArea";

type ComentarioItemProps = {
  item: EventoComentario;
  currentUserId: string;
  canDelete: boolean;
  onEdit: (id: string, nuevoTexto: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

export default function ComentarioItem({
  item,
  currentUserId,
  canDelete,
  onEdit,
  onDelete,
}: ComentarioItemProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(item.texto);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwner = currentUserId === item.autorId;

  const guardarEdicion = async () => {
    const texto = editText.trim();
    if (!texto) return;
    setSaving(true);
    try {
      await onEdit(item.id, texto);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async () => {
    setDeleting(true);
    try {
      await onDelete(item.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <li className="comentario-item">
      <p className="comentario-meta">
        <strong>{item.autorNombre}</strong>
        {" · "}
        {new Date(item.createdAt).toLocaleString("es-ES")}
      </p>

      {editing ? (
        <div className="comentario-edit-box">
          <TextArea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={3}
            maxLength={300}
          />
          <div className="comentario-actions-row">
            <Button variant="secondary" onClick={() => setEditing(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={() => void guardarEdicion()} disabled={saving || !editText.trim()}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className="comentario-texto">{item.texto}</p>
          <div className="comentario-actions-row">
            {isOwner ? (
              <Button variant="secondary" onClick={() => setEditing(true)}>
                Editar
              </Button>
            ) : null}
            {canDelete ? (
              <Button variant="secondary" onClick={() => void eliminar()} disabled={deleting}>
                {deleting ? "Borrando..." : "Borrar"}
              </Button>
            ) : null}
          </div>
        </>
      )}
    </li>
  );
}
