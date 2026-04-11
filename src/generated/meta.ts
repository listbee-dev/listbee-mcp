// GENERATED FILE — DO NOT EDIT
// source: openapi.json + mcp-tools.yaml
// Regenerate with: npm run generate
// openapi_version: 1.0.0
// generated_at: 2026-04-11T15:10:13.519Z
// sha256: ba4bb96c61e04bb1947cea9dc9a2d3a87ec6057edf9b512748d3cb983d4c639e

export interface ToolMeta {
  operationId: string;
  method: string;
  path: string;
  description: string;
}

export const meta: Record<string, ToolMeta> = {
  create_listing: {
    operationId: "create_listing",
    method: "POST",
    path: "/v1/listings",
    description: "Create a new listing for sale. Returns a checkout URL and readiness status. Only name and price are required — but listings with rich content convert significantly better. Fill in as many fields as you can: description, tagline, highlights, badges, reviews, faqs, cta, cover_url. Write salesy, compelling copy. The product page buyers see is built entirely from these fields. Fulfillment is implicit: attach deliverables for auto-delivery, set fulfillment_url for agent callback, or handle via webhooks. No content_type field needed.",
  },
  create_webhook: {
    operationId: "create_webhook",
    method: "POST",
    path: "/v1/webhooks",
    description: "Create a webhook endpoint. Specify the URL and which events to receive. The webhook secret (whsec_ prefixed) is returned for signature verification.",
  },
  delete_account: {
    operationId: "delete_account",
    method: "DELETE",
    path: "/v1/account",
    description: "Permanently delete the account and all associated data. This is irreversible.",
  },
  delete_listing: {
    operationId: "delete_listing",
    method: "DELETE",
    path: "/v1/listings/{listing_id}",
    description: "Delete a listing by ID and its stored content. Irreversible.",
  },
  delete_webhook: {
    operationId: "delete_webhook",
    method: "DELETE",
    path: "/v1/webhooks/{webhook_id}",
    description: "Delete a webhook endpoint. Irreversible.",
  },
  disconnect_stripe: {
    operationId: "disconnect_stripe",
    method: "DELETE",
    path: "/v1/account/stripe",
    description: "Disconnect the Stripe account from ListBee. Existing listings retain their payment snapshot but new checkouts will fail.",
  },
  fulfill_order: {
    operationId: "fulfill_order",
    method: "POST",
    path: "/v1/orders/{order_id}/fulfill",
    description: "Fulfill an order. Include deliverables (file/url/text) to deliver digital content via ListBee — creates an access grant and emails the buyer. Omit deliverables to mark the order as complete without delivering content (for externally fulfilled orders).",
  },
  get_account: {
    operationId: "get_account",
    method: "GET",
    path: "/v1/account",
    description: "Get the authenticated account's full state including readiness and billing status. This is the first call an agent should make to understand what's set up.",
  },
  get_customer: {
    operationId: "get_customer",
    method: "GET",
    path: "/v1/customers/{customer_id}",
    description: "Get a customer by ID. Shows total orders, total spent, currency, and purchase dates. Customers represent unique buyer emails that have purchased from the seller.",
  },
  get_listing: {
    operationId: "get_listing",
    method: "GET",
    path: "/v1/listings/{listing_id}",
    description: "Get a listing's full state including readiness. This is the readiness inspection tool — call it after every change to check what's needed.",
  },
  get_order: {
    operationId: "get_order",
    method: "GET",
    path: "/v1/orders/{order_id}",
    description: "Get a single order by ID. Order lifecycle: PENDING → PAID → FULFILLED. PAID orders include a FULFILL_ORDER action — call POST /fulfill to deliver content via ListBee. If the listing had deliverables, they were auto-delivered on payment (order is already FULFILLED). If not, the order stays PAID until /fulfill is called or the seller handles delivery externally.",
  },
  get_store: {
    operationId: "get_store",
    method: "GET",
    path: "/v1/store",
    description: "Get the current store's brand info (display_name, bio, avatar, slug) and readiness. Store is determined by your API key — each key belongs to one store.",
  },
  list_customers: {
    operationId: "list_customers",
    method: "GET",
    path: "/v1/customers",
    description: "List all customers (buyers) who have purchased from the seller. Auto-populated from orders — no manual creation needed. Sorted by most recent purchase first. Filter by email for exact match lookup.",
  },
  list_listings: {
    operationId: "list_listings",
    method: "GET",
    path: "/v1/listings",
    description: "List all listings for the authenticated account. Filter by status. Cursor-paginated. Each listing includes readiness — check readiness.sellable to see if it can accept orders.",
  },
  list_orders: {
    operationId: "list_orders",
    method: "GET",
    path: "/v1/orders",
    description: "List orders for the authenticated account. Filter by status, listing, and date range. Paginated. Order lifecycle: PENDING (checkout started) → PAID (payment confirmed) → FULFILLED (content delivered). PAID is the resting state for orders where the seller handles delivery externally. Call POST /orders/{id}/fulfill to deliver content via ListBee. Terminal error states: CANCELED (payment failed or abandoned), FAILED (system error). Each order includes actions — PAID orders show FULFILL_ORDER (suggested) for optional ListBee delivery.",
  },
  list_webhook_events: {
    operationId: "list_webhook_events",
    method: "GET",
    path: "/v1/webhooks/{webhook_id}/events",
    description: "List recent events for a webhook. Shows delivery status, attempts, and errors. Useful for debugging failed deliveries.",
  },
  list_webhooks: {
    operationId: "list_webhooks",
    method: "GET",
    path: "/v1/webhooks",
    description: "List all webhooks for the account. Shows URL, events filter, and enabled status.",
  },
  publish_listing: {
    operationId: "publish_listing",
    method: "POST",
    path: "/v1/listings/{listing_id}/publish",
    description: "Publish a listing so buyers can access the product page. No Stripe required — the product page goes live immediately. The buy button activates once Stripe is connected.",
  },
  refund_order: {
    operationId: "refund_order",
    method: "POST",
    path: "/v1/orders/{order_id}/refund",
    description: "Issue a full refund for an order. Refund is processed through Stripe on the seller's connected account. Idempotent — already-refunded orders return as-is. Order state (refund_amount, refunded_at) updates asynchronously via Stripe webhook.",
  },
  remove_deliverables: {
    operationId: "remove_deliverables",
    method: "DELETE",
    path: "/v1/listings/{listing_id}/deliverables",
    description: "Remove all deliverables from a draft listing. Demotes the listing to external fulfillment. Draft only — returns 409 if the listing is published.",
  },
  retry_webhook_event: {
    operationId: "retry_webhook_event",
    method: "POST",
    path: "/v1/webhooks/{webhook_id}/events/{event_id}/retry",
    description: "Retry delivery of a failed webhook event. Resets attempt counter.",
  },
  set_deliverables: {
    operationId: "set_deliverables",
    method: "PUT",
    path: "/v1/listings/{listing_id}/deliverables",
    description: "Set digital deliverables (files, URLs, or text) on a listing. Listings with deliverables auto-deliver to buyers on purchase.",
  },
  start_stripe_connect: {
    operationId: "start_stripe_connect",
    method: "POST",
    path: "/v1/account/stripe/connect",
    description: "Start Stripe Connect onboarding. Returns a URL for the human to complete in a browser. Required before selling through Stripe.",
  },
  test_webhook: {
    operationId: "test_webhook",
    method: "POST",
    path: "/v1/webhooks/{webhook_id}/test",
    description: "Send a test event to the webhook URL. Returns the delivery result. Use this to verify webhook configuration before going live.",
  },
  update_account: {
    operationId: "update_account",
    method: "PUT",
    path: "/v1/account",
    description: "Update account settings. Brand info (display_name, bio, avatar) is on the Store, not the Account. Use update_store for branding.",
  },
  update_listing: {
    operationId: "update_listing",
    method: "PUT",
    path: "/v1/listings/{listing_id}",
    description: "Update listing fields. Slug can be changed while in draft status — input is slugified, conflicts get a random suffix. Returns updated listing with readiness.",
  },
  update_store: {
    operationId: "update_store",
    method: "PUT",
    path: "/v1/store",
    description: "Update store brand info. These appear on product pages and the store landing page.",
  },
  update_webhook: {
    operationId: "update_webhook",
    method: "PUT",
    path: "/v1/webhooks/{webhook_id}",
    description: "Update a webhook endpoint. Only provided fields are changed.",
  },
  upload_file: {
    operationId: "upload_file",
    method: "POST",
    path: "/v1/files",
    description: "Upload a file and receive a token for use in deliverables.",
  },
};
