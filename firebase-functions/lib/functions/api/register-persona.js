import { buildFirestoreBaseUrl, fetchFirestoreJson, getDatabaseId, getGoogleAccessToken, getProjectId, verifyFirebaseIdToken, } from "./_firebaseAdmin";
function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "content-type": "application/json; charset=utf-8",
        },
    });
}
function normalize(value) {
    return (value ?? "").trim();
}
function boolField(value) {
    return { booleanValue: value };
}
export async function onRequestPost(context) {
    try {
        const projectId = getProjectId(context.env);
        const databaseId = getDatabaseId(context.env);
        const accessToken = await getGoogleAccessToken(context.env);
        const caller = await verifyFirebaseIdToken(context.request, context.env);
        const body = (await context.request.json());
        const nombre = normalize(body.nombre);
        const apellido1 = normalize(body.apellido1);
        const apellido2 = normalize(body.apellido2);
        if (!nombre || !apellido1) {
            return json({ error: "nombre y apellido1 son obligatorios." }, 400);
        }
        const baseUrl = buildFirestoreBaseUrl(projectId, databaseId);
        const endpoint = `${baseUrl}/personas?documentId=${encodeURIComponent(caller.uid)}`;
        const payload = {
            fields: {
                id: { stringValue: caller.uid },
                authUid: { stringValue: caller.uid },
                email: { stringValue: caller.email },
                role: { stringValue: "joven" },
                permisos: {
                    mapValue: {
                        fields: {
                            dashboard: boolField(true),
                            asistencias: boolField(false),
                            personas: boolField(false),
                            importacion: boolField(false),
                            gestionarPermisos: boolField(false),
                        },
                    },
                },
                nombre: { stringValue: nombre },
                apellido1: { stringValue: apellido1 },
                apellido2: { stringValue: apellido2 },
                puntos: { integerValue: "0" },
                bautizado: boolField(false),
                createdAt: { timestampValue: new Date().toISOString() },
            },
        };
        await fetchFirestoreJson(endpoint, accessToken, {
            method: "POST",
            body: JSON.stringify(payload),
        });
        return json({ status: "created" }, 201);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Error interno";
        if (message.toLowerCase().includes("token")) {
            return json({ error: message }, 401);
        }
        if (message.includes("ALREADY_EXISTS")) {
            return json({ status: "exists" }, 200);
        }
        return json({ error: message }, 500);
    }
}
