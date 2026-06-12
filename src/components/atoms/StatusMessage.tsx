import type { StatusMessageProps } from "../../type/componentProps";

export default function StatusMessage({ message }: StatusMessageProps) {
  if (!message) return null;

  const success =
    message.toLowerCase().includes("creado") ||
    message.toLowerCase().includes("agregado") ||
    message.toLowerCase().includes("eliminado") ||
    message.toLowerCase().includes("actualizado");

  return <p className={`form-message ${success ? "success" : "error"}`}>{message}</p>;
}
