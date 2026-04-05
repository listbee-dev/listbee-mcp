#!/usr/bin/env tsx
/**
 * MCP Schema Generator
 *
 * Reads openapi.json + mcp-tools.yaml and produces:
 *   src/generated/schemas.ts  — Zod schemas indexed by tool name
 *   src/generated/meta.ts     — typed operation metadata indexed by tool name
 *
 * Run:  npm run generate
 * Check: npm run generate:check  (exits non-zero if output would change)
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { jsonSchemaToZod } from "json-schema-to-zod";
import YAML from "yaml";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OpenApiSpec {
  openapi: string;
  info: { title: string; version: string };
  paths: Record<string, PathItem>;
  components?: { schemas?: Record<string, JsonSchema> };
}

type PathItem = Record<string, Operation | unknown>;

interface Operation {
  operationId: string;
  summary?: string;
  description?: string;
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses: Record<string, unknown>;
}

interface Parameter {
  name: string;
  in: "path" | "query" | "header" | "cookie";
  required?: boolean;
  schema: JsonSchema;
  description?: string;
}

interface RequestBody {
  required?: boolean;
  content: Record<string, { schema: JsonSchema }>;
}

type JsonSchema = Record<string, unknown>;

interface ManifestTool {
  type: string;
  operation_id: string;
  name: string;
  status: string;
  description?: string;
  [key: string]: unknown;
}

interface ManifestFile {
  version: number;
  tools: ManifestTool[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const HTTP_METHODS = ["get", "post", "put", "patch", "delete", "head", "options"] as const;

function isOperation(value: unknown): value is Operation {
  return typeof value === "object" && value !== null && "operationId" in value;
}

/**
 * Resolve a $ref like "#/components/schemas/Foo" against the spec's components.
 */
function resolveRef(ref: string, spec: OpenApiSpec): JsonSchema {
  if (!ref.startsWith("#/")) {
    throw new Error(`Only local $refs supported, got: ${ref}`);
  }
  const parts = ref.slice(2).split("/");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let node: any = spec;
  for (const part of parts) {
    if (node == null || typeof node !== "object") {
      throw new Error(`Cannot resolve $ref: ${ref}`);
    }
    node = node[part];
  }
  if (node == null) {
    throw new Error(`$ref not found: ${ref}`);
  }
  return node as JsonSchema;
}

/**
 * Recursively resolve all $refs in a JSON schema against the spec.
 * Returns a new schema with $refs replaced by their definitions.
 */
function deepResolveRefs(schema: JsonSchema, spec: OpenApiSpec, depth = 0): JsonSchema {
  if (depth > 20) {
    throw new Error("Circular $ref detected (depth limit exceeded)");
  }
  if ("$ref" in schema) {
    const resolved = resolveRef(schema["$ref"] as string, spec);
    return deepResolveRefs(resolved, spec, depth + 1);
  }
  const result: JsonSchema = {};
  for (const [key, value] of Object.entries(schema)) {
    if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === "object" && item !== null ? deepResolveRefs(item as JsonSchema, spec, depth + 1) : item,
      );
    } else if (typeof value === "object" && value !== null) {
      result[key] = deepResolveRefs(value as JsonSchema, spec, depth + 1);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Build a JSON Schema object from path + query parameters.
 */
function buildParamsSchema(params: Parameter[], spec: OpenApiSpec): JsonSchema | null {
  const included = params.filter((p) => p.in === "path" || p.in === "query");
  if (included.length === 0) return null;

  const properties: Record<string, JsonSchema> = {};
  const required: string[] = [];

  for (const param of included) {
    const paramSchema = deepResolveRefs(param.schema, spec);
    // For query params that are anyOf [type, null] and not required, keep as-is (optional)
    // For path params, they are always required strings
    if (param.in === "path") {
      // Path params are always required strings
      properties[param.name] = {
        type: "string",
        description: param.description ?? paramSchema["description"] ?? `Path parameter: ${param.name}`,
      };
      required.push(param.name);
    } else {
      // Query params
      const schema = { ...paramSchema };
      if (param.description) {
        schema["description"] = param.description;
      }
      properties[param.name] = schema;
      if (param.required === true) {
        required.push(param.name);
      }
    }
  }

  const schema: JsonSchema = { type: "object", properties };
  if (required.length > 0) {
    schema["required"] = required;
  }
  return schema;
}

/**
 * Merge two JSON Schema objects (both must be type:object).
 */
function mergeObjectSchemas(a: JsonSchema, b: JsonSchema): JsonSchema {
  const aProps = (a["properties"] as Record<string, JsonSchema>) ?? {};
  const bProps = (b["properties"] as Record<string, JsonSchema>) ?? {};
  const aRequired = (a["required"] as string[]) ?? [];
  const bRequired = (b["required"] as string[]) ?? [];

  const merged: JsonSchema = {
    type: "object",
    properties: { ...aProps, ...bProps },
  };
  const allRequired = [...new Set([...aRequired, ...bRequired])];
  if (allRequired.length > 0) {
    merged["required"] = allRequired;
  }
  return merged;
}

/**
 * Add `.strict()` to top-level object schemas in generated Zod code.
 */
function addStrict(zodCode: string): string {
  if (zodCode.startsWith("z.object(")) {
    return zodCode + ".strict()";
  }
  return zodCode;
}

/**
 * Strip the generated header from file content for comparison.
 * The header is a block of line-comments; it ends at the first blank line.
 */
function stripHeader(content: string): string {
  // The header is a series of // comment lines followed by a blank line.
  // Find the first "\n\n" which marks the end of the header block.
  const idx = content.indexOf("\n\n");
  if (idx === -1) return content;
  return content.slice(idx + 2);
}

// ---------------------------------------------------------------------------
// Main generation logic
// ---------------------------------------------------------------------------

interface GeneratedTool {
  name: string;
  operationId: string;
  method: string;
  path: string;
  description: string;
  zodCode: string | null; // null if no params/body
}

function generate(spec: OpenApiSpec, manifest: ManifestFile): GeneratedTool[] {
  // 1. Index all operations by operationId
  const opIndex = new Map<
    string,
    { method: string; path: string; op: Operation }
  >();

  for (const [path, pathItem] of Object.entries(spec.paths ?? {})) {
    for (const method of HTTP_METHODS) {
      const maybeOp = (pathItem as Record<string, unknown>)[method];
      if (!isOperation(maybeOp)) continue;

      const op = maybeOp;

      // Contract: all operations must have operationId
      if (!op.operationId) {
        throw new Error(`Operation at ${method.toUpperCase()} ${path} is missing operationId`);
      }

      // Contract: no duplicate operationIds
      if (opIndex.has(op.operationId)) {
        throw new Error(`Duplicate operationId: ${op.operationId}`);
      }

      opIndex.set(op.operationId, { method: method.toUpperCase(), path, op });
    }
  }

  // 2. Filter active tools from manifest
  const activeTools = manifest.tools.filter((t) => t.status === "active");

  // 3. Process each tool
  const results: GeneratedTool[] = [];

  for (const tool of activeTools) {
    const operationId = tool.operation_id;

    // Contract: manifest must reference known operations
    if (!opIndex.has(operationId)) {
      throw new Error(
        `Manifest tool '${tool.name}' references unknown operationId: '${operationId}'. ` +
          `Known operationIds: ${[...opIndex.keys()].join(", ")}`,
      );
    }

    const { method, path, op } = opIndex.get(operationId)!;

    // --- Collect parameters ---
    const params: Parameter[] = op.parameters ?? [];

    // --- Collect request body ---
    let bodySchema: JsonSchema | null = null;

    if (op.requestBody?.content) {
      const jsonContent = op.requestBody.content["application/json"];
      if (jsonContent) {
        bodySchema = deepResolveRefs(jsonContent.schema, spec);
      } else {
        // Non-JSON body (e.g. multipart/form-data): skip body, emit warning
        const contentTypes = Object.keys(op.requestBody.content).join(", ");
        console.warn(
          `[warn] ${operationId}: request body content type is '${contentTypes}' (not application/json). ` +
            `Body schema will be skipped for this tool.`,
        );
      }
    }

    // --- Build combined schema ---
    const paramsSchema = buildParamsSchema(params, spec);

    let combinedSchema: JsonSchema | null = null;

    if (paramsSchema && bodySchema) {
      combinedSchema = mergeObjectSchemas(paramsSchema, bodySchema);
    } else if (paramsSchema) {
      combinedSchema = paramsSchema;
    } else if (bodySchema) {
      combinedSchema = bodySchema;
    }
    // If none: tool takes no inputs → zodCode = null

    let zodCode: string | null = null;
    if (combinedSchema !== null) {
      const raw = jsonSchemaToZod(combinedSchema, {
        module: "none",
        noImport: true,
        zodVersion: 3,
      });
      zodCode = addStrict(raw);
    }

    results.push({
      name: tool.name,
      operationId,
      method,
      path,
      description: tool.description ?? op.description ?? op.summary ?? "",
      zodCode,
    });
  }

  // Sort alphabetically for deterministic output
  results.sort((a, b) => a.name.localeCompare(b.name));

  return results;
}

// ---------------------------------------------------------------------------
// File rendering
// ---------------------------------------------------------------------------

function makeHeader(openapiVersion: string, checksum: string): string {
  return [
    "// GENERATED FILE — DO NOT EDIT",
    "// source: openapi.json + mcp-tools.yaml",
    "// Regenerate with: npm run generate",
    `// openapi_version: ${openapiVersion}`,
    `// generated_at: ${new Date().toISOString()}`,
    `// sha256: ${checksum}`,
  ].join("\n");
}

function renderSchemasFile(tools: GeneratedTool[], header: string): string {
  const lines: string[] = [header, "", 'import { z } from "zod";', ""];

  lines.push("// Tool name → Zod schema (null means the tool takes no inputs)");
  lines.push("export const schemas = {");

  for (const tool of tools) {
    if (tool.zodCode === null) {
      lines.push(`  ${tool.name}: null,`);
    } else {
      lines.push(`  ${tool.name}: ${tool.zodCode},`);
    }
  }

  lines.push("} as const;");
  lines.push("");
  lines.push("export type SchemaMap = typeof schemas;");
  lines.push("");

  return lines.join("\n");
}

function renderMetaFile(tools: GeneratedTool[], header: string): string {
  const lines: string[] = [header, ""];

  lines.push("export interface ToolMeta {");
  lines.push("  operationId: string;");
  lines.push("  method: string;");
  lines.push("  path: string;");
  lines.push("  description: string;");
  lines.push("}");
  lines.push("");
  lines.push("export const meta: Record<string, ToolMeta> = {");

  for (const tool of tools) {
    const desc = tool.description.replace(/\n/g, " ").replace(/"/g, '\\"').trim();
    lines.push(`  ${tool.name}: {`);
    lines.push(`    operationId: "${tool.operationId}",`);
    lines.push(`    method: "${tool.method}",`);
    lines.push(`    path: "${tool.path}",`);
    lines.push(`    description: "${desc}",`);
    lines.push(`  },`);
  }

  lines.push("};");
  lines.push("");

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

const specArgIdx = process.argv.indexOf("--spec");
const openapiPath = specArgIdx !== -1 && process.argv[specArgIdx + 1]
  ? resolve(process.argv[specArgIdx + 1])
  : resolve(repoRoot, "openapi.json");

const manifestArgIdx = process.argv.indexOf("--manifest");
const manifestPath = manifestArgIdx !== -1 && process.argv[manifestArgIdx + 1]
  ? resolve(process.argv[manifestArgIdx + 1])
  : resolve(repoRoot, "mcp-tools.yaml");
const generatedDir = resolve(repoRoot, "src", "generated");
const schemasOutPath = resolve(generatedDir, "schemas.ts");
const metaOutPath = resolve(generatedDir, "meta.ts");

const isCheckMode = process.argv.includes("--check");

// Load inputs
const spec: OpenApiSpec = JSON.parse(readFileSync(openapiPath, "utf-8"));
const manifestRaw = readFileSync(manifestPath, "utf-8");
const manifest: ManifestFile = YAML.parse(manifestRaw) as ManifestFile;

// Compute checksum over inputs
const checksum = createHash("sha256")
  .update(readFileSync(openapiPath))
  .update(manifestRaw)
  .digest("hex");

const openapiVersion = spec.info?.version ?? "unknown";

// Run generation
const tools = generate(spec, manifest);

const schemasContent = renderSchemasFile(tools, makeHeader(openapiVersion, checksum));
const metaContent = renderMetaFile(tools, makeHeader(openapiVersion, checksum));

if (isCheckMode) {
  // Compare generated output to existing files (ignoring header timestamps)
  let hasChanges = false;

  for (const [filePath, newContent, label] of [
    [schemasOutPath, schemasContent, "schemas.ts"],
    [metaOutPath, metaContent, "meta.ts"],
  ] as [string, string, string][]) {
    if (!existsSync(filePath)) {
      console.error(`[check] MISSING: ${label} does not exist. Run: npm run generate`);
      hasChanges = true;
      continue;
    }
    const existing = readFileSync(filePath, "utf-8");
    if (stripHeader(existing) !== stripHeader(newContent)) {
      console.error(`[check] OUT OF DATE: ${label} is not up to date. Run: npm run generate`);
      hasChanges = true;
    } else {
      console.log(`[check] OK: ${label}`);
    }
  }

  if (hasChanges) {
    process.exit(1);
  }
  console.log("[check] All generated files are up to date.");
} else {
  // Write files
  if (!existsSync(generatedDir)) {
    mkdirSync(generatedDir, { recursive: true });
  }
  writeFileSync(schemasOutPath, schemasContent, "utf-8");
  writeFileSync(metaOutPath, metaContent, "utf-8");

  console.log(`Generated ${tools.length} tools:`);
  for (const t of tools) {
    const schemaStatus = t.zodCode === null ? "(no inputs)" : "✓";
    console.log(`  ${schemaStatus} ${t.name} — ${t.method} ${t.path}`);
  }
  console.log(`\nWrote: ${schemasOutPath}`);
  console.log(`Wrote: ${metaOutPath}`);
}
