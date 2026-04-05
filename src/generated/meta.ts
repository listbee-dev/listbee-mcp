// GENERATED FILE — DO NOT EDIT
// source: openapi.json + mcp-tools.yaml
// Regenerate with: npm run generate
// openapi_version: 1.0.0
// generated_at: 2026-04-05T13:36:16.228Z
// sha256: c8b0d9640ed32ea12e64304dc6799ff00452ce0d57e332cd3eb4bd37042a3254

export interface ToolMeta {
  operationId: string;
  method: string;
  path: string;
  description: string;
}

export const meta: Record<string, ToolMeta> = {
  create_account: {
    operationId: "create_account",
    method: "POST",
    path: "/v1/account",
    description: "Create a new ListBee account with an email address. Sends an OTP code to the email for verification. Follow up with verify_otp to complete signup and get an API key.",
  },
  create_api_key: {
    operationId: "create_api_key",
    method: "POST",
    path: "/v1/api-keys",
    description: "Create a new API key. The full key value (lb_ prefixed) is returned only once — store it securely. Each key can have a name for identification.",
  },
  create_listing: {
    operationId: "create_listing",
    method: "POST",
    path: "/v1/listings",
    description: "Create a new listing for sale. Returns a checkout URL and readiness status. Only name and price are required — but listings with rich content convert significantly better. Fill in as many fields as you can: description, tagline, highlights, badges, reviews, faqs, cta, cover_url. Write salesy, compelling copy. The product page buyers see is built entirely from these fields.",
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
  delete_api_key: {
    operationId: "delete_api_key",
    method: "DELETE",
    path: "/v1/api-keys/{key_id}",
    description: "Delete an API key. The key is immediately revoked and cannot be used again.",
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
  deliver_order: {
    operationId: "deliver_order",
    method: "POST",
    path: "/v1/orders/{order_id}/deliver",
    description: "Push digital content to a buyer for an external fulfillment order. Not needed for managed delivery — ListBee handles that automatically.",
  },
  disconnect_stripe: {
    operationId: "disconnect_stripe",
    method: "DELETE",
    path: "/v1/account/stripe",
    description: "Disconnect the Stripe account from ListBee. Existing listings retain their payment snapshot but new checkouts will fail.",
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
    description: "Get a single order by ID. Order lifecycle: PENDING → PAID → FULFILLED. Managed listings auto-fulfill. External listings require fulfill() or ship() after payment.",
  },
  list_api_keys: {
    operationId: "list_api_keys",
    method: "GET",
    path: "/v1/api-keys",
    description: "List all API keys. Shows key prefixes and names but not full key values (those are only shown at creation time).",
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
    description: "List orders for the authenticated account. Filter by status, listing, and date range. Paginated. Order lifecycle: PENDING (checkout started, buyer data captured) → PAID (payment confirmed, order.paid webhook fires) → FULFILLED (content delivered or goods shipped). Terminal states: CANCELED (payment failed or abandoned), FAILED (system error). Managed listings auto-fulfill on payment. External listings stay in PAID until the seller calls fulfill() or ship().",
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
    description: "Publish a listing so buyers can access the product page. Only works when readiness.publishable is true.",
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
    description: "Set digital deliverables (files, URLs, or text) on a listing. Required for managed fulfillment mode.",
  },
  ship_order: {
    operationId: "ship_order",
    method: "POST",
    path: "/v1/orders/{order_id}/ship",
    description: "Record shipping info (carrier + tracking code) and transition order to FULFILLED. Only valid for external fulfillment orders. Idempotent with same tracking code.",
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
    description: "Update the account's display name, bio, or avatar. These appear on product pages as the seller identity.",
  },
  update_listing: {
    operationId: "update_listing",
    method: "PUT",
    path: "/v1/listings/{listing_id}",
    description: "Update listing fields. Slug can be changed while in draft status — input is slugified, conflicts get a random suffix. Returns updated listing with readiness.",
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
  verify_otp: {
    operationId: "verify_otp",
    method: "POST",
    path: "/v1/account/verify/otp",
    description: "Verify the OTP code sent to the user's email during account creation. Returns an API key on success — store it securely for all future API calls.",
  },
};
