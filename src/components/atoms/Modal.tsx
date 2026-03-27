import type { ReactNode } from "react";
import "../../styles/modal.css";

interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export default function Modal({ isOpen, title, onClose, children }: ModalProps) {
  if (!isOpen) return null;

  const closeOnKeyboard = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClose();
    }
  };

  const stopCloseOnKeyboard = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} onKeyDown={closeOnKeyboard} role="button" tabIndex={0}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={stopCloseOnKeyboard}
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar modal">
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
