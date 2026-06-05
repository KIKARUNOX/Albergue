import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Login from "./Login";
import { signInWithEmailAndPassword } from "firebase/auth";
import Swal from "sweetalert2";

jest.mock("firebase/auth", () => ({
  signInWithEmailAndPassword: jest.fn(),
}));

jest.mock("../firebase", () => ({
  auth: {},
}));

jest.mock("sweetalert2", () => ({
  __esModule: true,
  default: {
    fire: jest.fn(),
  },
}));

describe("Login", () => {
  beforeEach(() => {
    jest.mocked(signInWithEmailAndPassword).mockReset();
    jest.mocked(Swal.fire).mockReset();
  });

  it("muestra una alerta si la contraseña es demasiado corta", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );

    await user.type(screen.getByPlaceholderText("Email"), "user@example.com");
    await user.type(screen.getByPlaceholderText("Password"), "123");
    await user.click(screen.getByRole("button", { name: "Ingresar" }));

    expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: "warning",
        title: "Contraseña invalida",
      }),
    );
  });

  it("normaliza el email antes de llamar a Firebase", async () => {
    jest.mocked(signInWithEmailAndPassword).mockResolvedValueOnce(undefined as never);
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );

    await user.type(screen.getByPlaceholderText("Email"), "  USER@Example.com  ");
    await user.type(screen.getByPlaceholderText("Password"), "123456");
    await user.click(screen.getByRole("button", { name: "Ingresar" }));

    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        {},
        "user@example.com",
        "123456",
      );
    });
  });
});