import {
  buildFirestoreBaseUrl,
  fetchFirestoreJson,
  getDatabaseId,
  getGoogleDriveAccessToken,
  getProjectId,
} from "./_firebaseAdmin";

type PagesContext = {
  request: Request;
  env: Record<string, string | undefined>;
};

const DRIVE_API_UPLOAD = "https://www.googleapis.com/upload/drive/v3/files";

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

async function uploadToDrive(
  fileBuffer: ArrayBuffer,
  fileName: string,
  mimeType: string,
  accessToken: string,
  folderId: string
): Promise<string> {
  const metadata = {
    name: fileName,
    mimeType: mimeType || "image/jpeg",
    ...(folderId ? { parents: [folderId] } : {}),
  };

  // Crear el body multipart manualmente
  const boundary = "===============7330845974216740156==";
  const metadataPart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(
    metadata
  )}\r\n`;
  const filePart = `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`;
  const endPart = `\r\n--${boundary}--`;

  const metadataBytes = new TextEncoder().encode(metadataPart);
  const filePartBytes = new TextEncoder().encode(filePart);
  const endPartBytes = new TextEncoder().encode(endPart);

  const totalLength =
    metadataBytes.byteLength +
    fileBuffer.byteLength +
    filePartBytes.byteLength +
    endPartBytes.byteLength;
  const body = new Uint8Array(totalLength);

  let offset = 0;
  body.set(new Uint8Array(metadataBytes), offset);
  offset += metadataBytes.byteLength;
  body.set(new Uint8Array(filePartBytes), offset);
  offset += filePartBytes.byteLength;
  body.set(new Uint8Array(fileBuffer), offset);
  offset += fileBuffer.byteLength;
  body.set(new Uint8Array(endPartBytes), offset);

  const response = await fetch(`${DRIVE_API_UPLOAD}?uploadType=multipart`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": `multipart/related; boundary="${boundary}"`,
    },
    body: body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `No se pudo subir archivo a Drive: ${response.status} ${errorText}`
    );
  }

  const fileData = (await response.json()) as {
    id?: string;
    webViewLink?: string;
  };

  if (!fileData.id) {
    throw new Error("No se recibió ID del archivo de Drive");
  }

  // Retornar la URL de miniatura optimizada para embeberse en img tags
  return `https://drive.google.com/thumbnail?id=${fileData.id}&sz=w2000`;
}

export async function onRequest(context: PagesContext): Promise<Response> {
  if (context.request.method !== "POST") {
    return json({ error: "Método no permitido" }, 405);
  }

  try {
    const contentType = context.request.headers.get("content-type") || "";

    if (!contentType.includes("multipart/form-data")) {
      return json({ error: "Content-Type debe ser multipart/form-data" }, 400);
    }

    const formData = await context.request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return json({ error: "No se proporcionó archivo" }, 400);
    }

    const folderId = normalize(context.env.GOOGLE_DRIVE_EVENTOS_FOLDER_ID || "");
    if (!folderId) {
      return json(
        { error: "GOOGLE_DRIVE_EVENTOS_FOLDER_ID no configurado" },
        500
      );
    }

    const accessToken = await getGoogleDriveAccessToken(context.env);
    const timestamp = Date.now();
    const fileName = `evento-${timestamp}-${file.name}`;
    const fileBuffer = await file.arrayBuffer();

    const imageUrl = await uploadToDrive(
      fileBuffer,
      fileName,
      file.type || "image/jpeg",
      accessToken,
      folderId
    );

    return json({ url: imageUrl }, 200);
  } catch (error) {
    console.error("Error subiendo archivo:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return json({ error: message }, 500);
  }
}
