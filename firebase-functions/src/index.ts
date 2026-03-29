import express, {
  type NextFunction,
  type Request as ExpressRequest,
  type Response as ExpressResponse,
} from "express";
import { onRequest } from "firebase-functions/v2/https";
import {
  onRequestPost as onBootstrapSessionPost,
} from "../../functions/api/bootstrap-session.js";
import {
  onRequestPost as onLinkPersonaPost,
} from "../../functions/api/link-persona.js";
import {
  onRequestPost as onRegisterPersonaPost,
} from "../../functions/api/register-persona.js";

type EnvMap = Record<string, string | undefined>;

type PagesContext = {
  request: Request;
  env: EnvMap;
};

type CloudflarePostHandler = (context: PagesContext) => Promise<Response>;

const app = express();

app.use((req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-methods", "POST, OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type, authorization");
  res.setHeader("vary", "origin");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  next();
});

app.options("*", (_req: ExpressRequest, res: ExpressResponse) => {
  res.status(204).send("");
});

app.use(express.json());

function collectEnv(): EnvMap {
  return {
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_WEB_API_KEY: process.env.FIREBASE_WEB_API_KEY,
    FIRESTORE_DATABASE_ID: process.env.FIRESTORE_DATABASE_ID,
    FIREBASE_SERVICE_ACCOUNT_JSON: process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
    VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID,
    VITE_FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY,
    VITE_FIRESTORE_DATABASE_ID: process.env.VITE_FIRESTORE_DATABASE_ID,
  };
}

function toWebRequest(req: ExpressRequest): Request {
  const host = req.get("host") ?? "localhost";
  const protocol = req.get("x-forwarded-proto") ?? req.protocol ?? "https";
  const url = `${protocol}://${host}${req.originalUrl}`;

  const headers = new Headers();
  Object.entries(req.headers).forEach(([key, value]) => {
    if (typeof value === "string") {
      headers.set(key, value);
      return;
    }

    if (Array.isArray(value)) {
      headers.set(key, value.join(","));
    }
  });

  const body = req.method === "GET" || req.method === "HEAD"
    ? undefined
    : JSON.stringify(req.body ?? {});

  return new Request(url, {
    method: req.method,
    headers,
    body,
  });
}

async function sendWebResponseToExpress(response: Response, res: ExpressResponse): Promise<void> {
  res.status(response.status);
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === "content-length") {
      return;
    }
    res.setHeader(key, value);
  });

  const rawBody = await response.text();
  res.send(rawBody);
}

function attachPostRoute(path: string, handler: CloudflarePostHandler): void {
  app.post(path, async (req: ExpressRequest, res: ExpressResponse) => {
    try {
      const response = await handler({
        request: toWebRequest(req),
        env: collectEnv(),
      });
      await sendWebResponseToExpress(response, res);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal error";
      res.status(500).json({ error: message });
    }
  });

  app.all(path, (_req: ExpressRequest, res: ExpressResponse) => {
    res.status(405).json({ error: "Method Not Allowed" });
  });
}

attachPostRoute("/bootstrap-session", onBootstrapSessionPost);
attachPostRoute("/link-persona", onLinkPersonaPost);
attachPostRoute("/register-persona", onRegisterPersonaPost);

attachPostRoute("/api/bootstrap-session", onBootstrapSessionPost);
attachPostRoute("/api/link-persona", onLinkPersonaPost);
attachPostRoute("/api/register-persona", onRegisterPersonaPost);

app.all("*", (_req: ExpressRequest, res: ExpressResponse) => {
  res.status(404).json({ error: "Not Found" });
});

export const api = onRequest(
  {
    region: "us-central1",
    maxInstances: 10,
  },
  app
);
