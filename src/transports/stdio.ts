import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "../server.js";

export interface StdioConfig {
  apiKey: string;
  baseUrl: string;
  toolFilter?: Set<string>;
}

export async function runStdio(config: StdioConfig): Promise<void> {
  const server = createServer({
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    toolFilter: config.toolFilter,
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  const shutdown = async () => {
    await server.close();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
