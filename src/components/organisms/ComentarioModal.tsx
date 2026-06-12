import { useState } from "react";
import Button from "../atoms/Button";
import TextArea from "../atoms/TextArea";

type ComentarioModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onEnviar: (texto: string) => Promise<void>;
};

export default function ComentarioModal({ isOpen, onClose, onEnviar }: ComentarioModalProps) {
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (!isOpen) return null;

  const enviar = async () => {
    const t = texto.trim();
    if (!t) return;
    setEnviando(true);
    try {
      await onEnviar(t);
      setTexto("");
      onClose();
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="comentario-modal-overlay" onClick={onClose}>
      <div className="comentario-modal" onClick={(e) => e.stopPropagation()}>
        <h4>Dejar comentario</h4>
        <TextArea
          placeholder="Escribe tu comentario..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={4}
          maxLength={300}
        />
        <div className="comentario-modal-actions">
          <Button variant="secondary" onClick={onClose} disabled={enviando}>
            Cancelar
          </Button>
          <Button onClick={() => void enviar()} disabled={enviando || !texto.trim()}>
            {enviando ? "Enviando..." : "Publicar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
