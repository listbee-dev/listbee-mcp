// GENERATED FILE — DO NOT EDIT
// source: openapi.json + mcp-tools.yaml
// Regenerate with: npm run generate
// openapi_version: 1.0.0
// generated_at: 2026-04-12T07:00:59.240Z
// sha256: f1ff63c2019415cf3c8972f4c729b6145c388b80569562c9818ff133e9bb6261

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
    description: "Get the authenticated account's full state including readiness and billing status. This is the first call an agent should make to understand what's set up.",
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
    description: "Get a listing's full state including readiness. This is the readiness inspection tool — call it after every change to check what's needed.",
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
  get_store: {
    operationId: "get_store",
    method: "GET",
    path: "/v1/store",
    description: "Get the current store's brand info (display_name, bio, avatar, slug) and readiness. Store is determined by your API key — each key belongs to one store.",
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
    description: "List all listings for the authenticated account. Filter by status. Cursor-paginated. Each listing includes readiness — check readiness.sellable to see if it can accept orders.",
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
    description: "List orders for the authenticated account. Filter by status, listing, and date range. Paginated. Order lifecycle: PENDING (checkout started) → PAID (payment confirmed) → FULFILLED (content delivered). PAID is the resting state for orders where the seller handles delivery externally. Call POST /orders/{id}/fulfill to deliver content via ListBee. Terminal error states: CANCELED (payment failed or abandoned), FAILED (system error). Each order includes actions — PAID orders show FULFILL_ORDER (suggested) for optional ListBee delivery.",
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
    description: "Update account settings. Brand info (display_name, bio, avatar) is on the Store, not the Account. Use update_store for branding.",
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
    description: "Update listing fields. Slug can be changed while in draft status — input is slugified, conflicts get a random suffix. Returns updated listing with readiness.",
    annotations: {
      destructiveHint: false,
      idempotentHint: true,
      readOnlyHint: false,
    },
  },
  update_store: {
    operationId: "update_store",
    method: "PUT",
    path: "/v1/store",
    description: "Update store brand info. These appear on product pages and the store landing page.",
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
