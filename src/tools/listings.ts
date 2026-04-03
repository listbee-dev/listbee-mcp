import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ListBeeClient } from "../client.js";
import { safeTool } from "../types.js";
import type { Deliverable } from "./shared.js";

// --- create_listing ---

export async function handleCreateListing(
  client: ListBeeClient,
  args: {
    name: string;
    price: number;
    description?: string;
    tagline?: string;
    stock?: number;
    cover?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<CallToolResult> {
  return safeTool(async () => {
    const body: Record<string, unknown> = {
      name: args.name,
      price: args.price,
    };
    if (args.description !== undefined) body.description = args.description;
    if (args.tagline !== undefined) body.tagline = args.tagline;
    if (args.stock !== undefined) body.stock = args.stock;
    if (args.cover !== undefined) body.cover = args.cover;
    if (args.metadata !== undefined) body.metadata = args.metadata;

    const data = await client.request("POST", "/v1/listings", body);
    return data;
  });
}

// --- get_listing ---

export async function handleGetListing(
  client: ListBeeClient,
  args: { listing_id: string },
): Promise<CallToolResult> {
  return safeTool(async () => {
    return await client.request("GET", `/v1/listings/${args.listing_id}`);
  });
}

// --- update_listing ---

export async function handleUpdateListing(
  client: ListBeeClient,
  args: {
    listing_id: string;
    name?: string;
    slug?: string;
    price?: number;
    description?: string;
    tagline?: string;
    stock?: number;
    cover?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<CallToolResult> {
  return safeTool(async () => {
    const { listing_id, ...rest } = args;
    // Only include fields that were explicitly provided
    const body: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rest)) {
      if (value !== undefined) {
        body[key] = value;
      }
    }
    return await client.request("PUT", `/v1/listings/${listing_id}`, body);
  });
}

// --- list_listings ---

export async function handleListListings(
  client: ListBeeClient,
  args: { cursor?: string; limit?: number },
): Promise<CallToolResult> {
  return safeTool(async () => {
    const params = new URLSearchParams();
    if (args.cursor) params.set("cursor", args.cursor);
    if (args.limit !== undefined) params.set("limit", String(args.limit));
    const qs = params.toString();
    const path = `/v1/listings${qs ? `?${qs}` : ""}`;
    return await client.request("GET", path);
  });
}

// --- publish_listing ---

export async function handlePublishListing(
  client: ListBeeClient,
  args: { listing_id: string },
): Promise<CallToolResult> {
  return safeTool(async () => {
    const data = await client.request(
      "POST",
      `/v1/listings/${args.listing_id}/publish`,
    );
    return data;
  });
}

// --- set_deliverables ---

export async function handleSetDeliverables(
  client: ListBeeClient,
  args: { listing_id: string; deliverables: Deliverable[] },
): Promise<CallToolResult> {
  return safeTool(async () => {
    return await client.request(
      "PUT",
      `/v1/listings/${args.listing_id}/deliverables`,
      { deliverables: args.deliverables },
    );
  });
}

// --- remove_deliverables ---

export async function handleRemoveDeliverables(
  client: ListBeeClient,
  args: { listing_id: string },
): Promise<CallToolResult> {
  return safeTool(async () => {
    await client.request(
      "DELETE",
      `/v1/listings/${args.listing_id}/deliverables`,
    );
    return { success: true, message: "Deliverables removed." };
  });
}

// --- delete_listing ---

export async function handleDeleteListing(
  client: ListBeeClient,
  args: { listing_id: string },
): Promise<CallToolResult> {
  return safeTool(async () => {
    await client.request("DELETE", `/v1/listings/${args.listing_id}`);
    return { success: true, message: "Listing deleted." };
  });
}
