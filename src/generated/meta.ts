// GENERATED FILE — DO NOT EDIT
// source: openapi.json + mcp-tools.yaml
// Regenerate with: npm run generate
// openapi_version: 1.0.0
// generated_at: 2026-04-17T07:21:09.707Z
// sha256: 4a49dcb937329d43f9eed94c502019a19a307cf9ac5178c7dba28498cfa78ac3

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
  bootstrap_complete: {
    operationId: "bootstrap_complete",
    method: "POST",
    path: "/v1/bootstrap/complete",
    description: "Generates an API key on the verified session. Idempotent — calling again with the same session within 10 minutes returns the same key. Store the key immediately. Use as Authorization: Bearer lb_...",
    annotations: {
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
      readOnlyHint: false,
    },
  },
  bootstrap_start: {
    operationId: "bootstrap_start",
    method: "POST",
    path: "/v1/bootstrap",
    description: "Sends a one-time passcode to the provided email address. Returns a session ID for step 2 (bootstrap_verify). Human must check their email for the 6-digit code. Flow: bootstrap_start → bootstrap_verify → bootstrap_complete.",
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
    description: "Verifies the OTP. On success, creates an account if new email. Returns session ID for step 3 (bootstrap_complete).",
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
    description: "Create a new listing for sale. Returns a checkout URL and readiness status. Only name and price are required — but listings with rich content convert significantly better. Fill in as many fields as you can: description, tagline, highlights, badges, reviews, faqs, cta, cover_url. Write salesy, compelling copy. The product page buyers see is built entirely from these fields. Fulfillment is implicit: attach deliverables for auto-delivery, set fulfillment_url for agent callback, or handle via webhooks. No content_type field needed.",
    annotations: {
      destructiveHint: false,
      readOnlyHint: false,
    },
  },
  create_webhook: {
    operationId: "create_webhook",
    method: "POST",
    path: "/v1/webhooks",
    description: "Create a webhook endpoint. Specify the URL and which events to receive. The webhook secret (whsec_ prefixed) is returned for signature verification.",
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
  delete_webhook: {
    operationId: "delete_webhook",
    method: "DELETE",
    path: "/v1/webhooks/{webhook_id}",
    description: "Permanently delete a webhook endpoint. This is irreversible — the webhook and its delivery history cannot be recovered.",
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
    description: "Fulfill an order. Include deliverables (file/url/text) to deliver digital content via ListBee — creates an access grant and emails the buyer. Omit deliverables to mark the order as complete without delivering content (for externally fulfilled orders).",
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
  get_customer: {
    operationId: "get_customer",
    method: "GET",
    path: "/v1/customers/{customer_id}",
    description: "Get a customer by ID. Shows total orders, total spent, currency, and purchase dates. Customers represent unique buyer emails that have purchased from the seller.",
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
    description: "Get a listing's full state including readiness. This is the readiness inspection tool — call it after every change to check what's needed. readiness.sellable is true when the listing can accept purchases. If false, readiness.actions tells you what's missing and how to fix each item.",
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
  list_customers: {
    operationId: "list_customers",
    method: "GET",
    path: "/v1/customers",
    description: "List all customers (buyers) who have purchased from the seller. Auto-populated from orders — no manual creation needed. Sorted by most recent purchase first. Filter by email for exact match lookup.",
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
    description: "List all listings for the authenticated account. Filter by status. Cursor-paginated. Returns lightweight summaries — use GET /v1/listings/{listing_id} for full detail including deliverables, readiness, reviews, and checkout schema.",
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
  list_webhook_events: {
    operationId: "list_webhook_events",
    method: "GET",
    path: "/v1/webhooks/{webhook_id}/events",
    description: "List recent events for a webhook. Shows delivery status, attempts, and errors. Useful for debugging failed deliveries.",
    annotations: {
      destructiveHint: false,
      idempotentHint: true,
      readOnlyHint: true,
    },
  },
  list_webhooks: {
    operationId: "list_webhooks",
    method: "GET",
    path: "/v1/webhooks",
    description: "List all webhooks for the account. Shows URL, events filter, and enabled status.",
    annotations: {
      destructiveHint: false,
      idempotentHint: true,
      readOnlyHint: true,
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
  remove_deliverables: {
    operationId: "remove_deliverables",
    method: "DELETE",
    path: "/v1/listings/{listing_id}/deliverables",
    description: "Remove all deliverables from a listing. This is irreversible — the files and delivery configuration cannot be recovered. The listing switches to external fulfillment (webhook or agent callback).",
    annotations: {
      destructiveHint: true,
      readOnlyHint: false,
    },
  },
  retry_webhook_event: {
    operationId: "retry_webhook_event",
    method: "POST",
    path: "/v1/webhooks/{webhook_id}/events/{event_id}/retry",
    description: "Retry delivery of a failed webhook event. Resets attempt counter.",
    annotations: {
      destructiveHint: false,
      openWorldHint: true,
      readOnlyHint: false,
    },
  },
  set_deliverables: {
    operationId: "set_deliverables",
    method: "PUT",
    path: "/v1/listings/{listing_id}/deliverables",
    description: "Set digital deliverables (files, URLs, or text) on a listing. Listings with deliverables auto-deliver to buyers on purchase.",
    annotations: {
      destructiveHint: false,
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
  test_webhook: {
    operationId: "test_webhook",
    method: "POST",
    path: "/v1/webhooks/{webhook_id}/test",
    description: "Send a test event to the webhook URL. Returns the delivery result. Use this to verify webhook configuration before going live.",
    annotations: {
      destructiveHint: false,
      openWorldHint: true,
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
    description: "Update listing fields. Returns updated listing with readiness.",
    annotations: {
      destructiveHint: false,
      idempotentHint: true,
      readOnlyHint: false,
    },
  },
  update_webhook: {
    operationId: "update_webhook",
    method: "PUT",
    path: "/v1/webhooks/{webhook_id}",
    description: "Update a webhook endpoint URL, name, or subscribed events. Only provided fields are changed. Use POST /v1/webhooks/{webhook_id}/test to verify the updated endpoint receives events correctly.",
    annotations: {
      destructiveHint: false,
      idempotentHint: true,
      readOnlyHint: false,
    },
  },
  upload_file: {
    operationId: "upload_file",
    method: "POST",
    path: "/v1/files",
    description: "Upload a file and receive a token for use in deliverables.",
    annotations: {
      destructiveHint: false,
      openWorldHint: true,
      readOnlyHint: false,
    },
  },
};
