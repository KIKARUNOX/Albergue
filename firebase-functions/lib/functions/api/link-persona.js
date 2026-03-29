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
function normalizedLower(value) {
    return normalize(value).toLowerCase();
}
function normalizedName(value) {
    return normalize(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\s+/g, " ");
}
function getStringField(doc, field) {
    return doc.fields?.[field]?.stringValue ?? "";
}
async function queryPersonas(baseUrl, accessToken) {
    const endpoint = `${baseUrl}:runQuery`;
    const payload = {
        structuredQuery: {
            from: [{ collectionId: "personas" }],
            limit: 300,
        },
    };
    const rows = await fetchFirestoreJson(endpoint, accessToken, {
        method: "POST",
        body: JSON.stringify(payload),
    });
    return rows.flatMap((row) => (row.document ? [row.document] : []));
}
async function patchPersonaAuth(accessToken, docName, uid, email) {
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
    await fetchFirestoreJson(endpoint, accessToken, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });
}
export async function onRequestPost(context) {
    try {
        const projectId = getProjectId(context.env);
        const databaseId = getDatabaseId(context.env);
        const firestoreBaseUrl = buildFirestoreBaseUrl(projectId, databaseId);
        const caller = await verifyFirebaseIdToken(context.request, context.env);
        const accessToken = await getGoogleAccessToken(context.env);
        const body = (await context.request.json());
        const uid = caller.uid;
        const email = caller.email;
        const nombre = normalize(body.nombre);
        const apellido1 = normalize(body.apellido1);
        const apellido2 = normalize(body.apellido2);
        if (!nombre || !apellido1) {
            return json({ error: "nombre y apellido1 son obligatorios." }, 400);
        }
        const docs = await queryPersonas(firestoreBaseUrl, accessToken);
        const targetNombre = normalizedName(nombre);
        const targetApellido1 = normalizedName(apellido1);
        const targetApellido2 = normalizedName(apellido2);
        const exactMatches = docs.filter((d) => {
            const docNombre = normalizedName(getStringField(d, "nombre"));
            const docApellido1 = normalizedName(getStringField(d, "apellido1"));
            const docApellido2 = normalizedName(getStringField(d, "apellido2"));
            return docNombre === targetNombre && docApellido1 === targetApellido1 && docApellido2 === targetApellido2;
        });
        let match;
        if (exactMatches.length === 1) {
            [match] = exactMatches;
        }
        else if (exactMatches.length > 1) {
            const sameEmail = exactMatches.filter((d) => normalizedLower(getStringField(d, "email")) === email);
            if (sameEmail.length === 1) {
                [match] = sameEmail;
            }
            else {
                const freeToLink = exactMatches.filter((d) => !normalize(getStringField(d, "authUid")) && !normalizedLower(getStringField(d, "email")));
                if (freeToLink.length === 1) {
                    [match] = freeToLink;
                }
                else {
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
            return json({
                status: "conflict",
                reason: "persona_already_linked",
            }, 409);
        }
        if (currentEmail && currentEmail !== email) {
            return json({
                status: "conflict",
                reason: "email_mismatch",
                email: currentEmail,
            }, 409);
        }
        await patchPersonaAuth(accessToken, match.name, uid, email);
        return json({ status: "linked", docName: match.name });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Error interno";
        if (message.toLowerCase().includes("token")) {
            return json({ error: message }, 401);
        }
        return json({ error: message }, 500);
    }
}
