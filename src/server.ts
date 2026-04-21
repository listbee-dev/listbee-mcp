import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AnySchema } from "@modelcontextprotocol/sdk/server/zod-compat.js";
import { ListBee } from "listbee";

import { loadManifest, indexManifest } from "./manifest.js";
import { autoTitle, buildDescription } from "./utils.js";
import { safeTool } from "./types.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

import { handlers } from "./handlers.js";
import type { Handler } from "./handlers.js";
import { handleStripeConnect } from "./handlers/stripe-connect.js";
import {
  handleBootstrapStart,
  handleBootstrapVerify,
  handleBootstrapPoll,
} from "./handlers/bootstrap.js";
import { handleUploadFile } from "./handlers/files.js";

import { z } from "zod";
import { schemas } from "./generated/schemas.js";

// Read version from package.json
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  readFileSync(resolve(__dirname, "..", "package.json"), "utf-8"),
) as { version: string };

const SERVER_INSTRUCTIONS = `ListBee is a commerce API for AI agents.

Golden path: create_listing → get_listing (check readiness) → publish_listing.
Set deliverable on the listing at create time for managed auto-delivery, or set agent_callback_url for async agent fulfillment.
Always call get_listing after mutations to inspect readiness.
readiness.buyable tells you if the listing is live.
readiness.actions lists what's missing — kind:api means you can fix it, kind:human means the user must.
Every readiness action includes a resolve object with the exact method and endpoint to fix it — follow resolve directly.

When readiness.actions contains kind:human actions:
1. Present resolve.url to the user
2. Explain what they need to do (action.message)
3. Poll get_account (or get_listing) every 30s to detect completion
4. The action disappears from readiness.actions when the user completes it
5. Timeout after 15 minutes and notify the user`;

interface CreateServerOptions {
  apiKey?: string;
  baseUrl?: string;
  toolFilter?: Set<string>;
}

// Bootstrap tools that don't require an API key
const BOOTSTRAP_TOOLS = new Set(["bootstrap_start", "bootstrap_verify"]);
// bootstrap_poll requires auth (it reads account readiness)
const ALL_BOOTSTRAP_TOOL_NAMES = new Set(["bootstrap_start", "bootstrap_verify", "bootstrap_poll"]);

/**
 * Schema map — links tool names to their Zod input schemas (or null for no-input tools).
 * upload_file is added manually since it uses JSON source_url mode only for MCP
 * (multipart not supported in MCP protocol).
 */
const schemaMap: Record<string, AnySchema | null> = {
  ...schemas,
  upload_file: z.object({
    type: z.enum(["public_asset", "private_deliverable"]).describe(
      "File access level: public_asset (cover/gallery images, 10 MB) or private_deliverable (downloadable files, 500 MB).",
    ),
    source_url: z.string().max(2048).describe(
      "HTTPS URL to import. ListBee fetches server-side. Ideal for AI-generated images (DALL-E, Midjourney URLs).",
    ),
  }).strict(),
};

/**
 * Create and configure the MCP server with all tools registered.
 * When apiKey is undefined, only bootstrap tools (start + verify) are registered.
 */
export function createServer(options: CreateServerOptions): McpServer {
  const baseUrl = options.baseUrl ?? "https://api.listbee.so";

  // SDK client only when authenticated
  const client = options.apiKey
    ? new ListBee({ apiKey: options.apiKey, baseUrl })
    : null;

  const allTools = loadManifest();
  const metaIndex = indexManifest(allTools);

  const server = new McpServer(
    { name: "listbee-mcp", version: pkg.version },
    {
      capabilities: { tools: {} },
      instructions: SERVER_INSTRUCTIONS,
    },
  );

  /**
   * All handlers merged: standard handlers + bootstrap + stripe-connect.
   * Bootstrap handlers use baseUrl directly (no SDK client needed for start/verify).
   */
  const allHandlers: Record<string, Handler> = {
    ...handlers,
    // start_stripe_connect is handled separately below (custom CallToolResult)
  };

  // Register each tool
  for (const [toolName, schema] of Object.entries(schemaMap)) {
    // Apply filter if specified
    if (options.toolFilter && !options.toolFilter.has(toolName)) {
      continue;
    }

    const isUnauthBootstrap = BOOTSTRAP_TOOLS.has(toolName);
    const isBootstrapPoll = toolName === "bootstrap_poll";

    // Skip authenticated tools if no client (bootstrap-only mode)
    // bootstrap_start and bootstrap_verify work without a key
    // bootstrap_poll needs a key (authenticates against the issued key)
    if (!isUnauthBootstrap && !isBootstrapPoll && !client) continue;
    if (isBootstrapPoll && !client) continue;

    const meta = metaIndex.get(toolName);
    if (!meta) {
      console.error(`Warning: no manifest entry for tool "${toolName}", skipping.`);
      continue;
    }

    const description = buildDescription(meta);
    const title = autoTitle(toolName);
    const annotations = meta?.annotations ?? {};

    // start_stripe_connect: special case — handler returns CallToolResult directly
    if (toolName === "start_stripe_connect") {
      server.registerTool(
        toolName,
        {
          description,
          annotations,
          ...(schema ? { inputSchema: schema } : {}),
        },
        async () => {
          return handleStripeConnect(client!);
        },
      );
      console.error(`  Registered tool: ${title} (${toolName})`);
      continue;
    }

    // Unauthenticated bootstrap tools (start + verify)
    if (isUnauthBootstrap) {
      const bootstrapHandlers: Record<string, (args: Record<string, unknown>) => Promise<CallToolResult>> = {
        bootstrap_start: (a) => handleBootstrapStart(baseUrl, a),
        bootstrap_verify: (a) => handleBootstrapVerify(baseUrl, a),
      };
      const bootstrapHandler = bootstrapHandlers[toolName];
      if (!bootstrapHandler) continue;
      server.registerTool(
        toolName,
        {
          description,
          annotations,
          ...(schema ? { inputSchema: schema } : {}),
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async (args: any) => bootstrapHandler((args ?? {}) as Record<string, unknown>),
      );
      console.error(`  Registered tool: ${title} (${toolName})`);
      continue;
    }

    // upload_file: authenticated, uses raw fetch (no SDK files namespace)
    if (toolName === "upload_file") {
      if (!client) continue;
      server.registerTool(
        toolName,
        {
          description,
          annotations,
          ...(schema ? { inputSchema: schema } : {}),
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async (args: any) => handleUploadFile(baseUrl, options.apiKey, (args ?? {}) as Record<string, unknown>),
      );
      console.error(`  Registered tool: ${title} (${toolName})`);
      continue;
    }

    // bootstrap_poll: authenticated but handled via custom fetch (not SDK)
    if (isBootstrapPoll) {
      server.registerTool(
        toolName,
        {
          description,
          annotations,
          ...(schema ? { inputSchema: schema } : {}),
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async (args: any) => handleBootstrapPoll(baseUrl, options.apiKey, (args ?? {}) as Record<string, unknown>),
      );
      console.error(`  Registered tool: ${title} (${toolName})`);
      continue;
    }

    const handler = allHandlers[toolName];
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
        return safeTool(() => handler(client!, (args ?? {}) as Record<string, unknown>));
      },
    );

    console.error(`  Registered tool: ${title} (${toolName})`);
  }

  // Startup validation: every manifest tool must be fully wired
  for (const tool of allTools) {
    const name = tool.name;
    if (
      !allHandlers[name] &&
      name !== "start_stripe_connect" &&
      name !== "upload_file" &&
      !ALL_BOOTSTRAP_TOOL_NAMES.has(name)
    ) {
      throw new Error(
        `Startup validation failed: tool "${name}" has no handler registered`,
      );
    }
    if (tool.annotations === undefined) {
      throw new Error(
        `Startup validation failed: tool "${name}" is missing annotations in manifest`,
      );
    }
  }

  return server;
}
