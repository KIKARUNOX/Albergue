import type { LabelProps } from "../../type/componentProps";

export default function Label({ children, htmlFor, required, className }: LabelProps) {
  return (
    <label htmlFor={htmlFor} className={className}>
      {children}
      {required ? <span className="required-mark"> *</span> : null}
    </label>
  );
}
