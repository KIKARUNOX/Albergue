import { useState } from "react";
import Swal from "sweetalert2";
import { supabase } from "../../supabase";
import type { Persona } from "../../type/persona";
import { downloadExcel, fullNameFromPersona, timestampForFile } from "../../lib/excelUtils";
import Button from "../atoms/Button";

export default function ExportarSection() {
  const [exporting, setExporting] = useState(false);

  const exportarPersonasExcel = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase.from("personas").select("*").order("nombre");
      if (error) throw error;

      const rows = (data as Persona[]).map((p) => ({
        id: p.id,
        nombre: p.nombre,
        apellido1: p.apellido1,
        apellido2: p.apellido2,
        nombreCompleto: fullNameFromPersona(p),
        sexo: p.sexo,
        cedula: p.cedula,
        edad: p.edad,
        direccion: p.direccion,
        estado_salud: p.estado_salud,
        escolaridad: p.escolaridad,
        familiar: p.familiar,
        relacion: p.relacion,
        estado: p.estado,
      }));

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

  return (
    <div className="stack-sm">
      <h3>Exportar a Excel</h3>
      <p className="small-text">
        Exporta todas las personas registradas con sus datos.
      </p>
      <Button variant="secondary" onClick={() => void exportarPersonasExcel()} disabled={exporting}>
        {exporting ? "Exportando..." : "Exportar personas"}
      </Button>
    </div>
  );
}
