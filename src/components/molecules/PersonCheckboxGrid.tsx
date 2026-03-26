import type { PersonCheckboxGridProps } from "../../type/componentProps";

export default function PersonCheckboxGrid({ personas, selectedIds, onToggle }: PersonCheckboxGridProps) {
  return (
    <div className="checkbox-grid">
      {personas.map((p) => (
        <label key={p.id} className="checkbox-item">
          <input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => onToggle(p.id)} />
          <span>
            {p.nombre} {p.apellido1}
          </span>
        </label>
      ))}
    </div>
  );
}
