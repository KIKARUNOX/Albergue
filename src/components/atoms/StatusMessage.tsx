import type { StatusMessageProps } from "../../type/componentProps";

export default function StatusMessage({ message }: StatusMessageProps) {
  if (!message) return null;

  const success =
    message.toLowerCase().includes("cread") ||
    message.toLowerCase().includes("agregado") ||
    message.toLowerCase().includes("eliminad") ||
    message.toLowerCase().includes("actualizad");

  return <p className={`form-message ${success ? "success" : "error"}`}>{message}</p>;
}
