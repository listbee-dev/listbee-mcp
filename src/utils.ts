import type { ToolMeta } from "./manifest.js";

export interface Deliverable {
  type: string;
  token?: string;
  value?: string;
  label?: string;
}

/**
 * Auto-generate a human-readable title from a snake_case tool name.
 * e.g. "create_listing" → "Create Listing"
 */
export function autoTitle(name: string): string {
  return name
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Build a structured description from manifest metadata.
 * Complex tools get structured markdown; simple ones get a single sentence.
 */
export function buildDescription(meta: ToolMeta): string {
  const parts: string[] = [];

  if (meta.description) {
    parts.push(meta.description.trim());
  }

  if (meta.when_to_use) {
    parts.push(`**When to use:** ${meta.when_to_use}`);
  }

  if (meta.hints && meta.hints.length > 0) {
    parts.push(`**Tips:**\n${meta.hints.map((h) => `- ${h}`).join("\n")}`);
  }

  if (meta.requires_human) {
    parts.push(
      "**Note:** This action requires human intervention. You cannot complete it yourself.",
    );
  }

  return parts.join("\n\n");
}
