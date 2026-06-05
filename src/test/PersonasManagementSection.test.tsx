import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PersonasManagementSection from "./PersonasManagementSection";
import { makeFirestoreDoc, makeFirestoreSnapshot } from "../../test/firestoreMocks";
import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
} from "firebase/firestore";
import Swal from "sweetalert2";

jest.mock("firebase/firestore", () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(),
  limit: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(),
  serverTimestamp: jest.fn(),
  startAfter: jest.fn(),
  updateDoc: jest.fn(),
}));

jest.mock("../../firebase", () => ({
  db: {},
}));

jest.mock("../../lib/readCache", () => ({
  getCachedValue: jest.fn(),
  setCachedValue: jest.fn(),
  invalidateCache: jest.fn(),
}));

jest.mock("sweetalert2", () => ({
  __esModule: true,
  default: {
    fire: jest.fn(),
  },
}));

describe("PersonasManagementSection", () => {
  beforeEach(() => {
    jest.mocked(getDocs).mockResolvedValue(
      makeFirestoreSnapshot([
        makeFirestoreDoc("1", {
          nombre: "Ana",
          apellido1: "Lopez",
          apellido2: "Diaz",
          telefono: "123456789",
          role: "joven",
          puntos: 5,
        }),
        makeFirestoreDoc("2", {
          nombre: "Juan",
          apellido1: "Perez",
          apellido2: "Ruiz",
          telefono: "987654321",
          role: "coordinador",
          puntos: 8,
        }),
      ]),
    );
    jest.mocked(collection).mockReturnValue({} as never);
    jest.mocked(query).mockReturnValue({} as never);
    jest.mocked(limit).mockReturnValue(40 as never);
    jest.mocked(orderBy).mockReturnValue({} as never);
    jest.mocked(startAfter).mockReturnValue({} as never);
    jest.mocked(serverTimestamp).mockReturnValue({} as never);
    jest.mocked(addDoc).mockResolvedValue(undefined as never);
    jest.mocked(updateDoc).mockResolvedValue(undefined as never);
    jest.mocked(Swal.fire).mockResolvedValue(undefined as never);
  });

  it("filtra personas por nombre", async () => {
    const user = userEvent.setup();

    render(<PersonasManagementSection canManagePermissions={false} />);

    await waitFor(() => expect(screen.queryByText("Cargando personas...")).not.toBeInTheDocument());
    expect(await screen.findByText("Ana Lopez Diaz")).toBeInTheDocument();
    expect(screen.getByText("Juan Perez Ruiz")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Buscar por nombre..."), "Juan");

    expect(screen.queryByText("Ana Lopez Diaz")).not.toBeInTheDocument();
    expect(screen.getByText("Juan Perez Ruiz")).toBeInTheDocument();
  });

  it("crea una persona nueva con datos normalizados", async () => {
    const user = userEvent.setup();

    render(<PersonasManagementSection canManagePermissions={false} />);

    await waitFor(() => expect(screen.queryByText("Cargando personas...")).not.toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Agregar persona" }));
    await user.type(screen.getByPlaceholderText("Nombre *"), "  maria  ");
    await user.type(screen.getByPlaceholderText("Primer apellido"), "  de la cruz ");
    await user.type(screen.getByPlaceholderText("Segundo apellido"), "  lopez ");
    await user.type(screen.getByPlaceholderText("Correo"), "  MARIA@EMAIL.COM ");
    await user.type(screen.getByPlaceholderText("Telefono"), " 123 456 789 ");
    await user.type(screen.getByPlaceholderText("Localidad"), " Sevilla ");
    await user.clear(screen.getByPlaceholderText("Puntos"));
    await user.type(screen.getByPlaceholderText("Puntos"), "7");
    await user.click(screen.getByRole("button", { name: "Guardar persona" }));

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          nombre: "Maria",
          apellido1: "Delacruz",
          apellido2: "Lopez",
          email: "maria@email.com",
          telefono: "123456789",
          localidad: "Sevilla",
          puntos: 7,
          role: "joven",
        }),
      );
    });

    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: "success",
        title: "Registro exitoso",
      }),
    );
  });
});