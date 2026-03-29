function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const base = (import.meta.env.VITE_API_BASE_URL ?? "").trim();

  if (!base) {
    return normalizedPath;
  }

  return `${trimTrailingSlash(base)}${normalizedPath}`;
}
