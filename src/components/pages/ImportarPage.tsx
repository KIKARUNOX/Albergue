import { Helmet } from "react-helmet-async";
import ImportarJovenesSection from "../organisms/ImportarJovenesSection";

export default function ImportarPage() {
  return (
    <>
      <Helmet>
        <title>Importar — Código 316</title>
        <meta name="description" content="Importa jóvenes desde archivos Excel a la plataforma." />
      </Helmet>
      <ImportarJovenesSection />
    </>
  );
}
