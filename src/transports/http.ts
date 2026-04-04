export interface HttpConfig {
  baseUrl: string;
  port: number;
  toolFilter?: Set<string>;
}

export async function runHttp(_config: HttpConfig): Promise<void> {
  throw new Error("HTTP transport not yet implemented");
}
