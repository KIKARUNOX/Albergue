export function extraerDriveId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const idFromParam = parsed.searchParams.get("id");
    if (idFromParam) return idFromParam;
  } catch {
    return null;
  }

  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match?.[1]) return match[1];

  const openMatch = url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
  return openMatch?.[1] ?? null;
}

export function construirCandidatas(url: string): string[] {
  const driveId = extraerDriveId(url);
  if (!driveId) return [url];

  return [
    `https://drive.usercontent.google.com/download?id=${driveId}&export=view`,
    `https://drive.google.com/thumbnail?id=${driveId}&sz=w2000`,
    `https://lh3.googleusercontent.com/d/${driveId}=w2000`,
    `https://drive.google.com/uc?export=download&id=${driveId}`,
    `https://drive.google.com/uc?export=view&id=${driveId}`,
    `https://drive.google.com/uc?id=${driveId}`,
  ];
}

export function convertirEnlaceGoogleDrive(url: string): string {
  if (!url) return "";

  const driveId = extraerDriveId(url);
  if (driveId) {
    return `https://drive.google.com/thumbnail?id=${driveId}&sz=w2000`;
  }

  return url;
}

export function convertirUrls(entries: string[]): string[] {
  return entries
    .map((url) => url.trim())
    .map(convertirEnlaceGoogleDrive)
    .filter((url) => url.length > 0);
}
