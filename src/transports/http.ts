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

  // Auth middleware — reject unauthenticated requests before MCP sees them
  app.use("/mcp", (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Missing Authorization: Bearer header" });
      return;
    }
    next();
  });

  // MCP endpoint — handles all HTTP methods (GET for SSE, POST for requests, DELETE for close)
  app.all("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    // Route to existing session
    if (sessionId && transports.has(sessionId)) {
      const transport = transports.get(sessionId)!;
      const meta = sessions.get(sessionId);
      if (meta) meta.lastSeenAt = Date.now();
      await transport.handleRequest(req, res, req.body);
      return;
    }

    // New session — must be an initialize request
    if (req.method === "POST" && isInitializeRequest(req.body)) {
      const apiKey = req.headers.authorization!.replace("Bearer ", "");

      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sid) => {
          transports.set(sid, transport);
          sessions.set(sid, {
            createdAt: Date.now(),
            lastSeenAt: Date.now(),
          });
          transport.onclose = () => {
            transports.delete(sid);
            sessions.delete(sid);
            console.error(`[http] Session closed: ${sid}`);
          };
          console.error(`[http] New session: ${sid}`);
        },
      });

      const server = createServer({
        apiKey,
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

  // Health checks
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/ready", (_req, res) => {
    res.json({ status: "ready", sessions: sessions.size });
  });

  startTtlSweep();

  app.listen(config.port, "0.0.0.0", () => {
    console.error(`ListBee MCP server (HTTP) listening on port ${config.port}`);
    console.error(`Endpoint: http://localhost:${config.port}/mcp`);
  });
}
