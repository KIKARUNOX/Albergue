import { buildApiUrl } from "./apiBase";

export async function linkPersonaOnServer(payload: {
  nombre: string;
  apellido1: string;
  apellido2: string;
  idToken: string;
}): Promise<{
  status: "linked" | "no_match" | "conflict";
  reason?: string;
  email?: string;
}> {
  let response: Response;
  try {
    response = await fetch(buildApiUrl("/api/link-persona"), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${payload.idToken}`,
      },
      body: JSON.stringify({
        nombre: payload.nombre,
        apellido1: payload.apellido1,
        apellido2: payload.apellido2,
      }),
    });
  } catch {
    throw new Error(
      "No se pudo validar la persona en el servidor. Intenta de nuevo en unos minutos.",
    );
  }

  const raw = await response.text();
  let parsed: unknown = {};
  if (raw) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }
  }

  const data = parsed as {
    status?: "linked" | "no_match" | "conflict";
    reason?: string;
    email?: string;
    error?: string;
  };

  if (!response.ok && (response.status === 404 || response.status === 405)) {
    return { status: "no_match" };
  }

  if (!response.ok && data.status !== "conflict") {
    throw new Error(
      data.error ||
        `No se pudo vincular la persona en el servidor (HTTP ${response.status}).`,
    );
  }

  if (
    data.status === "linked" ||
    data.status === "no_match" ||
    data.status === "conflict"
  ) {
    return {
      status: data.status,
      reason: data.reason,
      email: data.email,
    };
  }

  throw new Error("Respuesta invalida del servidor al vincular persona.");
}

export async function createPersonaOnServer(payload: {
  nombre: string;
  apellido1: string;
  apellido2: string;
  idToken: string;
}): Promise<void> {
  let response: Response;
  try {
    response = await fetch(buildApiUrl("/api/register-persona"), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${payload.idToken}`,
      },
      body: JSON.stringify({
        nombre: payload.nombre,
        apellido1: payload.apellido1,
        apellido2: payload.apellido2,
      }),
    });
  } catch {
    throw new Error(
      "No se pudo crear la persona en el servidor. Intenta de nuevo en unos minutos.",
    );
  }

  const raw = await response.text();
  let parsed: unknown = {};
  if (raw) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }
  }

  const data = parsed as { error?: string };
  if (!response.ok) {
    throw new Error(
      data.error ||
        `No se pudo crear la persona en el servidor (HTTP ${response.status}).`,
    );
  }
}
