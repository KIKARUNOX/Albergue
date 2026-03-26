import type { ButtonProps } from "../../type/componentProps";

export default function Button({ children, variant = "primary", className = "", ...props }: ButtonProps) {
  const variantClass = variant === "primary" ? "btn-primary" : variant === "danger" ? "btn-danger" : "btn-secondary";

  return (
    <button className={`${variantClass} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
