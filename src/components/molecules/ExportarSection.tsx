import { useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import Swal from "sweetalert2";
import { db } from "../../firebase";
import type { PersonaDetalle } from "../../type/persona";
import type { AsistenciaDoc } from "../../type/asistencia";
import { downloadExcel, fullNameFromPersona, timestampForFile } from "../../lib/excelUtils";
import Button from "../atoms/Button";

export default function ExportarSection() {
  const [exporting, setExporting] = useState(false);

  const exportarPersonasExcel = async () => {
    setExporting(true);
    try {
      const snapshot = await getDocs(collection(db, "personas"));
      const rows = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as PersonaDetalle & { edad?: number; createdAt?: unknown };
        return {
          id: docSnap.id,
          nombre: data.nombre ?? "",
          apellido1: data.apellido1 ?? "",
          apellido2: data.apellido2 ?? "",
          nombreCompleto: fullNameFromPersona(data),
          email: data.email ?? "",
          telefono: data.telefono ?? "",
          localidad: data.localidad ?? "",
          fechaNacimiento: data.fechaNacimiento ?? "",
          edad: data.edad ?? "",
          role: data.role ?? "joven",
          puntos: data.puntos ?? 0,
          bautizado: Boolean(data.bautizado),
          authUid: data.authUid ?? "",
        };
      });

      downloadExcel(rows, "Personas", `personas_${timestampForFile()}.xlsx`);
      await Swal.fire({
        icon: "success",
        title: "Exportacion completada",
        text: `Se exportaron ${rows.length} personas.`,
      });
    } catch (error) {
      console.error(error);
      await Swal.fire({ icon: "error", title: "Error al exportar", text: "No se pudo exportar personas." });
    } finally {
      setExporting(false);
    }
  };

  const exportarAsistenciasExcel = async () => {
    setExporting(true);
    try {
      const [personasSnapshot, asistenciasSnapshot] = await Promise.all([
        getDocs(collection(db, "personas")),
        getDocs(collection(db, "asistencias")),
      ]);

      const personasById = new Map<string, string>();
      personasSnapshot.docs.forEach((docSnap) => {
        const data = docSnap.data() as PersonaDetalle;
        personasById.set(docSnap.id, fullNameFromPersona(data) || docSnap.id);
      });

      const rows: Array<Record<string, unknown>> = [];

      asistenciasSnapshot.docs.forEach((docSnap) => {
        const data = docSnap.data() as AsistenciaDoc;
        const fecha = String(data.fecha ?? "");
        const personas = Array.isArray(data.personas) ? data.personas : [];

        if (personas.length === 0) {
          rows.push({ asistenciaId: docSnap.id, fecha, personaId: "", quienFue: "" });
          return;
        }

        personas.forEach((personaId) => {
          rows.push({ asistenciaId: docSnap.id, fecha, personaId, quienFue: personasById.get(personaId) ?? personaId });
        });
      });

      downloadExcel(rows, "Asistencias", `asistencias_${timestampForFile()}.xlsx`);
      await Swal.fire({
        icon: "success",
        title: "Exportacion completada",
        text: `Se exportaron ${rows.length} registros de asistencia.`,
      });
    } catch (error) {
      console.error(error);
      await Swal.fire({ icon: "error", title: "Error al exportar", text: "No se pudo exportar asistencias." });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="stack-sm">
      <h3>Exportar a Excel</h3>
      <p className="small-text">
        Puedes exportar personas con todos sus datos o asistencias con fecha y quien fue.
      </p>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <Button variant="secondary" onClick={() => void exportarPersonasExcel()} disabled={exporting}>
          {exporting ? "Exportando..." : "Exportar personas"}
        </Button>
        <Button variant="secondary" onClick={() => void exportarAsistenciasExcel()} disabled={exporting}>
          {exporting ? "Exportando..." : "Exportar asistencias"}
        </Button>
      </div>
    </div>
  );
}
