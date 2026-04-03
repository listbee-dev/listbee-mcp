import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult, ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import type { ZodRawShapeCompat } from "@modelcontextprotocol/sdk/server/zod-compat.js";

import { ListBeeClient } from "./client.js";
import { loadManifest, indexManifest, type ToolMeta } from "./manifest.js";
import { autoTitle, buildDescription } from "./tools/shared.js";

import * as schemas from "./schemas.js";
import {
  handleCreateListing,
  handleGetListing,
  handleUpdateListing,
  handleListListings,
  handlePublishListing,
  handleSetDeliverables,
  handleRemoveDeliverables,
  handleDeleteListing,
} from "./tools/listings.js";
import {
  handleListOrders,
  handleGetOrder,
  handleDeliverOrder,
} from "./tools/orders.js";
import { handleUploadFile } from "./tools/files.js";
import { handleStartStripeConnect } from "./tools/stripe.js";

// Read version from package.json
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  readFileSync(resolve(__dirname, "..", "package.json"), "utf-8"),
) as { version: string };

const SERVER_INSTRUCTIONS = `ListBee is a commerce API for AI agents.
Golden path: create_listing → set_deliverables → get_listing (check readiness) → publish_listing.
Always call get_listing after mutations to inspect readiness.
readiness.sellable tells you if the listing is live.
readiness.actions lists what's missing — kind:api means you can fix it, kind:human means the user must.`;

interface CreateServerOptions {
  apiKey: string;
  baseUrl?: string;
  toolFilter?: Set<string>;
}

/**
 * Annotation defaults per HTTP method pattern.
 */
function annotationsFor(name: string): ToolAnnotations {
  if (name.startsWith("get_") || name.startsWith("list_")) {
    return { readOnlyHint: true, destructiveHint: false, openWorldHint: false };
  }
  if (name.startsWith("delete_") || name === "remove_deliverables") {
    return {
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: false,
    };
  }
  if (name.startsWith("update_") || name === "set_deliverables") {
    return {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    };
  }
  if (name === "upload_file") {
    return {
      readOnlyHint: false,
      destructiveHint: false,
      openWorldHint: true,
    };
  }
  // create, publish, stripe connect
  return {
    readOnlyHint: false,
    destructiveHint: false,
    openWorldHint: false,
  };
}

/**
 * Schema map — links tool names to their Zod input shapes.
 */
const schemaMap: Record<string, ZodRawShapeCompat | undefined> = {
  create_listing: schemas.createListingSchema,
  get_listing: schemas.getListingSchema,
  update_listing: schemas.updateListingSchema,
  list_listings: schemas.listListingsSchema,
  publish_listing: schemas.publishListingSchema,
  set_deliverables: schemas.setDeliverablesSchema,
  remove_deliverables: schemas.removeDeliverablesSchema,
  delete_listing: schemas.deleteListingSchema,
  upload_file: schemas.uploadFileSchema,
  list_orders: schemas.listOrdersSchema,
  get_order: schemas.getOrderSchema,
  deliver_order: schemas.deliverOrderSchema,
  start_stripe_connect: undefined, // no input
};

/**
 * Handler map — links tool names to their handler functions.
 */
function getHandler(
  name: string,
  client: ListBeeClient,
): ((args: Record<string, unknown>) => Promise<CallToolResult>) | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlers: Record<
    string,
    (client: ListBeeClient, args: any) => Promise<CallToolResult>
  > = {
    create_listing: handleCreateListing,
    get_listing: handleGetListing,
    update_listing: handleUpdateListing,
    list_listings: handleListListings,
    publish_listing: handlePublishListing,
    set_deliverables: handleSetDeliverables,
    remove_deliverables: handleRemoveDeliverables,
    delete_listing: handleDeleteListing,
    upload_file: handleUploadFile,
    list_orders: handleListOrders,
    get_order: handleGetOrder,
    deliver_order: handleDeliverOrder,
  };

  const handler = handlers[name];
  if (handler) {
    return (args) => handler(client, args);
  }

  // Special case: start_stripe_connect takes no args
  if (name === "start_stripe_connect") {
    return () => handleStartStripeConnect(client);
  }

  return undefined;
}

/**
 * Create and configure the MCP server with all tools registered.
 */
export function createServer(options: CreateServerOptions): McpServer {
  const client = new ListBeeClient(options.apiKey, options.baseUrl);
  const allTools = loadManifest();
  const metaIndex = indexManifest(allTools);

  const server = new McpServer(
    { name: "listbee-mcp", version: pkg.version },
    {
      capabilities: { tools: {} },
      instructions: SERVER_INSTRUCTIONS,
    },
  );

  // Register each tool
  for (const [toolName, schema] of Object.entries(schemaMap)) {
    // Apply filter if specified
    if (options.toolFilter && !options.toolFilter.has(toolName)) {
      continue;
    }

    const meta = metaIndex.get(toolName);
    if (!meta) {
      console.error(`Warning: no manifest entry for tool "${toolName}", skipping.`);
      continue;
    }

    const description = buildDescription(meta);
    const title = autoTitle(toolName);
    const annotations = annotationsFor(toolName);
    const handler = getHandler(toolName, client);

    if (!handler) {
      console.error(`Warning: no handler for tool "${toolName}", skipping.`);
      continue;
    }

    if (schema) {
      server.tool(toolName, description, schema, annotations, async (args) => {
        return await handler(args as Record<string, unknown>);
      });
    } else {
      // No input schema (e.g. start_stripe_connect)
      server.tool(toolName, description, annotations, async () => {
        return await handler({});
      });
    }

    console.error(`  Registered tool: ${title} (${toolName})`);
  }

  return server;
}
