const GOOGLE_OAUTH_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const FIREBASE_LOOKUP_ENDPOINT = "https://identitytoolkit.googleapis.com/v1/accounts:lookup";
const FIRESTORE_SCOPE = "https://www.googleapis.com/auth/datastore";
const tokenCache = new Map();
function normalize(value) {
    return (value ?? "").trim();
}
function base64UrlEncode(input) {
    const raw = typeof input === "string"
        ? input
        : Array.from(input, (byte) => String.fromCharCode(byte)).join("");
    return btoa(raw).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function pemPrivateKeyToArrayBuffer(privateKeyPem) {
    const base64Body = privateKeyPem
        .replace("-----BEGIN PRIVATE KEY-----", "")
        .replace("-----END PRIVATE KEY-----", "")
        .replace(/\s+/g, "");
    const binary = atob(base64Body);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }
    return bytes.buffer;
}
function getServiceAccountCredentials(env) {
    const serviceAccountJson = normalize(env.FIREBASE_SERVICE_ACCOUNT_JSON);
    if (serviceAccountJson) {
        let parsed;
        try {
            parsed = JSON.parse(serviceAccountJson);
        }
        catch {
            throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON no contiene un JSON valido.");
        }
        const candidate = parsed;
        const clientEmail = normalize(candidate.client_email);
        const privateKey = normalize(candidate.private_key).replace(/\\n/g, "\n");
        if (!clientEmail || !privateKey) {
            throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON debe incluir client_email y private_key.");
        }
        return { clientEmail, privateKey };
    }
    const clientEmail = normalize(env.FIREBASE_CLIENT_EMAIL);
    const privateKey = normalize(env.FIREBASE_PRIVATE_KEY).replace(/\\n/g, "\n");
    if (!clientEmail || !privateKey) {
        throw new Error("Configura FIREBASE_SERVICE_ACCOUNT_JSON o FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY.");
    }
    return { clientEmail, privateKey };
}
export function getProjectId(env) {
    const projectId = normalize(env.FIREBASE_PROJECT_ID ?? env.VITE_FIREBASE_PROJECT_ID);
    if (!projectId) {
        throw new Error("FIREBASE_PROJECT_ID no configurado en el servidor.");
    }
    return projectId;
}
export function getDatabaseId(env) {
    return normalize(env.FIRESTORE_DATABASE_ID ?? env.VITE_FIRESTORE_DATABASE_ID) || "(default)";
}
function getWebApiKey(env) {
    const apiKey = normalize(env.FIREBASE_WEB_API_KEY ?? env.VITE_FIREBASE_API_KEY);
    if (!apiKey) {
        throw new Error("FIREBASE_WEB_API_KEY no configurado en el servidor.");
    }
    return apiKey;
}
async function signJwtAssertion(claims, privateKeyPem) {
    const header = { alg: "RS256", typ: "JWT" };
    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedClaims = base64UrlEncode(JSON.stringify(claims));
    const unsignedJwt = `${encodedHeader}.${encodedClaims}`;
    const key = await crypto.subtle.importKey("pkcs8", pemPrivateKeyToArrayBuffer(privateKeyPem), {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256",
    }, false, ["sign"]);
    const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsignedJwt));
    const encodedSignature = base64UrlEncode(new Uint8Array(signature));
    return `${unsignedJwt}.${encodedSignature}`;
}
export async function getGoogleAccessToken(env) {
    const projectId = getProjectId(env);
    const cached = tokenCache.get(projectId);
    if (cached && cached.expiresAtMs > Date.now() + 30_000) {
        return cached.token;
    }
    const credentials = getServiceAccountCredentials(env);
    const now = Math.floor(Date.now() / 1000);
    const assertion = await signJwtAssertion({
        iss: credentials.clientEmail,
        sub: credentials.clientEmail,
        aud: GOOGLE_OAUTH_TOKEN_ENDPOINT,
        scope: FIRESTORE_SCOPE,
        iat: now,
        exp: now + 3600,
    }, credentials.privateKey);
    const form = new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
    });
    const response = await fetch(GOOGLE_OAUTH_TOKEN_ENDPOINT, {
        method: "POST",
        headers: {
            "content-type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
    });
    if (!response.ok) {
        const body = await response.text();
        throw new Error(`No se pudo obtener access_token de Google: ${response.status} ${body}`);
    }
    const tokenResponse = (await response.json());
    tokenCache.set(projectId, {
        token: tokenResponse.access_token,
        expiresAtMs: Date.now() + Math.max(60, tokenResponse.expires_in - 60) * 1000,
    });
    return tokenResponse.access_token;
}
export async function verifyFirebaseIdToken(request, env) {
    const authorization = request.headers.get("authorization") ?? "";
    const idToken = authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : "";
    if (!idToken) {
        throw new Error("Token de autenticacion requerido.");
    }
    const apiKey = getWebApiKey(env);
    const endpoint = `${FIREBASE_LOOKUP_ENDPOINT}?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "content-type": "application/json",
        },
        body: JSON.stringify({ idToken }),
    });
    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Token de autenticacion invalido: ${response.status} ${body}`);
    }
    const payload = (await response.json());
    const user = payload.users?.[0];
    const uid = normalize(user?.localId);
    const email = normalize(user?.email).toLowerCase();
    if (!uid || !email) {
        throw new Error("No se pudo resolver uid/email del token autenticado.");
    }
    return {
        uid,
        email,
        emailVerified: Boolean(user?.emailVerified),
    };
}
export function buildFirestoreBaseUrl(projectId, databaseId) {
    return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents`;
}
export async function fetchFirestoreJson(url, accessToken, init) {
    const response = await fetch(url, {
        ...init,
        headers: {
            authorization: `Bearer ${accessToken}`,
            "content-type": "application/json",
        },
    });
    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Firestore request fallo: ${response.status} ${body}`);
    }
    return (await response.json());
}
