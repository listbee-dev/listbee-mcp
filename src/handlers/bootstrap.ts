import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { errorResult } from "../types.js";

async function bootstrapFetch(
  baseUrl: string,
  path: string,
  body: Record<string, unknown>,
): Promise<unknown> {
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw Object.assign(new Error((data as any).detail || `HTTP ${res.status}`), {
      status: res.status,
      response: data,
    });
  }
  return data;
}

export async function handleBootstrapStart(
  baseUrl: string,
  args: Record<string, unknown>,
): Promise<CallToolResult> {
  try {
    const data = await bootstrapFetch(baseUrl, "/v1/bootstrap", { email: args.email });
    return {
      content: [
        { type: "text", text: JSON.stringify(data, null, 2) },
        { type: "text", text: "OTP sent. Ask the user to check their email for a 6-digit code, then call bootstrap_verify." },
      ],
    };
  } catch (err) { return errorResult(err); }
}

export async function handleBootstrapVerify(
  baseUrl: string,
  args: Record<string, unknown>,
): Promise<CallToolResult> {
  try {
    const data = await bootstrapFetch(baseUrl, "/v1/bootstrap/verify", {
      session: args.session, code: args.code,
    });
    return {
      content: [
        { type: "text", text: JSON.stringify(data, null, 2) },
        { type: "text", text: "Verified. Call bootstrap_complete with the session ID to get the API key." },
      ],
    };
  } catch (err) { return errorResult(err); }
}

export async function handleBootstrapComplete(
  baseUrl: string,
  args: Record<string, unknown>,
): Promise<CallToolResult> {
  try {
    const data = await bootstrapFetch(baseUrl, "/v1/bootstrap/complete", { session: args.session });
    return {
      content: [
        { type: "text", text: JSON.stringify(data, null, 2) },
        { type: "text", text: "CRITICAL: Store the api_key immediately. Restart this MCP session with the key to unlock all tools." },
      ],
    };
  } catch (err) { return errorResult(err); }
}
