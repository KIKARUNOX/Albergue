import { useState } from "react";
import * as XLSX from "xlsx";
import { addDoc, collection, getDocs, serverTimestamp } from "firebase/firestore";
import Swal from "sweetalert2";
import { db } from "../../firebase";
import { defaultPermisosByRole } from "../../lib/permissions";
import { normalizeEmail, normalizeName, normalizePhone, normalizeRoleValue } from "../../lib/textNormalization";
import type { ExcelRow } from "../../type/componentProps";
import type { AsistenciaDoc, Persona } from "../../type/asistencia";
import type { PersonaDetalle } from "../../type/persona";
import PageSection from "../templates/PageSection";

export default function ImportarJovenesSection() {
  "use no memo";

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [resultado, setResultado] = useState("");

  const timestampForFile = () => new Date().toISOString().replace(/[:.]/g, "-");

  const downloadExcel = (rows: Record<string, unknown>[], sheetName: string, filename: string) => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, filename);
  };

  const fullNameFromPersona = (persona: Partial<PersonaDetalle> | Partial<Persona>) => {
    const nombre = String(persona.nombre ?? "").trim();
    const apellido1 = String(persona.apellido1 ?? "").trim();
    const apellido2 = String(persona.apellido2 ?? "").trim();
    return `${nombre} ${apellido1} ${apellido2}`.replace(/\s+/g, " ").trim();
  };

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
      await Swal.fire({
        icon: "error",
        title: "Error al exportar",
        text: "No se pudo exportar personas.",
      });
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
          rows.push({
            asistenciaId: docSnap.id,
            fecha,
            personaId: "",
            quienFue: "",
          });
          return;
        }

        personas.forEach((personaId) => {
          rows.push({
            asistenciaId: docSnap.id,
            fecha,
            personaId,
            quienFue: personasById.get(personaId) ?? personaId,
          });
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
      await Swal.fire({
        icon: "error",
        title: "Error al exportar",
        text: "No se pudo exportar asistencias.",
      });
    } finally {
      setExporting(false);
    }
  };

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
    if (!file) {
      await Swal.fire({
        icon: "warning",
        title: "Archivo requerido",
        text: "Selecciona un archivo Excel para importar.",
      });
      return;
    }
    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      await Swal.fire({
        icon: "warning",
        title: "Formato invalido",
        text: "Solo se permiten archivos .xlsx o .xls.",
      });
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
          .then(() => {
            ok += 1;
          })
          .catch(() => {
            fail += 1;
          });
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
        void Swal.fire({
          icon: "error",
          title: "Error de importacion",
          text: "Error leyendo el archivo Excel.",
        });
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

      <div className="stack-sm">
        <h3>Exportar a Excel</h3>
        <p className="small-text">
          Puedes exportar personas con todos sus datos o asistencias con fecha y quien fue.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => void exportarPersonasExcel()}
            disabled={exporting}
          >
            {exporting ? "Exportando..." : "Exportar personas"}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => void exportarAsistenciasExcel()}
            disabled={exporting}
          >
            {exporting ? "Exportando..." : "Exportar asistencias"}
          </button>
        </div>
      </div>
    </PageSection>
  );
}
