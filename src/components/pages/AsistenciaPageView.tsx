import { Helmet } from "react-helmet-async";
import AsistenciaTemplate from "../templates/AsistenciaTemplate";

export default function AsistenciaPageView() {
  return (
    <>
      <Helmet>
        <title>Asistencias — Código 316</title>
        <meta name="description" content="Registro y control de asistencias de los jóvenes." />
      </Helmet>
      <AsistenciaTemplate />
    </>
  );
}
