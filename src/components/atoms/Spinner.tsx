import type { SpinnerProps } from "../../type/componentProps";

export default function Spinner({ text = "Cargando..." }: SpinnerProps) {
  return <p className="loading">{text}</p>;
}
