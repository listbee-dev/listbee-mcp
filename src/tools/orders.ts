import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ListBeeClient } from "../client.js";
import { safeTool } from "../types.js";
import type { Deliverable } from "./shared.js";

// --- list_orders ---

export async function handleListOrders(
  client: ListBeeClient,
  args: { cursor?: string; limit?: number },
): Promise<CallToolResult> {
  return safeTool(async () => {
    const params = new URLSearchParams();
    if (args.cursor) params.set("cursor", args.cursor);
    if (args.limit !== undefined) params.set("limit", String(args.limit));
    const qs = params.toString();
    const path = `/v1/orders${qs ? `?${qs}` : ""}`;
    return await client.request("GET", path);
  });
}

// --- get_order ---

export async function handleGetOrder(
  client: ListBeeClient,
  args: { order_id: string },
): Promise<CallToolResult> {
  return safeTool(async () => {
    return await client.request("GET", `/v1/orders/${args.order_id}`);
  });
}

// --- deliver_order ---

export async function handleDeliverOrder(
  client: ListBeeClient,
  args: { order_id: string; deliverables: Deliverable[] },
): Promise<CallToolResult> {
  return safeTool(async () => {
    const data = await client.request(
      "POST",
      `/v1/orders/${args.order_id}/deliver`,
      { deliverables: args.deliverables },
    );
    return data;
  });
}

// --- refund_order ---

export async function handleRefundOrder(
  client: ListBeeClient,
  args: { order_id: string },
): Promise<CallToolResult> {
  return safeTool(async () => {
    return await client.request("POST", `/v1/orders/${args.order_id}/refund`);
  });
}

// --- ship_order ---

export async function handleShipOrder(
  client: ListBeeClient,
  args: Record<string, unknown>,
): Promise<CallToolResult> {
  return safeTool(async () => {
    const { order_id, ...rest } = args;
    const body: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rest)) {
      if (value !== undefined) {
        body[key] = value;
      }
    }
    return await client.request("POST", `/v1/orders/${order_id}/ship`, body);
  });
}
