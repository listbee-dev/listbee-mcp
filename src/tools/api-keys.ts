import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ListBeeClient } from "../client.js";
import { safeTool } from "../types.js";

// --- list_api_keys ---

export async function handleListApiKeys(
  client: ListBeeClient,
): Promise<CallToolResult> {
  return safeTool(async () => {
    return await client.request("GET", "/v1/api-keys");
  });
}

// --- create_api_key ---

export async function handleCreateApiKey(
  client: ListBeeClient,
  args: { name: string },
): Promise<CallToolResult> {
  return safeTool(async () => {
    return await client.request("POST", "/v1/api-keys", { name: args.name });
  });
}

// --- delete_api_key ---

export async function handleDeleteApiKey(
  client: ListBeeClient,
  args: { key_id: string },
): Promise<CallToolResult> {
  return safeTool(async () => {
    await client.request("DELETE", `/v1/api-keys/${args.key_id}`);
    return { success: true, message: "API key deleted." };
  });
}
