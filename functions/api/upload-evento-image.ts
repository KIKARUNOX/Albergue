import { verifyFirebaseIdToken } from "./_firebaseAdmin";

type PagesContext = {
  request: Request;
  env: Record<string, string | undefined>;
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
}

async function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function onRequest(context: PagesContext): Promise<Response> {
  if (context.request.method !== "POST") {
    return json({ error: "Método no permitido" }, 405);
  }

  try {
    await verifyFirebaseIdToken(context.request, context.env);

    const contentType = context.request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return json({ error: "Content-Type debe ser multipart/form-data" }, 400);
    }

    const apiKey = context.env.IMGBB_EVENTOS_API_KEY || "";
    if (!apiKey) {
      return json({ error: "IMGBB_EVENTOS_API_KEY no configurado" }, 500);
    }

    const formData = await context.request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return json({ error: "No se proporcionó archivo" }, 400);
    }

    const fileBuffer = await file.arrayBuffer();
    const base64 = await bufferToBase64(fileBuffer);

    const imgbbForm = new FormData();
    imgbbForm.append("image", base64);
    if (file.name) {
      const nameWithoutExt = file.name.replace(/\.[^.]+$/, "");
      imgbbForm.append("name", nameWithoutExt);
    }

    const response = await fetch(
      `https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        body: imgbbForm,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Error al subir a ImgBB: ${response.status} ${errorText}`
      );
    }

    const result = (await response.json()) as {
      data?: { url?: string };
    };

    const imageUrl = result?.data?.url;
    if (!imageUrl) {
      throw new Error("No se recibió URL de ImgBB");
    }

    return json({ url: imageUrl }, 200);
  } catch (error) {
    console.error("Error subiendo archivo:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";

    if (message.includes("token")) {
      return json({ error: message }, 401);
    }

    return json({ error: message }, 500);
  }
}
