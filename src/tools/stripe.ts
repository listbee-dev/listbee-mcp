import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ListBeeClient } from "../client.js";
import { errorResult } from "../types.js";

// --- start_stripe_connect ---

export async function handleStartStripeConnect(
  client: ListBeeClient,
): Promise<CallToolResult> {
  try {
    const data = await client.request<Record<string, unknown>>(
      "POST",
      "/v1/account/stripe/connect",
    );

    const url = data.url ?? data.onboarding_url ?? "(see response)";

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
