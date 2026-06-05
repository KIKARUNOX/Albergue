import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EventosManagementSection from "./EventosManagementSection";
import { makeFirestoreSnapshot } from "../../test/firestoreMocks";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import Swal from "sweetalert2";

jest.mock("firebase/firestore", () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(),
  updateDoc: jest.fn(),
}));

jest.mock("../../firebase", () => ({
  db: {},
  auth: {
    currentUser: {
      getIdToken: jest.fn().mockResolvedValue("token-123"),
    },
  },
}));

jest.mock("sweetalert2", () => ({
  __esModule: true,
  default: {
    fire: jest.fn(),
  },
}));

describe("EventosManagementSection", () => {
  beforeEach(() => {
    jest.mocked(getDocs).mockResolvedValue(makeFirestoreSnapshot([]));
    jest.mocked(collection).mockReturnValue({} as never);
    jest.mocked(doc).mockReturnValue({} as never);
    jest.mocked(addDoc).mockResolvedValue(undefined as never);
    jest.mocked(updateDoc).mockResolvedValue(undefined as never);
    jest.mocked(deleteDoc).mockResolvedValue(undefined as never);
    jest.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  });

  it("crea un evento con imagenes manuales", async () => {
    const user = userEvent.setup();

    const { container } = render(<EventosManagementSection />);

    await waitFor(() => expect(screen.getByText("No hay eventos. Crea uno para comenzar.")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "+ Nuevo Evento" }));
    await user.type(container.querySelector('input[name="fecha"]') as HTMLInputElement, "2026-06-13");
    await user.type(screen.getByPlaceholderText("Ej: Retiro Jóvenes"), "Retiro 2026");
    await user.type(screen.getByPlaceholderText("https://drive.google.com/..."), "https://example.com/foto.jpg");
    await user.click(screen.getByRole("button", { name: "Crear" }));

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          fecha: "2026-06-13",
          titulo: "Retiro 2026",
          imagenes: ["https://example.com/foto.jpg"],
        }),
      );
    });
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: "success",
        title: "Evento creado",
      }),
    );
  });
});