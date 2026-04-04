import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ListBeeClient } from "../client.js";
import { errorResult, safeTool } from "../types.js";

// --- start_stripe_connect ---

export async function handleStartStripeConnect(
  client: ListBeeClient,
): Promise<CallToolResult> {
  try {
    const data = await client.request<Record<string, unknown>>(
      "POST",
      "/v1/account/stripe/connect",
    );

    const url = (data as { url: string }).url;

    return {
      content: [
        { type: "text", text: JSON.stringify(data, null, 2) },
        {
          type: "text",
          text: `IMPORTANT: You cannot complete Stripe onboarding. Share this URL with the user so they can complete it in their browser: ${url}`,
        },
      ],
    };
  } catch (err) {
    return errorResult(err);
  }
}

// --- disconnect_stripe ---

export async function handleDisconnectStripe(
  client: ListBeeClient,
): Promise<CallToolResult> {
  return safeTool(async () => {
    await client.request("DELETE", "/v1/account/stripe");
    return { success: true, message: "Stripe account disconnected." };
  });
}
