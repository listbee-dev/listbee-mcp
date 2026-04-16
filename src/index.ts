#!/usr/bin/env node
import { runStdio } from "./transports/stdio.js";

interface ParsedArgs {
  transport: "stdio" | "http";
  apiKey?: string;
  baseUrl?: string;
  port?: number;
  tools?: string;
  help: boolean;
}

function parseArgs(argv: string[]): ParsedArgs {
  const result: ParsedArgs = { transport: "stdio", help: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--transport" && argv[i + 1]) {
      const val = argv[++i];
      if (val !== "stdio" && val !== "http") {
        console.error(`Invalid transport: "${val}". Must be "stdio" or "http".`);
        process.exit(1);
      }
      result.transport = val;
    } else if (arg === "--api-key" && argv[i + 1]) {
      result.apiKey = argv[++i];
    } else if (arg === "--base-url" && argv[i + 1]) {
      result.baseUrl = argv[++i];
    } else if (arg === "--port" && argv[i + 1]) {
      result.port = parseInt(argv[++i], 10);
    } else if (arg === "--tools" && argv[i + 1]) {
      result.tools = argv[++i];
    } else if (arg === "--help" || arg === "-h") {
      result.help = true;
    }
  }
  return result;
}

interface StdioResolvedConfig {
  transport: "stdio";
  apiKey: string | undefined;
  baseUrl: string;
  toolFilter?: Set<string>;
}

interface HttpResolvedConfig {
  transport: "http";
  baseUrl: string;
  port: number;
  toolFilter?: Set<string>;
}

type ResolvedConfig = StdioResolvedConfig | HttpResolvedConfig;

function resolveConfig(
  parsed: ParsedArgs,
  env: Record<string, string | undefined>,
): ResolvedConfig | string {
  const baseUrl = parsed.baseUrl || env.LISTBEE_BASE_URL || "https://api.listbee.so";
  const toolFilter = parsed.tools
    ? new Set(parsed.tools.split(",").map((t) => t.trim()))
    : undefined;

  if (parsed.transport === "http") {
    const port = parsed.port || parseInt(env.PORT || "8080", 10);
    return { transport: "http", baseUrl, port, toolFilter };
  }

  const apiKey = parsed.apiKey || env.LISTBEE_API_KEY;
  if (!apiKey) {
    console.error("No API key — bootstrap-only mode. Call bootstrap_complete to get a key.");
  }
  return { transport: "stdio", apiKey, baseUrl, toolFilter };
}

const HELP_TEXT = `
listbee-mcp — MCP server for ListBee commerce API

Usage:
  npx listbee-mcp [options]

Options:
  --transport <stdio|http>  Transport mode (default: stdio)
  --api-key <key>           API key (required for stdio, or set LISTBEE_API_KEY)
  --base-url <url>          API base URL (default: https://api.listbee.so)
  --port <number>           HTTP port (default: 8080, http mode only)
  --tools <list>            Comma-separated tool names to expose
  -h, --help                Show this help

Transports:
  stdio   Local mode for Claude Desktop, Cursor, Cline (default)
  http    Streamable HTTP for ChatGPT Apps, Claude API Connector, remote agents

Examples:
  npx listbee-mcp --api-key lb_xxx
  npx listbee-mcp --transport http --port 3000
  LISTBEE_API_KEY=lb_xxx npx listbee-mcp
`.trim();

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv.slice(2));

  if (parsed.help) {
    console.log(HELP_TEXT);
    process.exit(0);
  }

  const config = resolveConfig(parsed, process.env);
  if (typeof config === "string") {
    console.error(config);
    console.error("Run with --help for usage.");
    process.exit(1);
  }

  if (config.transport === "http") {
    const { runHttp } = await import("./transports/http.js");
    await runHttp(config);
  } else {
    await runStdio(config);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
