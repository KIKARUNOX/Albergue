import Input from "../atoms/Input";
import Label from "../atoms/Label";
import type { PersonCheckboxGridProps } from "../../type/componentProps";

export default function PersonCheckboxGrid({ personas, selectedIds, onToggle }: PersonCheckboxGridProps) {
  return (
    <div className="checkbox-grid">
      {personas.map((p) => (
        <Label key={p.id} className="checkbox-item">
          <Input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => onToggle(p.id)} />
          <span>
            {p.nombre} {p.apellido1}
          </span>
        </Label>
      ))}
    </div>
  );
}
