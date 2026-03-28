import PersonasManagementSection from "../organisms/PersonasManagementSection";
import type { PersonasPageViewProps } from "../../type/componentProps";

export default function PersonasPageView({ canManagePermissions }: PersonasPageViewProps) {
  return (
    <div className="page-stack">
      <h1>Gestion de personas</h1>
      <PersonasManagementSection canManagePermissions={canManagePermissions} />
    </div>
  );
}
