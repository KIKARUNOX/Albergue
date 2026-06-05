import { renderHook, waitFor } from "@testing-library/react";
import useAsistenciaPage from "./useAsistenciaPage";
import { makeFirestoreSnapshot } from "../test/firestoreMocks";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  increment,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
} from "firebase/firestore";
import Swal from "sweetalert2";
import { act } from "@testing-library/react";

jest.mock("firebase/firestore", () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  limit: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(),
  serverTimestamp: jest.fn(),
  setDoc: jest.fn(),
  startAfter: jest.fn(),
  updateDoc: jest.fn(),
  increment: jest.fn(),
}));

jest.mock("../firebase", () => ({
  db: {},
}));

jest.mock("../lib/readCache", () => ({
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

describe("useAsistenciaPage", () => {
  beforeEach(() => {
    jest.mocked(getDocs).mockResolvedValue(makeFirestoreSnapshot([]));
    jest.mocked(getDoc).mockResolvedValue({ exists: () => false, data: () => undefined } as never);
    jest.mocked(collection).mockReturnValue({} as never);
    jest.mocked(doc).mockReturnValue({} as never);
    jest.mocked(query).mockReturnValue({} as never);
    jest.mocked(limit).mockReturnValue(50 as never);
    jest.mocked(orderBy).mockReturnValue({} as never);
    jest.mocked(startAfter).mockReturnValue({} as never);
    jest.mocked(serverTimestamp).mockReturnValue({} as never);
    jest.mocked(increment).mockReturnValue({} as never);
    jest.mocked(addDoc).mockResolvedValue(undefined as never);
    jest.mocked(setDoc).mockResolvedValue(undefined as never);
    jest.mocked(updateDoc).mockResolvedValue(undefined as never);
    jest.mocked(deleteDoc).mockResolvedValue(undefined as never);
    jest.mocked(Swal.fire).mockResolvedValue(undefined as never);
  });

  it("bloquea la creacion de asistencia si no hay personas seleccionadas", async () => {
    const { result } = renderHook(() => useAsistenciaPage());

    await waitFor(() => expect(result.current.loading).toBe(false));

    let ok = false;
    await act(async () => {
      result.current.setNewFecha("2026-06-13");
    });
    await act(async () => {
      ok = await result.current.crearAsistencia();
    });

    expect(ok).toBe(false);
    expect(addDoc).not.toHaveBeenCalled();
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: "warning",
        title: "Asistentes requeridos",
      }),
    );
  });

  it("crea una asistencia con fecha y asistentes validos", async () => {
    const { result } = renderHook(() => useAsistenciaPage());

    await waitFor(() => expect(result.current.loading).toBe(false));

    let ok = false;
    await act(async () => {
      result.current.setNewFecha("2026-06-13");
      result.current.togglePersonaSeleccionada("persona-1");
    });
    await act(async () => {
      ok = await result.current.crearAsistencia();
    });

    expect(ok).toBe(true);
    expect(addDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        fecha: "2026-06-13",
        personas: ["persona-1"],
        completaron: [],
      }),
    );
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: "success",
        title: "Asistencia creada",
      }),
    );
  });
});