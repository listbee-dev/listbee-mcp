import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult, ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import type { AnySchema } from "@modelcontextprotocol/sdk/server/zod-compat.js";
import { z } from "zod";

import { ListBeeClient } from "./client.js";
import { loadManifest, indexManifest } from "./manifest.js";
import { autoTitle, buildDescription } from "./tools/shared.js";

import { schemas } from "./generated/schemas.js";
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
  handleShipOrder,
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
  if (name.startsWith("update_") || name === "set_deliverables" || name === "ship_order") {
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

// Manual override for upload_file: the API uses multipart upload but the MCP tool
// takes a URL + filename and handles the fetch-and-upload server-side.
const uploadFileSchema = z.object({
  url: z.string().url().describe(
    "Public URL of a file to upload. The server fetches this URL — only provide URLs from the user or trusted sources.",
  ),
  filename: z.string().optional().describe(
    "Filename for the uploaded file. If omitted, derived from the URL.",
  ),
});

/**
 * Schema map — links tool names to their Zod input schemas (or null for no-input tools).
 * Derived from generated schemas with manual overrides where needed.
 */
const schemaMap: Record<string, AnySchema | null> = {
  ...schemas,
  upload_file: uploadFileSchema,
};

/**
 * Handler map — links tool names to their handler functions.
 */
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
  ship_order: (c, a) => handleShipOrder(c, a),
  start_stripe_connect: (c) => handleStartStripeConnect(c) as any,
};

function getHandler(
  name: string,
  client: ListBeeClient,
): ((args: Record<string, unknown>) => Promise<CallToolResult>) | undefined {
  const handler = handlers[name];
  if (handler) {
    return (args) => handler(client, args);
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

    server.registerTool(
      toolName,
      {
        description,
        annotations,
        ...(schema ? { inputSchema: schema } : {}),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (args: any) => {
        return await handler((args ?? {}) as Record<string, unknown>);
      },
    );

    console.error(`  Registered tool: ${title} (${toolName})`);
  }

  // Startup validation: every manifest tool must be fully wired
  for (const tool of allTools) {
    const name = tool.name;
    if (!handlers[name]) {
      throw new Error(
        `Startup validation failed: tool "${name}" has no handler registered`,
      );
    }
    const ann = annotationsFor(name);
    if (ann.readOnlyHint === undefined) {
      throw new Error(
        `Startup validation failed: tool "${name}" is missing readOnlyHint annotation`,
      );
    }
  }

  return server;
}
