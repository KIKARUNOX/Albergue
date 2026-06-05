import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ImportarJovenesSection from "./ImportarJovenesSection";
import { makeFirestoreDoc, makeFirestoreSnapshot } from "../../test/firestoreMocks";
import * as XLSX from "xlsx";
import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import Swal from "sweetalert2";

jest.mock("firebase/firestore", () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  getDocs: jest.fn(),
  serverTimestamp: jest.fn(),
}));

jest.mock("../../firebase", () => ({
  db: {},
}));

jest.mock("sweetalert2", () => ({
  __esModule: true,
  default: {
    fire: jest.fn(),
  },
}));

jest.mock("xlsx", () => ({
  read: jest.fn(),
  utils: {
    book_new: jest.fn(),
    json_to_sheet: jest.fn(),
    book_append_sheet: jest.fn(),
    sheet_to_json: jest.fn(),
  },
  writeFile: jest.fn(),
  SSF: {
    parse_date_code: jest.fn(),
  },
}));

describe("ImportarJovenesSection", () => {
  beforeEach(() => {
    jest.mocked(getDocs).mockResolvedValue(
      makeFirestoreSnapshot([
        makeFirestoreDoc("p1", {
          nombre: "Ana",
          apellido1: "Lopez",
          apellido2: "Diaz",
          email: "ana@example.com",
          telefono: "123456",
          localidad: "Sevilla",
          role: "joven",
          puntos: 4,
          bautizado: true,
          authUid: "auth-1",
        }),
        makeFirestoreDoc("a1", {
          fecha: "2026-06-01",
          personas: ["p1"],
        }),
      ]),
    );
    jest.mocked(collection).mockReturnValue({} as never);
    jest.mocked(addDoc).mockResolvedValue(undefined as never);
    jest.mocked(serverTimestamp).mockReturnValue({} as never);
    jest.mocked(Swal.fire).mockResolvedValue(undefined as never);
    jest.mocked(XLSX.read).mockReturnValue({ SheetNames: ["Hoja1"], Sheets: { Hoja1: {} } } as never);
    jest.mocked(XLSX.utils.sheet_to_json).mockReturnValue([
      {
        nombre: "Maria",
        "primer apellido": "Gomez",
        "segundo apellido": "Lopez",
        email: "MARIA@EMAIL.COM",
        telefono: "123 456 789",
        localidad: "Madrid",
        edad: 18,
        bautizado: "si",
        puntos: 7,
      },
      {
        apellido1: "SinNombre",
      },
    ] as never);
    jest.mocked(XLSX.utils.book_new).mockReturnValue({} as never);
    jest.mocked(XLSX.utils.json_to_sheet).mockReturnValue({} as never);
    jest.mocked(XLSX.writeFile).mockReset();
  });

  it("importa un archivo Excel valido y registra las personas", async () => {
    const user = userEvent.setup();

    const { container } = render(<ImportarJovenesSection />);

    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).not.toBeNull();

    const file = new File([new ArrayBuffer(8)], "jovenes.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    Object.defineProperty(file, "arrayBuffer", {
      value: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
    });

    await user.upload(fileInput as HTMLInputElement, file);

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText(/Correctos: 1, Fallidos: 1/)).toBeInTheDocument();
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: "warning",
        title: "Importacion completada",
      }),
    );
  });

  it("exporta personas a Excel", async () => {
    const user = userEvent.setup();

    render(<ImportarJovenesSection />);

    await user.click(screen.getByRole("button", { name: "Exportar personas" }));

    await waitFor(() => {
      expect(XLSX.writeFile).toHaveBeenCalled();
    });
    expect((XLSX.writeFile as jest.Mock).mock.calls[0][1]).toMatch(/^personas_/);
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: "success",
        title: "Exportacion completada",
      }),
    );
  });
});