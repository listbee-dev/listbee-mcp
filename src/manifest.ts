import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

export interface ToolAnnotations {
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
}

export interface ToolMeta {
  type: string;
  operation_id: string;
  name: string;
  category: string;
  priority: number;
  status: string;
  annotations?: ToolAnnotations;
  requires_human?: boolean;
  when_to_use: string;
  description?: string;
  hints?: string[];
  input_example?: Record<string, unknown>;
}

interface ManifestFile {
  version: number;
  tools: ToolMeta[];
}

/**
 * Load mcp-tools.yaml from the package root and return active tools.
 */
export function loadManifest(): ToolMeta[] {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  // In dist/ the yaml is one level up
  const yamlPath = resolve(__dirname, "..", "mcp-tools.yaml");
  const raw = readFileSync(yamlPath, "utf-8");
  const manifest = YAML.parse(raw) as ManifestFile;
  return manifest.tools.filter((t) => t.status === "active");
}

/**
 * Index manifest tools by name for quick lookup.
 */
export function indexManifest(tools: ToolMeta[]): Map<string, ToolMeta> {
  const map = new Map<string, ToolMeta>();
  for (const t of tools) {
    map.set(t.name, t);
  }
  return map;
}
