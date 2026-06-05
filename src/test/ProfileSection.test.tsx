import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProfileSection from "./ProfileSection";
import { setDoc } from "firebase/firestore";
import Swal from "sweetalert2";

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
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

describe("ProfileSection", () => {
  beforeEach(() => {
    jest.mocked(setDoc).mockReset();
    jest.mocked(setDoc).mockResolvedValue(undefined as never);
    jest.mocked(Swal.fire).mockReset();
    jest.mocked(Swal.fire).mockResolvedValue(undefined as never);
  });

  it("bloquea el guardado si el email es invalido", async () => {
    const user = userEvent.setup();

    render(
      <ProfileSection
        personaId="persona-1"
        persona={{
          id: "persona-1",
          nombre: "Ana",
          apellido1: "Lopez",
          apellido2: "Diaz",
          email: "ana@example.com",
          telefono: "123456789",
          localidad: "Sevilla",
          fechaNacimiento: "2000-01-01",
          role: "coordinador",
        }}
      />,
    );

    await user.clear(screen.getByPlaceholderText("Correo"));
    await user.type(screen.getByPlaceholderText("Correo"), "correo-invalido");
    await user.click(screen.getByRole("button", { name: "Guardar perfil" }));

    expect(setDoc).not.toHaveBeenCalled();
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: "warning",
        title: "Email invalido",
      }),
    );
  });

  it("guarda el perfil con datos normalizados", async () => {
    const user = userEvent.setup();

    render(
      <ProfileSection
        personaId="persona-1"
        persona={{
          id: "persona-1",
          nombre: "Ana",
          apellido1: "Lopez",
          apellido2: "Diaz",
          email: "ana@example.com",
          telefono: "123456789",
          localidad: "Sevilla",
          fechaNacimiento: "2000-01-01",
          role: "coordinador",
          authUid: "auth-1",
          permisos: { dashboard: true },
        }}
      />,
    );

    await user.clear(screen.getByPlaceholderText("Nombre"));
    await user.type(screen.getByPlaceholderText("Nombre"), "  Maria  ");
    await user.clear(screen.getByPlaceholderText("Correo"));
    await user.type(screen.getByPlaceholderText("Correo"), "  MARIA@EXAMPLE.COM  ");
    await user.click(screen.getByRole("button", { name: "Guardar perfil" }));

    await waitFor(() => {
      expect(setDoc).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          id: "persona-1",
          authUid: "auth-1",
          role: "coordinador",
          nombre: "Maria",
          email: "maria@example.com",
          apellido1: "Lopez",
          apellido2: "Diaz",
          telefono: "123456789",
          localidad: "Sevilla",
          fechaNacimiento: "2000-01-01",
        }),
        { merge: true },
      );
    });

    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: "success",
        title: "Perfil actualizado",
      }),
    );
  });
});