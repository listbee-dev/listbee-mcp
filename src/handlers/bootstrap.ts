import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { errorResult } from "../types.js";

async function bootstrapFetch(
  baseUrl: string,
  method: string,
  path: string,
  body?: Record<string, unknown>,
): Promise<unknown> {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
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
    const data = await bootstrapFetch(baseUrl, "POST", "/v1/bootstrap/start", { email: args.email });
    return {
      content: [
        { type: "text", text: JSON.stringify(data, null, 2) },
        { type: "text", text: "OTP sent. Ask the user to check their email for a 6-digit code, then call bootstrap_verify with the bootstrap_token and otp_code." },
      ],
    };
  } catch (err) { return errorResult(err); }
}

export async function handleBootstrapVerify(
  baseUrl: string,
  args: Record<string, unknown>,
): Promise<CallToolResult> {
  try {
    const data = await bootstrapFetch(baseUrl, "POST", "/v1/bootstrap/verify", {
      bootstrap_token: args.bootstrap_token,
      otp_code: args.otp_code,
    });
    return {
      content: [
        { type: "text", text: JSON.stringify(data, null, 2) },
        { type: "text", text: "CRITICAL: Store the api_key IMMEDIATELY — it is shown once and cannot be recovered. Restart this MCP session with the key to unlock all tools. Hand the stripe_onboarding_url to the user; poll bootstrap_poll every 30s until ready=true." },
      ],
    };
  } catch (err) { return errorResult(err); }
}

export async function handleBootstrapPoll(
  baseUrl: string,
  apiKey: string | undefined,
  args: Record<string, unknown>,
): Promise<CallToolResult> {
  try {
    const accountId = args.account_id as string;
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }
    const res = await fetch(`${baseUrl}/v1/bootstrap/${accountId}`, {
      method: "GET",
      headers,
    });
    const data = await res.json();
    if (!res.ok) {
      throw Object.assign(new Error((data as any).detail || `HTTP ${res.status}`), {
        status: res.status,
        response: data,
      });
    }
    return {
      content: [
        { type: "text", text: JSON.stringify(data, null, 2) },
      ],
    };
  } catch (err) { return errorResult(err); }
}
