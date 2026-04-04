// GENERATED FILE — DO NOT EDIT
// source: openapi.json + mcp-tools.yaml
// Regenerate with: npm run generate
// openapi_version: 1.0.0
// generated_at: 2026-04-04T06:44:34.136Z
// sha256: 139655db37d77f94d62bdc79abcf70ccb16f17418e7b375102c53a1b03810b5e

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
    description: "Create a new listing for sale. Returns a checkout URL and readiness status.",
  },
  delete_listing: {
    operationId: "delete_listing",
    method: "DELETE",
    path: "/v1/listings/{listing_id}",
    description: "Delete a listing by ID and its stored content. Irreversible.",
  },
  deliver_order: {
    operationId: "deliver_order",
    method: "POST",
    path: "/v1/orders/{order_id}/deliver",
    description: "Push digital content to a buyer for an external fulfillment order. Not needed for managed delivery — ListBee handles that automatically.",
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
  publish_listing: {
    operationId: "publish_listing",
    method: "POST",
    path: "/v1/listings/{listing_id}/publish",
    description: "Publish a listing so buyers can access the product page. Only works when readiness.publishable is true.",
  },
  remove_deliverables: {
    operationId: "remove_deliverables",
    method: "DELETE",
    path: "/v1/listings/{listing_id}/deliverables",
    description: "Remove all deliverables from a draft listing. Demotes the listing to external fulfillment. Draft only — returns 409 if the listing is published or paused.",
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
  update_listing: {
    operationId: "update_listing",
    method: "PUT",
    path: "/v1/listings/{listing_id}",
    description: "Update listing fields. Slug can be changed while in draft status — input is slugified, conflicts get a random suffix. Returns updated listing with readiness.",
  },
  upload_file: {
    operationId: "upload_file",
    method: "POST",
    path: "/v1/files",
    description: "Fetches the file from the URL and uploads it to ListBee. Only use with URLs the user has provided or that you trust.",
  },
};
