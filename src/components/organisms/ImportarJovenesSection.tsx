import { useState } from "react";
import * as XLSX from "xlsx";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import Swal from "sweetalert2";
import { db } from "../../firebase";
import { defaultPermisosByRole } from "../../lib/permissions";
import { normalizeEmail, normalizeName, normalizePhone, normalizeRoleValue } from "../../lib/textNormalization";
import type { ExcelRow } from "../../type/componentProps";
import { findValue, toText, toNumber, toDateString, toBool } from "../../lib/excelUtils";
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
          const apellido1 = toText(findValue(r, ["primer apellido", "apellido1", "apellido 1", "primer_apellido"]));
          const apellido2 = toText(findValue(r, ["segundo apellido", "apellido2", "apellido 2", "segundo_apellido"]));

          if (!nombre) {
            fail += 1;
            continue;
          }

          const edadRaw = findValue(r, ["edad"]);
          const fechaNacimiento = toDateString(findValue(r, ["fecha nacimiento", "fecha de nacimiento", "nacimiento"]));
          const telefono = toText(findValue(r, ["telefono", "teléfono", "telefono sin g", "teléfono sin g"]));
          const localidad = toText(findValue(r, ["localidad", "barrio", "distrito"]));
          const bautizadoRaw = findValue(r, ["bautizado", "bautizada"]);

          await addDoc(collection(db, "personas"), {
            nombre: normalizeName(nombre),
            apellido1: normalizeName(apellido1),
            apellido2: normalizeName(apellido2),
            role: normalizeRoleValue("joven"),
            permisos: defaultPermisosByRole("joven"),
            email: normalizeEmail(toText(findValue(r, ["email", "correo", "correo electronico", "correo electrónico"]))),
            telefono: normalizePhone(telefono),
            localidad,
            fechaNacimiento,
            edad: toNumber(edadRaw, 0),
            bautizado: toBool(bautizadoRaw),
            puntos: toNumber(findValue(r, ["puntos", "puntaje"]), 0),
            createdAt: serverTimestamp(),
          })
            .then(() => { ok += 1; })
            .catch(() => { fail += 1; });
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
    <PageSection title="Importar jovenes desde Excel">
      <p className="small-text">
        Encabezados soportados: NOMBRE, PRIMER APELLIDO, SEGUNDO APELLIDO, EDAD, FECHA NACIMIENTO, TELEFONO,
        LOCALIDAD, BAUTIZADO.
      </p>
      <input type="file" accept=".xlsx,.xls" onChange={onFileChange} disabled={loading} />
      {loading ? <p>Cargando...</p> : null}
      {resultado ? <p>{resultado}</p> : null}

      <hr />

      <ExportarSection />
    </PageSection>
  );
}
