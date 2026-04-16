import { randomUUID } from "node:crypto";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { createServer } from "../server.js";

export interface HttpConfig {
  baseUrl: string;
  port: number;
  toolFilter?: Set<string>;
}

interface SessionMeta {
  createdAt: number;
  lastSeenAt: number;
  isBootstrap: boolean; // true when initialized without a Bearer — only bootstrap tools registered
}

const transports = new Map<string, StreamableHTTPServerTransport>();
const sessions = new Map<string, SessionMeta>();

const SESSION_TTL_MS = 30 * 60 * 1000;
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;

function startTtlSweep(): void {
  setInterval(() => {
    const cutoff = Date.now() - SESSION_TTL_MS;
    for (const [id, meta] of sessions) {
      if (meta.lastSeenAt < cutoff) {
        const transport = transports.get(id);
        if (transport) {
          transport.close();
          transports.delete(id);
        }
        sessions.delete(id);
        console.error(`[http] Evicted idle session ${id}`);
      }
    }
  }, SWEEP_INTERVAL_MS);
}

export async function runHttp(config: HttpConfig): Promise<void> {
  // Bind to 0.0.0.0 for container/remote deployments — DNS rebinding protection
  // is not applied for non-localhost hosts, which is correct for remote MCP.
  const app = createMcpExpressApp({ host: "0.0.0.0" });

  // NO blanket auth middleware — auth mode is determined per session at initialize.
  // Bootstrap sessions (no Bearer at init) only expose bootstrap tools; auth skipped for them.
  // Authenticated sessions require Bearer on every subsequent call.

  // MCP endpoint — handles all HTTP methods (GET for SSE, POST for requests, DELETE for close)
  app.all("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    // Route to existing session — auth required only if session was created with a key
    if (sessionId && transports.has(sessionId)) {
      const meta = sessions.get(sessionId);
      if (meta && !meta.isBootstrap) {
        const auth = req.headers.authorization;
        if (!auth?.startsWith("Bearer ")) {
          res.status(401).json({ error: "Missing Authorization: Bearer header" });
          return;
        }
      }
      const transport = transports.get(sessionId)!;
      if (meta) meta.lastSeenAt = Date.now();
      await transport.handleRequest(req, res, req.body);
      return;
    }

    // New session (initialize) — auth optional; keyless = bootstrap-only mode
    if (req.method === "POST" && isInitializeRequest(req.body)) {
      const auth = req.headers.authorization;
      const apiKey = auth?.startsWith("Bearer ") ? auth.replace("Bearer ", "") : undefined;
      const isBootstrap = !apiKey;

      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sid) => {
          transports.set(sid, transport);
          sessions.set(sid, { createdAt: Date.now(), lastSeenAt: Date.now(), isBootstrap });
          transport.onclose = () => {
            transports.delete(sid);
            sessions.delete(sid);
            console.error(`[http] Session closed: ${sid}`);
          };
          console.error(`[http] New session: ${sid} (${isBootstrap ? "bootstrap-only" : "authenticated"})`);
        },
      });

      const server = createServer({
        apiKey,  // undefined = bootstrap-only tools
        baseUrl: config.baseUrl,
        toolFilter: config.toolFilter,
      });
      await server.connect(transport);

      await transport.handleRequest(req, res, req.body);
      return;
    }

    res.status(400).json({
      error: "Bad request — missing Mcp-Session-Id or not an initialize request",
    });
  });

  // Root — landing page instead of Express 404
  app.get("/", (_req, res) => {
    res.json({
      name: "ListBee MCP",
      description: "Commerce API for AI agents",
      endpoint: "/mcp",
      transport: "streamable-http",
      docs: "https://docs.listbee.so",
      package: "npx listbee-mcp",
    });
  });

  // Health checks
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/ready", (_req, res) => {
    res.json({ status: "ready", sessions: sessions.size });
  });

  startTtlSweep();

  // Graceful shutdown
  const server = app.listen(config.port, "0.0.0.0", () => {
    console.error(`ListBee MCP server (HTTP) listening on port ${config.port}`);
    console.error(`Endpoint: http://localhost:${config.port}/mcp`);
  });

  const shutdown = () => {
    console.error("\nShutting down...");
    for (const [id, transport] of transports) {
      transport.close();
      transports.delete(id);
      sessions.delete(id);
    }
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5000);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
