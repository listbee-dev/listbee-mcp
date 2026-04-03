import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

/**
 * Error thrown by ListBeeClient on non-2xx responses.
 */
export class ListBeeApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    const msg =
      typeof body === "object" && body !== null && "detail" in body
        ? String((body as Record<string, unknown>).detail)
        : JSON.stringify(body);
    super(`ListBee API error ${status}: ${msg}`);
    this.name = "ListBeeApiError";
  }
}

/**
 * Format a successful result as JSON text content.
 */
export function jsonResult(data: unknown): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

/**
 * Format an error as an isError result so the LLM can reason about it.
 */
export function errorResult(err: unknown): CallToolResult {
  if (err instanceof ListBeeApiError) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              status: err.status,
              error: err.body,
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  const message = err instanceof Error ? err.message : String(err);
  return {
    isError: true,
    content: [{ type: "text", text: message }],
  };
}

/**
 * Wraps an async function so errors never propagate — they become { isError: true } results.
 */
export async function safeTool<T>(fn: () => Promise<T>): Promise<CallToolResult> {
  try {
    const result = await fn();
    return jsonResult(result);
  } catch (err) {
    return errorResult(err);
  }
}
