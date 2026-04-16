import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AnySchema } from "@modelcontextprotocol/sdk/server/zod-compat.js";
import { z } from "zod";
import { ListBee } from "listbee";

import { loadManifest, indexManifest } from "./manifest.js";
import { autoTitle, buildDescription } from "./utils.js";
import { safeTool } from "./types.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

import { handlers } from "./handlers.js";
import type { Handler } from "./handlers.js";
import { handleUploadFile } from "./handlers/upload-file.js";
import { handleStripeConnect } from "./handlers/stripe-connect.js";
import {
  handleBootstrapStart,
  handleBootstrapVerify,
  handleBootstrapComplete,
} from "./handlers/bootstrap.js";

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

Golden path: create_listing → set_deliverables → get_listing (check readiness) → publish_listing.
Always call get_listing after mutations to inspect readiness.
readiness.sellable tells you if the listing is live.
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

const BOOTSTRAP_TOOLS = new Set(["bootstrap_start", "bootstrap_verify", "bootstrap_complete"]);

// Manual override for upload_file: the API uses multipart upload but the MCP tool
// takes a URL + filename and handles the fetch-and-upload server-side.
const uploadFileSchema = z.object({
  url: z.string().url().describe(
    "Public URL of a file to upload. The server fetches this URL — only provide URLs from the user or trusted sources.",
  ),
  filename: z.string().optional().describe(
    "Filename for the uploaded file. If omitted, derived from the URL.",
  ),
  purpose: z.enum(["deliverable", "cover", "avatar"]).optional().describe(
    "File purpose — controls size and MIME limits. 'deliverable' (default, up to 25 MB): listing content. 'cover' (up to 5 MB): listing cover image. 'avatar' (up to 2 MB): store avatar.",
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
 * Create and configure the MCP server with all tools registered.
 * When apiKey is undefined, only bootstrap tools are registered (no SDK client created).
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
   * All handlers merged: standard handlers + custom handlers + bootstrap wrappers.
   * Bootstrap wrappers conform to Handler type (client param ignored).
   */
  const allHandlers: Record<string, Handler> = {
    ...handlers,
    upload_file: handleUploadFile,
    bootstrap_start: (_c, a) => handleBootstrapStart(baseUrl, a) as Promise<unknown>,
    bootstrap_verify: (_c, a) => handleBootstrapVerify(baseUrl, a) as Promise<unknown>,
    bootstrap_complete: (_c, a) => handleBootstrapComplete(baseUrl, a) as Promise<unknown>,
    // start_stripe_connect is handled separately below (custom CallToolResult)
  };

  // Register each tool
  for (const [toolName, schema] of Object.entries(schemaMap)) {
    // Apply filter if specified
    if (options.toolFilter && !options.toolFilter.has(toolName)) {
      continue;
    }

    const isBootstrap = BOOTSTRAP_TOOLS.has(toolName);

    // Skip authenticated tools if no client (bootstrap-only mode)
    if (!isBootstrap && !client) continue;

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

    // Bootstrap tools: special case — handler returns CallToolResult directly, no client needed
    if (isBootstrap) {
      const bootstrapHandlers: Record<string, (args: Record<string, unknown>) => Promise<CallToolResult>> = {
        bootstrap_start: (a) => handleBootstrapStart(baseUrl, a),
        bootstrap_verify: (a) => handleBootstrapVerify(baseUrl, a),
        bootstrap_complete: (a) => handleBootstrapComplete(baseUrl, a),
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
    if (!allHandlers[name] && name !== "start_stripe_connect") {
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
