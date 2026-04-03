import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ListBeeClient } from "../client.js";
import { safeTool } from "../types.js";

// --- upload_file ---

export async function handleUploadFile(
  client: ListBeeClient,
  args: { url: string; filename?: string },
): Promise<CallToolResult> {
  return safeTool(async () => {
    // Fetch the file from the provided URL
    const res = await fetch(args.url);
    if (!res.ok) {
      throw new Error(
        `Failed to fetch file from ${args.url}: ${res.status} ${res.statusText}`,
      );
    }

    const buffer = new Uint8Array(await res.arrayBuffer());

    // Derive filename from URL if not provided
    const filename =
      args.filename ?? deriveFilename(args.url) ?? "uploaded-file";

    const data = await client.uploadFile(buffer, filename);
    return data;
  });
}

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
