// GENERATED FILE — DO NOT EDIT
// source: openapi.json + mcp-tools.yaml
// Regenerate with: npm run generate
// openapi_version: 1.0.0
// generated_at: 2026-04-07T18:19:54.569Z
// sha256: 8726fbbf273f309320b8a437c33d5f7069a4dee19c21b45e6fb5899969c2a7a1

export interface ToolMeta {
  operationId: string;
  method: string;
  path: string;
  description: string;
}

export const meta: Record<string, ToolMeta> = {
  create_api_key: {
    operationId: "create_api_key",
    method: "POST",
    path: "/v1/api-keys",
    description: "Step 3 of 3 in the auth flow: send_otp → verify_otp → create_api_key. Create a permanent API key (lb_ prefixed). After verifying OTP, use the short-lived access token (at_ prefix) to call this endpoint. The returned lb_ key is permanent — use it for all subsequent API calls.",
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
    description: "Fulfill an order. Include deliverables (file/url/text) to deliver digital content via ListBee — creates an access grant and emails the buyer. Omit deliverables to mark the order as complete without delivering content (close-out for orders handled externally).",
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
    description: "Get a single order by ID. Order lifecycle: PENDING → PAID → FULFILLED. PAID is terminal for external orders where delivery is handled outside ListBee. FULFILLED means content was delivered via ListBee or the order was explicitly closed via POST /fulfill. Managed listings auto-fulfill on payment.",
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
    description: "List orders for the authenticated account. Filter by status, listing, and date range. Paginated. Order lifecycle: PENDING (checkout started, buyer data captured) → PAID (payment confirmed, order.paid webhook fires) → FULFILLED (content delivered via ListBee or order closed via POST /fulfill). PAID is terminal for external orders where delivery is handled outside ListBee. Terminal error states: CANCELED (payment failed or abandoned), FAILED (system error). Managed listings auto-fulfill on payment. External listings stay in PAID until the seller calls POST /fulfill.",
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
  send_otp: {
    operationId: "send_otp",
    method: "POST",
    path: "/v1/auth/otp",
    description: "Send an OTP code to an email address to start account creation or re-authentication. Idempotent — calling again re-sends the code. If no account exists for this email, one will be created when the OTP is verified. Follow up with verify_otp to complete authentication and receive an access token.",
  },
  set_deliverables: {
    operationId: "set_deliverables",
    method: "PUT",
    path: "/v1/listings/{listing_id}/deliverables",
    description: "Set digital deliverables (files, URLs, or text) on a listing. Required for managed fulfillment mode.",
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
    path: "/v1/auth/otp/verify",
    description: "Verify the OTP code sent to the user's email. Returns a short-lived access token (24h) on success. Use the access_token to create a permanent API key via create_api_key. Works for both new signups and returning account re-authentication.",
  },
};
