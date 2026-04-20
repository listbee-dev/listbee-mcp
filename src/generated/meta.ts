// GENERATED FILE — DO NOT EDIT
// source: openapi.json + mcp-tools.yaml
// Regenerate with: npm run generate
// openapi_version: 1.0.0
// generated_at: 2026-04-20T18:52:54.789Z
// sha256: 7cdb58de18630a1c6615b6dd8b907c75b1f5d81cb4866db3c593c2904c06b7ba

export interface ToolAnnotations {
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
}

export interface ToolMeta {
  operationId: string;
  method: string;
  path: string;
  description: string;
  annotations: ToolAnnotations;
}

export const meta: Record<string, ToolMeta> = {
  api_key_self_revoke: {
    operationId: "api_key_self_revoke",
    method: "POST",
    path: "/v1/api-keys/self-revoke",
    description: "Self-revokes the API key in the Authorization header. Does not list or affect other keys on the account. Idempotent — already-revoked keys return 200. No rate limit.",
    annotations: {
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false,
      readOnlyHint: false,
    },
  },
  bootstrap_poll: {
    operationId: "bootstrap_poll",
    method: "GET",
    path: "/v1/bootstrap/{account_id}",
    description: "Polling endpoint. Returns ready=true once charges_enabled; actions[] surfaces what's still blocking. Poll every 30 seconds after handing the Stripe onboarding URL to the human. Give up after 15 minutes.",
    annotations: {
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
      readOnlyHint: true,
    },
  },
  bootstrap_start: {
    operationId: "bootstrap_start",
    method: "POST",
    path: "/v1/bootstrap/start",
    description: "Step 1 of 2. Emails an OTP and returns a single-use bootstrap_token plus the account_id. Token TTL 10 min. Flow: bootstrap_start → bootstrap_verify. No API key required.",
    annotations: {
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
      readOnlyHint: false,
    },
  },
  bootstrap_verify: {
    operationId: "bootstrap_verify",
    method: "POST",
    path: "/v1/bootstrap/verify",
    description: "Step 2 of 2. Verifies the OTP, issues the first API key (shown once — store immediately), and returns Stripe onboarding URL. Hand the Stripe URL to the human; poll bootstrap_poll until ready.",
    annotations: {
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
      readOnlyHint: false,
    },
  },
  create_listing: {
    operationId: "create_listing",
    method: "POST",
    path: "/v1/listings",
    description: "Create a live, buyable listing in one call. Returns the checkout URL and a one-time signing_secret that you must store (subsequent reads don't expose it). The agent supplies deliverable for instant delivery (STATIC — ListBee sends the URL/text at order.paid), or leaves it null for agent-driven fulfillment (ASYNC — you call POST /v1/orders/{order_id}/fulfill after paid, or leave empty and fulfill externally). fulfillment_mode is computed automatically from deliverable presence; do not send it. Only name and price are required; provide rich description/tagline/highlights/faqs for better conversion.",
    annotations: {
      destructiveHint: false,
      readOnlyHint: false,
    },
  },
  delete_account: {
    operationId: "delete_account",
    method: "DELETE",
    path: "/v1/account",
    description: "Permanently delete the account and all associated data. This is irreversible.",
    annotations: {
      destructiveHint: true,
      readOnlyHint: false,
    },
  },
  delete_listing: {
    operationId: "delete_listing",
    method: "DELETE",
    path: "/v1/listings/{listing_id}",
    description: "Permanently delete a listing. This is irreversible — the listing, its checkout URL, and all associated data cannot be recovered.",
    annotations: {
      destructiveHint: true,
      readOnlyHint: false,
    },
  },
  disconnect_stripe: {
    operationId: "disconnect_stripe",
    method: "DELETE",
    path: "/v1/account/stripe",
    description: "Disconnect the Stripe account from ListBee. This cannot be undone — you will need to re-onboard through Stripe Connect. Existing listings retain their payment snapshot but new checkouts will fail.",
    annotations: {
      destructiveHint: true,
      readOnlyHint: false,
    },
  },
  fulfill_order: {
    operationId: "fulfill_order",
    method: "POST",
    path: "/v1/orders/{order_id}/fulfill",
    description: "Mark a paid order as fulfilled by providing the deliverable content (single URL or Markdown text). The deliverable is delivered to the buyer via the unlock page and, if configured, the agent_callback_url webhook payload. Omit deliverable to mark the order as complete without delivering content (for externally fulfilled orders). metadata accepts a free-form dict (max 50 keys; key ≤ 40 chars, value ≤ 500 chars) — useful for correlating agent work (e.g. job_id, generation_run, delivery_ref).",
    annotations: {
      destructiveHint: false,
      readOnlyHint: false,
    },
  },
  get_account: {
    operationId: "get_account",
    method: "GET",
    path: "/v1/account",
    description: "Returns account profile, stats, and operational readiness. readiness.operational is false until all required actions are resolved. Each action in readiness.actions has:   code — what's needed (e.g. connect_stripe)   kind — \"api\" (you can fix it) or \"human\" (user must act)   resolve — exactly how to fix it (method + endpoint or URL)   docs — documentation link for this action readiness.next is the highest-priority action code — resolve it first.",
    annotations: {
      destructiveHint: false,
      idempotentHint: true,
      readOnlyHint: true,
    },
  },
  get_listing: {
    operationId: "get_listing",
    method: "GET",
    path: "/v1/listings/{listing_id}",
    description: "Get a listing's full state including readiness. This is the readiness inspection tool — call it after every change to check what's needed. readiness.buyable is true when the listing can accept purchases. If false, readiness.actions tells you what's missing and how to fix each item.",
    annotations: {
      destructiveHint: false,
      idempotentHint: true,
      readOnlyHint: true,
    },
  },
  get_order: {
    operationId: "get_order",
    method: "GET",
    path: "/v1/orders/{order_id}",
    description: "Get a single order by ID. Order lifecycle: PENDING → PAID → FULFILLED. Check has_deliverables to determine fulfillment mode: if true, content was auto-delivered on payment (order is already FULFILLED). If false, the order stays PAID — call POST /v1/orders/{order_id}/fulfill to deliver content via ListBee, or handle delivery externally via the order.paid webhook. Use readiness.next to determine the recommended next action.",
    annotations: {
      destructiveHint: false,
      idempotentHint: true,
      readOnlyHint: true,
    },
  },
  list_listings: {
    operationId: "list_listings",
    method: "GET",
    path: "/v1/listings",
    description: "List all listings for the authenticated account. Returns lightweight summaries — call GET /v1/listings/{listing_id} for full detail (readiness, stats, deliverable, checkout schema). Cursor-paginated: pass `cursor` from the previous response to fetch the next page. Filter by `status` to find only published, draft, or archived listings.",
    annotations: {
      destructiveHint: false,
      idempotentHint: true,
      readOnlyHint: true,
    },
  },
  list_orders: {
    operationId: "list_orders",
    method: "GET",
    path: "/v1/orders",
    description: "List orders for the authenticated account. Filter by status, listing, and date range. Paginated. Returns lightweight summaries — use GET /v1/orders/{order_id} for full detail including deliverables, readiness, checkout_data, and Stripe payment intent. Order lifecycle: PENDING → PAID → FULFILLED. Terminal: CANCELED, FAILED.",
    annotations: {
      destructiveHint: false,
      idempotentHint: true,
      readOnlyHint: true,
    },
  },
  order_redeliver: {
    operationId: "redeliver_order",
    method: "POST",
    path: "/v1/orders/{order_id}/redeliver",
    description: "Requeue order.paid (and order.fulfilled if applicable) to the listing's agent_callback_url with attempt=1, no initial delay. Rate limited: 10/hour/order, 100/hour/api-key. Pass an Idempotency-Key header to dedupe within 24h. Responds 202 with scheduled_attempts count. Zero means the listing has no agent_callback_url — agent should poll /v1/orders or /v1/events instead.",
    annotations: {
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
      readOnlyHint: false,
    },
  },
  publish_listing: {
    operationId: "publish_listing",
    method: "POST",
    path: "/v1/listings/{listing_id}/publish",
    description: "Publish a listing so buyers can access the product page. No Stripe required — the product page goes live immediately. The buy button activates once Stripe is connected.",
    annotations: {
      destructiveHint: false,
      readOnlyHint: false,
    },
  },
  refund_order: {
    operationId: "refund_order",
    method: "POST",
    path: "/v1/orders/{order_id}/refund",
    description: "Issue a full refund for an order. This is irreversible and cannot be undone. Refund is processed through Stripe on the seller's connected account. Idempotent — already-refunded orders return as-is. Order state (refund_amount, refunded_at) updates asynchronously via Stripe webhook.",
    annotations: {
      destructiveHint: true,
      idempotentHint: true,
      readOnlyHint: false,
    },
  },
  start_stripe_connect: {
    operationId: "start_stripe_connect",
    method: "POST",
    path: "/v1/account/stripe/connect",
    description: "Start Stripe Connect onboarding. Returns a URL for the human to complete in a browser. Required before selling through Stripe.",
    annotations: {
      destructiveHint: false,
      readOnlyHint: false,
    },
  },
  update_account: {
    operationId: "update_account",
    method: "PUT",
    path: "/v1/account",
    description: "Update account settings including brand info (display_name, bio, avatar) and other account-level configuration.",
    annotations: {
      destructiveHint: false,
      idempotentHint: true,
      readOnlyHint: false,
    },
  },
  update_listing: {
    operationId: "update_listing",
    method: "PUT",
    path: "/v1/listings/{listing_id}",
    description: "Partial update — only fields present in the request body are changed. Omitted fields are left as-is. Pass null explicitly to clear a nullable field. Unknown fields return 422 (strict schema). Updates to published listings take effect immediately. To rotate the signing secret, include `signing_secret` in the body (pass null to auto-generate, or a string to set a specific value) — the response object switches to `listing_with_secret` and the new secret is returned once.",
    annotations: {
      destructiveHint: false,
      idempotentHint: true,
      readOnlyHint: false,
    },
  },
};
