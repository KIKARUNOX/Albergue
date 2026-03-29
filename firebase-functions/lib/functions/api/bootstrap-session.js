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
function normalizeRole(rawRole) {
    const role = normalize(rawRole).toLowerCase();
    if (role === "coordinador" || role === "cordinador")
        return "coordinador";
    if (role === "lider")
        return "lider";
    return "joven";
}
function defaultPermisosByRole(role) {
    if (role === "coordinador") {
        return {
            dashboard: true,
            asistencias: true,
            personas: true,
            importacion: false,
            gestionarPermisos: true,
        };
    }
    if (role === "lider") {
        return {
            dashboard: true,
            asistencias: true,
            personas: true,
            importacion: true,
            gestionarPermisos: true,
        };
    }
    return {
        dashboard: true,
        asistencias: false,
        personas: false,
        importacion: false,
        gestionarPermisos: false,
    };
}
function fromFirestoreValue(value) {
    if (!value)
        return undefined;
    if ("stringValue" in value)
        return value.stringValue;
    if ("integerValue" in value)
        return Number(value.integerValue);
    if ("doubleValue" in value)
        return value.doubleValue;
    if ("booleanValue" in value)
        return value.booleanValue;
    if ("timestampValue" in value)
        return value.timestampValue;
    if ("nullValue" in value)
        return null;
    if ("arrayValue" in value) {
        return (value.arrayValue.values ?? []).map((item) => fromFirestoreValue(item));
    }
    if ("mapValue" in value) {
        const entries = Object.entries(value.mapValue.fields ?? {}).map(([key, nested]) => [key, fromFirestoreValue(nested)]);
        return Object.fromEntries(entries);
    }
    return undefined;
}
function docIdFromName(name) {
    const parts = name.split("/");
    return parts[parts.length - 1] ?? "";
}
async function runQuery(baseUrl, accessToken, body) {
    const rows = await fetchFirestoreJson(`${baseUrl}:runQuery`, accessToken, {
        method: "POST",
        body: JSON.stringify(body),
    });
    return rows.flatMap((row) => (row.document ? [row.document] : []));
}
async function queryPersonaByField(baseUrl, accessToken, fieldPath, value) {
    const docs = await runQuery(baseUrl, accessToken, {
        structuredQuery: {
            from: [{ collectionId: "personas" }],
            where: {
                fieldFilter: {
                    field: { fieldPath },
                    op: "EQUAL",
                    value: { stringValue: value },
                },
            },
            limit: 1,
        },
    });
    return docs[0] ?? null;
}
function personaFromDoc(doc) {
    const fields = Object.entries(doc.fields ?? {}).map(([key, value]) => [key, fromFirestoreValue(value)]);
    return Object.fromEntries(fields);
}
async function patchPersonaIdentifiers(accessToken, docName, uid, email) {
    const endpoint = `https://firestore.googleapis.com/v1/${docName}`
        + "?updateMask.fieldPaths=authUid"
        + "&updateMask.fieldPaths=id"
        + "&updateMask.fieldPaths=email";
    await fetchFirestoreJson(endpoint, accessToken, {
        method: "PATCH",
        body: JSON.stringify({
            fields: {
                authUid: { stringValue: uid },
                id: { stringValue: uid },
                email: { stringValue: email },
            },
        }),
    });
}
async function upsertUsuarioDoc(accessToken, projectId, databaseId, uid, email, role, permisos, personaId) {
    const endpoint = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/usuarios/${uid}`
        + "?updateMask.fieldPaths=uid"
        + "&updateMask.fieldPaths=authUid"
        + "&updateMask.fieldPaths=email"
        + "&updateMask.fieldPaths=role"
        + "&updateMask.fieldPaths=permisos"
        + "&updateMask.fieldPaths=personaId"
        + "&updateMask.fieldPaths=updatedAt";
    const permisosFields = Object.fromEntries(Object.entries(permisos).map(([key, value]) => [key, { booleanValue: value }]));
    await fetchFirestoreJson(endpoint, accessToken, {
        method: "PATCH",
        body: JSON.stringify({
            fields: {
                uid: { stringValue: uid },
                authUid: { stringValue: uid },
                email: { stringValue: email },
                role: { stringValue: role },
                permisos: { mapValue: { fields: permisosFields } },
                personaId: { stringValue: personaId },
                updatedAt: { timestampValue: new Date().toISOString() },
            },
        }),
    });
}
export async function onRequestPost(context) {
    try {
        const projectId = getProjectId(context.env);
        const databaseId = getDatabaseId(context.env);
        const baseUrl = buildFirestoreBaseUrl(projectId, databaseId);
        const accessToken = await getGoogleAccessToken(context.env);
        const caller = await verifyFirebaseIdToken(context.request, context.env);
        let personaDoc = await queryPersonaByField(baseUrl, accessToken, "authUid", caller.uid);
        if (!personaDoc) {
            personaDoc = await queryPersonaByField(baseUrl, accessToken, "email", caller.email);
            if (personaDoc) {
                await patchPersonaIdentifiers(accessToken, personaDoc.name, caller.uid, caller.email);
            }
        }
        if (!personaDoc) {
            personaDoc = await queryPersonaByField(baseUrl, accessToken, "id", caller.uid);
            if (personaDoc) {
                await patchPersonaIdentifiers(accessToken, personaDoc.name, caller.uid, caller.email);
            }
        }
        if (!personaDoc) {
            await upsertUsuarioDoc(accessToken, projectId, databaseId, caller.uid, caller.email, "joven", defaultPermisosByRole("joven"), "");
            return json({ persona: null, personaDocId: "" });
        }
        const personaData = personaFromDoc(personaDoc);
        const role = normalizeRole(typeof personaData.role === "string" ? personaData.role : undefined);
        const permisos = {
            ...defaultPermisosByRole(role),
            ...(personaData.permisos ?? {}),
        };
        const personaDocId = docIdFromName(personaDoc.name);
        await upsertUsuarioDoc(accessToken, projectId, databaseId, caller.uid, caller.email, role, permisos, personaDocId);
        return json({
            persona: {
                ...personaData,
                authUid: caller.uid,
                email: caller.email,
            },
            personaDocId,
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Error interno";
        if (message.toLowerCase().includes("token")) {
            return json({ error: message }, 401);
        }
        return json({ error: message }, 500);
    }
}
