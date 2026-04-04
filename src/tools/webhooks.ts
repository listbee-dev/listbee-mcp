import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ListBeeClient } from "../client.js";
import { safeTool } from "../types.js";

// --- list_webhooks ---

export async function handleListWebhooks(
  client: ListBeeClient,
): Promise<CallToolResult> {
  return safeTool(async () => {
    return await client.request("GET", "/v1/webhooks");
  });
}

// --- create_webhook ---

export async function handleCreateWebhook(
  client: ListBeeClient,
  args: { name: string; url: string; events?: string[] },
): Promise<CallToolResult> {
  return safeTool(async () => {
    const body: Record<string, unknown> = {
      name: args.name,
      url: args.url,
    };
    if (args.events !== undefined) body.events = args.events;
    return await client.request("POST", "/v1/webhooks", body);
  });
}

// --- update_webhook ---

export async function handleUpdateWebhook(
  client: ListBeeClient,
  args: {
    webhook_id: string;
    name?: string;
    url?: string;
    events?: string[];
    enabled?: boolean;
  },
): Promise<CallToolResult> {
  return safeTool(async () => {
    const { webhook_id, ...rest } = args;
    const body: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rest)) {
      if (value !== undefined) {
        body[key] = value;
      }
    }
    return await client.request("PUT", `/v1/webhooks/${webhook_id}`, body);
  });
}

// --- delete_webhook ---

export async function handleDeleteWebhook(
  client: ListBeeClient,
  args: { webhook_id: string },
): Promise<CallToolResult> {
  return safeTool(async () => {
    await client.request("DELETE", `/v1/webhooks/${args.webhook_id}`);
    return { success: true, message: "Webhook deleted." };
  });
}

// --- list_webhook_events ---

export async function handleListWebhookEvents(
  client: ListBeeClient,
  args: {
    webhook_id: string;
    delivered?: boolean;
    cursor?: string;
    limit?: number;
  },
): Promise<CallToolResult> {
  return safeTool(async () => {
    const params = new URLSearchParams();
    if (args.delivered !== undefined) params.set("delivered", String(args.delivered));
    if (args.cursor) params.set("cursor", args.cursor);
    if (args.limit !== undefined) params.set("limit", String(args.limit));
    const qs = params.toString();
    const path = `/v1/webhooks/${args.webhook_id}/events${qs ? `?${qs}` : ""}`;
    return await client.request("GET", path);
  });
}

// --- retry_webhook_event ---

export async function handleRetryWebhookEvent(
  client: ListBeeClient,
  args: { webhook_id: string; event_id: string },
): Promise<CallToolResult> {
  return safeTool(async () => {
    return await client.request(
      "POST",
      `/v1/webhooks/${args.webhook_id}/events/${args.event_id}/retry`,
    );
  });
}

// --- test_webhook ---

export async function handleTestWebhook(
  client: ListBeeClient,
  args: { webhook_id: string },
): Promise<CallToolResult> {
  return safeTool(async () => {
    return await client.request(
      "POST",
      `/v1/webhooks/${args.webhook_id}/test`,
    );
  });
}
