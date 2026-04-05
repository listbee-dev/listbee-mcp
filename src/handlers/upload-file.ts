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

  // Use File to preserve filename in multipart upload
  const file = new File([buffer], filename);
  return client.files.upload(file);
}
