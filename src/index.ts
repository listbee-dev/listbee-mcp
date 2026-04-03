#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

// --- CLI argument parsing ---

interface ParsedArgs {
  apiKey?: string;
  baseUrl?: string;
  tools?: string[];
  help: boolean;
}

function parseArgs(argv: string[]): ParsedArgs {
  const result: ParsedArgs = { help: false };
  const args = argv.slice(2); // skip node and script path

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") {
      result.help = true;
    } else if (arg === "--api-key" && i + 1 < args.length) {
      result.apiKey = args[++i];
    } else if (arg === "--base-url" && i + 1 < args.length) {
      result.baseUrl = args[++i];
    } else if (arg === "--tools" && i + 1 < args.length) {
      result.tools = args[++i].split(",").map((s) => s.trim()).filter(Boolean);
    }
  }

  return result;
}

// --- Config resolution ---

interface Config {
  apiKey: string;
  baseUrl?: string;
  toolFilter?: Set<string>;
}

type ConfigResult =
  | { ok: true; config: Config }
  | { ok: false; error: string };

function resolveConfig(parsed: ParsedArgs): ConfigResult {
  const apiKey = parsed.apiKey ?? process.env.LISTBEE_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error:
        "API key required. Set LISTBEE_API_KEY environment variable or pass --api-key <key>.",
    };
  }

  const baseUrl = parsed.baseUrl ?? process.env.LISTBEE_BASE_URL;
  const toolFilter = parsed.tools ? new Set(parsed.tools) : undefined;

  return { ok: true, config: { apiKey, baseUrl, toolFilter } };
}

// --- Help text ---

const HELP_TEXT = `
listbee-mcp — MCP server for ListBee commerce API

Usage:
  listbee-mcp [options]

Options:
  --api-key <key>    ListBee API key (or set LISTBEE_API_KEY env var)
  --base-url <url>   API base URL (default: https://api.listbee.so)
  --tools <list>     Comma-separated tool names to expose (default: all)
  -h, --help         Show this help text

Examples:
  LISTBEE_API_KEY=lb_xxx listbee-mcp
  listbee-mcp --api-key lb_xxx
  listbee-mcp --api-key lb_xxx --tools create_listing,get_listing,publish_listing

Claude Desktop config (claude_desktop_config.json):
  {
    "mcpServers": {
      "listbee": {
        "command": "npx",
        "args": ["-y", "listbee-mcp"],
        "env": { "LISTBEE_API_KEY": "lb_xxx" }
      }
    }
  }
`.trim();

// --- Main ---

async function main(): Promise<void> {
  // Handle signals gracefully
  process.on("SIGINT", () => process.exit(0));
  process.on("SIGTERM", () => process.exit(0));

  const parsed = parseArgs(process.argv);

  if (parsed.help) {
    console.error(HELP_TEXT);
    process.exit(0);
  }

  const result = resolveConfig(parsed);
  if (!result.ok) {
    console.error(`Error: ${result.error}`);
    process.exit(1);
  }

  const { config } = result;

  console.error("Starting ListBee MCP server...");
  if (config.toolFilter) {
    console.error(`  Tool filter: ${[...config.toolFilter].join(", ")}`);
  }

  const server = createServer({
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    toolFilter: config.toolFilter,
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("ListBee MCP server running on stdio.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
