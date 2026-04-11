#!/usr/bin/env tsx
/**
 * Validate MCP tool annotations.
 *
 * Checks:
 * 1. Every active tool has explicit annotations
 * 2. destructiveHint:true tools have safety language in description
 * 3. Read-only annotated tools (readOnlyHint:true) map to GET endpoints
 * 4. destructiveHint must not be false for DELETE endpoints
 *
 * Run: npm run validate:annotations
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

const manifestPath = resolve(repoRoot, "mcp-tools.yaml");
const manifest = YAML.parse(readFileSync(manifestPath, "utf-8")) as {
  version: number;
  tools: Array<{
    name: string;
    status: string;
    operation_id: string;
    description?: string;
    annotations?: {
      readOnlyHint?: boolean;
      destructiveHint?: boolean;
      idempotentHint?: boolean;
      openWorldHint?: boolean;
    };
  }>;
};

const specPath = resolve(repoRoot, "openapi.json");
const spec = JSON.parse(readFileSync(specPath, "utf-8")) as {
  paths: Record<string, Record<string, { operationId?: string }>>;
};

const opMethods = new Map<string, string>();
for (const [, pathItem] of Object.entries(spec.paths ?? {})) {
  for (const method of ["get", "post", "put", "patch", "delete"]) {
    const op = pathItem[method];
    if (op?.operationId) {
      opMethods.set(op.operationId, method.toUpperCase());
    }
  }
}

const SAFETY_TERMS = ["irreversible", "permanent", "cannot be undone", "cannot reverse", "cannot be recovered"];

const errors: string[] = [];
const activeTools = manifest.tools.filter((t) => t.status === "active");

for (const tool of activeTools) {
  const name = tool.name;

  if (!tool.annotations) {
    errors.push(`${name}: missing annotations`);
    continue;
  }

  const ann = tool.annotations;

  if (ann.destructiveHint === true) {
    const desc = (tool.description ?? "").toLowerCase();
    const hasSafetyLanguage = SAFETY_TERMS.some((term) => desc.includes(term));
    if (!hasSafetyLanguage) {
      errors.push(
        `${name}: destructiveHint is true but description lacks safety language. ` +
          `Must contain one of: ${SAFETY_TERMS.join(", ")}`,
      );
    }
  }

  if (ann.readOnlyHint === true) {
    const httpMethod = opMethods.get(tool.operation_id);
    if (httpMethod && httpMethod !== "GET") {
      errors.push(`${name}: readOnlyHint is true but maps to ${httpMethod} (expected GET)`);
    }
  }

  if (ann.destructiveHint === false) {
    const httpMethod = opMethods.get(tool.operation_id);
    if (httpMethod === "DELETE") {
      errors.push(`${name}: maps to DELETE endpoint but destructiveHint is false`);
    }
  }
}

if (errors.length > 0) {
  console.error("Annotation validation FAILED:");
  for (const err of errors) {
    console.error(`  - ${err}`);
  }
  process.exit(1);
} else {
  console.log(`Annotation validation passed (${activeTools.length} tools checked).`);
}
