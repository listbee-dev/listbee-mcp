import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ListBeeClient } from "../client.js";
import { safeTool } from "../types.js";

// --- get_account ---

export async function handleGetAccount(
  client: ListBeeClient,
): Promise<CallToolResult> {
  return safeTool(async () => {
    return await client.request("GET", "/v1/account");
  });
}

// --- update_account ---

export async function handleUpdateAccount(
  client: ListBeeClient,
  args: {
    display_name?: string;
    bio?: string;
    avatar?: string;
    ga_measurement_id?: string;
  },
): Promise<CallToolResult> {
  return safeTool(async () => {
    const body: Record<string, unknown> = {};
    if (args.display_name !== undefined) body.display_name = args.display_name;
    if (args.bio !== undefined) body.bio = args.bio;
    if (args.avatar !== undefined) body.avatar = args.avatar;
    if (args.ga_measurement_id !== undefined) body.ga_measurement_id = args.ga_measurement_id;
    return await client.request("PUT", "/v1/account", body);
  });
}

// --- delete_account ---

export async function handleDeleteAccount(
  client: ListBeeClient,
): Promise<CallToolResult> {
  return safeTool(async () => {
    await client.request("DELETE", "/v1/account");
    return { success: true, message: "Account deleted." };
  });
}

// --- create_account ---

export async function handleCreateAccount(
  client: ListBeeClient,
  args: { email: string },
): Promise<CallToolResult> {
  return safeTool(async () => {
    return await client.request("POST", "/v1/account", { email: args.email });
  });
}

// --- verify_otp ---

export async function handleVerifyOtp(
  client: ListBeeClient,
  args: { email: string; code: string },
): Promise<CallToolResult> {
  return safeTool(async () => {
    return await client.request("POST", "/v1/account/verify/otp", {
      email: args.email,
      code: args.code,
    });
  });
}
