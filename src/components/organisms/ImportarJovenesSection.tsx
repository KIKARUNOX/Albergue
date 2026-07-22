import { useState } from "react";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";
import { supabase } from "../../supabase";
import { normalizeName, normalizeCedula } from "../../lib/textNormalization";
import type { ExcelRow } from "../../type/componentProps";
import { findValue, toText, toNumber } from "../../lib/excelUtils";
import PageSection from "../templates/PageSection";
import ExportarSection from "../molecules/ExportarSection";

export default function ImportarJovenesSection() {
  "use no memo";

  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState("");

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      await Swal.fire({ icon: "warning", title: "Archivo requerido", text: "Selecciona un archivo Excel para importar." });
      return;
    }
    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      await Swal.fire({ icon: "warning", title: "Formato invalido", text: "Solo se permiten archivos .xlsx o .xls." });
      e.target.value = "";
      return;
    }

    setLoading(true);
    setResultado("");

    await Promise.resolve(file.arrayBuffer())
      .then(async (data) => {
        const wb = XLSX.read(data);
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<ExcelRow>(ws, { defval: "" });

        let ok = 0;
        let fail = 0;

        for (const r of rows) {
          const nombre = toText(findValue(r, ["nombre", "nombres"]));
          if (!nombre) {
            fail += 1;
            continue;
          }

          const row = {
            nombre: normalizeName(nombre),
            apellido1: normalizeName(toText(findValue(r, ["primer apellido", "apellido1", "apellido 1", "primer_apellido"]))),
            apellido2: normalizeName(toText(findValue(r, ["segundo apellido", "apellido2", "apellido 2", "segundo_apellido"]))),
            sexo: toText(findValue(r, ["sexo", "genero", "género"])),
            cedula: normalizeCedula(toText(findValue(r, ["cedula", "cédula", "dni", "identificacion", "identificación"]))),
            edad: toNumber(findValue(r, ["edad"]), 0),
            direccion: toText(findValue(r, ["direccion", "dirección", "direccion completa", "dirección completa"])),
            estado_salud: toText(findValue(r, ["estado de salud", "salud", "estado salud"])),
            escolaridad: toText(findValue(r, ["escolaridad", "nivel educativo", "estudios", "grado"])),
          };

          const { error } = await supabase.from("personas").insert(row);
          if (error) {
            fail += 1;
          } else {
            ok += 1;
          }
        }

        setResultado(`Importacion completada. Correctos: ${ok}, Fallidos: ${fail}`);
        await Swal.fire({
          icon: fail > 0 ? "warning" : "success",
          title: "Importacion completada",
          text: `Correctos: ${ok}, Fallidos: ${fail}`,
        });
      })
      .catch((err: unknown) => {
        console.error(err);
        setResultado("Error leyendo el archivo Excel.");
        void Swal.fire({ icon: "error", title: "Error de importacion", text: "Error leyendo el archivo Excel." });
      });

    setLoading(false);
    e.target.value = "";
  };

  return (
    <PageSection title="Importar personas desde Excel">
      <p className="small-text">
        Encabezados soportados: NOMBRE, PRIMER APELLIDO, SEGUNDO APELLIDO, SEXO, CEDULA, EDAD,
        DIRECCION, ESTADO DE SALUD, ESCOLARIDAD.
      </p>
      <input type="file" accept=".xlsx,.xls" onChange={onFileChange} disabled={loading} />
      {loading ? <p>Cargando...</p> : null}
      {resultado ? <p>{resultado}</p> : null}

      <hr />

      <ExportarSection />
    </PageSection>
  );
}
