import { Helmet } from "react-helmet-async";
import ImportarJovenesSection from "../organisms/ImportarJovenesSection";

export default function ImportarPage() {
  return (
    <>
      <Helmet>
        <title>Importar — Albergue</title>
        <meta name="description" content="Importa personas desde archivos Excel al albergue." />
      </Helmet>
      <ImportarJovenesSection />
    </>
  );
}
