import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { APIStatusError, APIConnectionError, APITimeoutError } from "listbee";

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
 * Handles SDK's typed error hierarchy for structured output.
 */
export function errorResult(err: unknown): CallToolResult {
  if (err instanceof APIStatusError) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              status: err.status,
              code: err.code,
              detail: err.detail,
              ...(err.param ? { param: err.param } : {}),
            },
            null,
            2,
          ),
        },
      ],
    };
  }
  if (err instanceof APIConnectionError) {
    return {
      isError: true,
      content: [{ type: "text", text: `Connection error: ${err.message}` }],
    };
  }
  if (err instanceof APITimeoutError) {
    return {
      isError: true,
      content: [{ type: "text", text: `Request timed out: ${err.message}` }],
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
