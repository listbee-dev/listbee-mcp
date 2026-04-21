/**
 * upload_file handler — JSON source_url mode only.
 * MCP agents can't send multipart, so this uses the JSON import path.
 * Uses raw fetch since the archived SDK doesn't have a files namespace.
 */

import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export async function handleUploadFile(
  baseUrl: string,
  apiKey: string | undefined,
  args: Record<string, unknown>,
): Promise<CallToolResult> {
  if (!apiKey) {
    return {
      content: [{ type: "text", text: JSON.stringify({ error: "API key required" }) }],
      isError: true,
    };
  }

  const body = {
    type: args.type,
    source_url: args.source_url,
  };

  const resp = await fetch(`${baseUrl}/v1/files`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await resp.json();

  if (!resp.ok) {
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      isError: true,
    };
  }

  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}
