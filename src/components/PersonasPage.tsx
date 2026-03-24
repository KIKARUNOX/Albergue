import RegistrarPersona from "./RegistrarPersona";
import SearchBar from "./SearchBar";
import EditarPersonas from "./EditarPersonas";

export default function PersonasPage() {
  return (
    <div>
      <h1>Gestion de personas</h1>
      <RegistrarPersona />
      <SearchBar />
      <EditarPersonas />
    </div>
  );
}
