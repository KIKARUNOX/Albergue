type LinkPersonaRequest = {
  uid?: string;
  email?: string;
  nombre?: string;
  apellido1?: string;
  apellido2?: string;
};

type PagesContext = {
  request: Request;
  env: Record<string, string | undefined>;
};

type FirestoreDoc = {
  name: string;
  fields?: Record<string, { stringValue?: string }>;
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
}

function normalize(value?: string): string {
  return (value ?? "").trim();
}

function normalizedLower(value?: string): string {
  return normalize(value).toLowerCase();
}

function normalizedName(value?: string): string {
  return normalize(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function getProjectId(env: Record<string, string | undefined>): string | null {
  return env.FIREBASE_PROJECT_ID ?? env.VITE_FIREBASE_PROJECT_ID ?? null;
}

function getStringField(doc: FirestoreDoc, field: string): string {
  return doc.fields?.[field]?.stringValue ?? "";
}

async function queryPersonas(projectId: string, idToken: string): Promise<FirestoreDoc[]> {
  const endpoint = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;
  const payload = {
    structuredQuery: {
      from: [{ collectionId: "personas" }],
      limit: 300,
    },
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      authorization: `Bearer ${idToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Error consultando personas: ${response.status} ${body}`);
  }

  const rows = (await response.json()) as Array<{ document?: FirestoreDoc }>;
  return rows.flatMap((row) => (row.document ? [row.document] : []));
}

async function patchPersonaAuth(
  idToken: string,
  docName: string,
  uid: string,
  email: string
): Promise<void> {
  const endpoint = `https://firestore.googleapis.com/v1/${docName}`
    + "?updateMask.fieldPaths=authUid"
    + "&updateMask.fieldPaths=id"
    + "&updateMask.fieldPaths=email";

  const payload = {
    fields: {
      authUid: { stringValue: uid },
      id: { stringValue: uid },
      email: { stringValue: email },
    },
  };

  const response = await fetch(endpoint, {
    method: "PATCH",
    headers: {
      authorization: `Bearer ${idToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Error vinculando persona: ${response.status} ${body}`);
  }
}

export async function onRequestPost(context: PagesContext): Promise<Response> {
  try {
    const projectId = getProjectId(context.env);
    if (!projectId) {
      return json({ error: "FIREBASE_PROJECT_ID no configurado en el servidor." }, 500);
    }

    const authorization = context.request.headers.get("authorization") ?? "";
    const idToken = authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : "";
    if (!idToken) {
      return json({ error: "Token de autenticacion requerido." }, 401);
    }

    const body = (await context.request.json()) as LinkPersonaRequest;
    const uid = normalize(body.uid);
    const email = normalizedLower(body.email);
    const nombre = normalize(body.nombre);
    const apellido1 = normalize(body.apellido1);
    const apellido2 = normalize(body.apellido2);

    if (!uid || !email || !nombre || !apellido1) {
      return json({ error: "uid, email, nombre y apellido1 son obligatorios." }, 400);
    }

    const docs = await queryPersonas(projectId, idToken);
    const targetNombre = normalizedName(nombre);
    const targetApellido1 = normalizedName(apellido1);
    const targetApellido2 = normalizedName(apellido2);

    const exactMatches = docs.filter((d) => {
      const docNombre = normalizedName(getStringField(d, "nombre"));
      const docApellido1 = normalizedName(getStringField(d, "apellido1"));
      const docApellido2 = normalizedName(getStringField(d, "apellido2"));

      return docNombre === targetNombre && docApellido1 === targetApellido1 && docApellido2 === targetApellido2;
    });

    let match: FirestoreDoc | undefined;
    if (exactMatches.length === 1) {
      [match] = exactMatches;
    } else if (exactMatches.length > 1) {
      const sameEmail = exactMatches.filter((d) => normalizedLower(getStringField(d, "email")) === email);
      if (sameEmail.length === 1) {
        [match] = sameEmail;
      } else {
        const freeToLink = exactMatches.filter(
          (d) => !normalize(getStringField(d, "authUid")) && !normalizedLower(getStringField(d, "email"))
        );
        if (freeToLink.length === 1) {
          [match] = freeToLink;
        } else {
          return json({ status: "conflict", reason: "multiple_matches" }, 409);
        }
      }
    }

    if (!match) {
      return json({ status: "no_match" });
    }

    const currentAuthUid = normalize(getStringField(match, "authUid"));
    const currentEmail = normalizedLower(getStringField(match, "email"));

    if (currentAuthUid && currentAuthUid !== uid) {
      return json(
        {
          status: "conflict",
          reason: "persona_already_linked",
        },
        409
      );
    }

    if (currentEmail && currentEmail !== email) {
      return json(
        {
          status: "conflict",
          reason: "email_mismatch",
          email: currentEmail,
        },
        409
      );
    }

    await patchPersonaAuth(idToken, match.name, uid, email);
    return json({ status: "linked", docName: match.name });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return json({ error: message }, 500);
  }
}
