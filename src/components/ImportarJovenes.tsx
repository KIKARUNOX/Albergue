import { useState } from "react";
import * as XLSX from "xlsx";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

type JovenRow = {
  nombre?: string;
  apellido1?: string;
  apellido2?: string;
  email?: string;
  bautizado?: boolean | string | number;
  puntos?: number | string;
};

export default function ImportarJovenes() {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState("");

  const toBool = (v: unknown) => {
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v === 1;
    if (typeof v === "string") {
      const x = v.trim().toLowerCase();
      return x === "true" || x === "si" || x === "sí" || x === "1";
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
      const rows = XLSX.utils.sheet_to_json<JovenRow>(ws);

      let ok = 0;
      let fail = 0;

      for (const r of rows) {
        if (!r.nombre) {
          fail++;
          continue;
        }

        try {
          await addDoc(collection(db, "personas"), {
            nombre: String(r.nombre ?? "").trim(),
            apellido1: String(r.apellido1 ?? "").trim(),
            apellido2: String(r.apellido2 ?? "").trim(),
            email: String(r.email ?? "").trim(),
            bautizado: toBool(r.bautizado),
            puntos: Number(r.puntos ?? 0) || 0,
            createdAt: serverTimestamp(),
          });
          ok++;
        } catch {
          fail++;
        }
      }

      setResultado(`Importación completada. Correctos: ${ok}, Fallidos: ${fail}`);
    } catch (err) {
      console.error(err);
      setResultado("Error leyendo el archivo Excel.");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: "20px auto", border: "1px solid #ccc", padding: 16, borderRadius: 8 }}>
      <h3>Importar jóvenes desde Excel</h3>
      <p>Columnas esperadas: nombre, apellido1, apellido2, email, bautizado, puntos</p>
      <input type="file" accept=".xlsx,.xls" onChange={onFileChange} disabled={loading} />
      {loading && <p>Cargando...</p>}
      {resultado && <p>{resultado}</p>}
    </div>
  );
}