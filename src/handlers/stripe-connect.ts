import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ListBee } from "listbee";
import { errorResult } from "../types.js";

/**
 * Start Stripe Connect onboarding.
 * Returns a custom CallToolResult with the URL and human instruction text.
 * This handler catches its own errors and returns CallToolResult directly.
 */
export async function handleStripeConnect(
  client: ListBee,
): Promise<CallToolResult> {
  try {
    const data = await client.stripe.connect();
    const url = data.url;

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
