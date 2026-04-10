import type { ListBee } from "listbee";

/**
 * Extract a reasonable filename from a URL path.
 */
function deriveFilename(url: string): string | undefined {
  try {
    const pathname = new URL(url).pathname;
    const segments = pathname.split("/").filter(Boolean);
    const last = segments[segments.length - 1];
    if (last && last.includes(".")) {
      return decodeURIComponent(last);
    }
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Upload a file from a URL.
 * Fetches the URL, converts to Buffer, uploads via SDK.
 */
export async function handleUploadFile(
  client: ListBee,
  args: Record<string, unknown>,
): Promise<unknown> {
  const url = args.url as string;
  const providedFilename = args.filename as string | undefined;
  const purpose = args.purpose as string | undefined;

  // Fetch the file from the provided URL
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch file from ${url}: ${res.status} ${res.statusText}`,
    );
  }

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Derive filename from URL if not provided
  const filename = providedFilename ?? deriveFilename(url) ?? "uploaded-file";

  // Build multipart form data — include purpose if provided
  const formData = new FormData();
  formData.append("file", new File([buffer], filename));
  if (purpose) {
    formData.append("purpose", purpose);
  }

  // Use postMultipart directly to pass purpose (files.upload in SDK < 0.15 doesn't support it)
  return (client as unknown as { postMultipart: (path: string, data: FormData) => Promise<unknown> }).postMultipart("/v1/files", formData);
}
