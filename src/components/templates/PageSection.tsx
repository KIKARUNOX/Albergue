import type { PageSectionProps } from "../../type/componentProps";

export default function PageSection({ title, children }: PageSectionProps) {
  return (
    <section className="page-card stack-md">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
