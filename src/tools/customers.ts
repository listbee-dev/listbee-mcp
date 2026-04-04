import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ListBeeClient } from "../client.js";
import { safeTool } from "../types.js";

// --- list_customers ---

export async function handleListCustomers(
  client: ListBeeClient,
  args: {
    email?: string;
    created_after?: string;
    created_before?: string;
    cursor?: string;
    limit?: number;
  },
): Promise<CallToolResult> {
  return safeTool(async () => {
    const params = new URLSearchParams();
    if (args.email) params.set("email", args.email);
    if (args.created_after) params.set("created_after", args.created_after);
    if (args.created_before) params.set("created_before", args.created_before);
    if (args.cursor) params.set("cursor", args.cursor);
    if (args.limit !== undefined) params.set("limit", String(args.limit));
    const qs = params.toString();
    const path = `/v1/customers${qs ? `?${qs}` : ""}`;
    return await client.request("GET", path);
  });
}

// --- get_customer ---

export async function handleGetCustomer(
  client: ListBeeClient,
  args: { customer_id: string },
): Promise<CallToolResult> {
  return safeTool(async () => {
    return await client.request("GET", `/v1/customers/${args.customer_id}`);
  });
}
