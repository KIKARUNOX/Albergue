import { useState } from "react";
import * as XLSX from "xlsx";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import type { ExcelRow } from "../../type/componentProps";
import PageSection from "../templates/PageSection";

export default function ImportarJovenesSection() {
  "use no memo";

  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState("");

  const normalizeHeader = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  const findValue = (row: ExcelRow, aliases: string[]) => {
    const aliasSet = new Set(aliases.map(normalizeHeader));

    for (const [key, value] of Object.entries(row)) {
      if (aliasSet.has(normalizeHeader(key))) {
        return value;
      }
    }

    return undefined;
  };

  const toText = (v: unknown) => String(v ?? "").trim();

  const toNumber = (v: unknown, fallback = 0) => {
    if (typeof v === "number") return Number.isFinite(v) ? v : fallback;
    if (typeof v === "string") {
      const parsed = Number(v.replace(",", ".").trim());
      return Number.isFinite(parsed) ? parsed : fallback;
    }
    return fallback;
  };

  const toDateString = (v: unknown) => {
    if (typeof v === "number") {
      const parsed = XLSX.SSF.parse_date_code(v);
      if (!parsed) return "";
      const yyyy = String(parsed.y).padStart(4, "0");
      const mm = String(parsed.m).padStart(2, "0");
      const dd = String(parsed.d).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }
    return toText(v);
  };

  const toBool = (v: unknown) => {
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v === 1;
    if (typeof v === "string") {
      const x = v.trim().toLowerCase();
      return x === "true" || x === "si" || x === "sí" || x === "1" || x === "yes";
    }
    return false;
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setResultado("");

    try {
      const data = await file.arrayBuffer();
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
          nombre,
          apellido1,
          apellido2,
          email: toText(findValue(r, ["email", "correo", "correo electronico", "correo electrónico"])),
          telefono,
          localidad,
          fechaNacimiento,
          edad: toNumber(edadRaw, 0),
          bautizado: toBool(bautizadoRaw),
          puntos: toNumber(findValue(r, ["puntos", "puntaje"]), 0),
          createdAt: serverTimestamp(),
        })
          .then(() => {
            ok += 1;
          })
          .catch(() => {
            fail += 1;
          });
      }

      setResultado(`Importacion completada. Correctos: ${ok}, Fallidos: ${fail}`);
    } catch (err) {
      console.error(err);
      setResultado("Error leyendo el archivo Excel.");
    }

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
    </PageSection>
  );
}
