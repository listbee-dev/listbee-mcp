import { z } from "zod";

// --- Shared field descriptions ---

const listingIdDesc =
  "Listing ID (lst_...). You MUST use an actual listing ID from a previous response.";
const orderIdDesc =
  "Order ID (ord_...). You MUST use an actual order ID from a previous response.";
const cursorDesc =
  "Pagination cursor from a previous list response. Omit to start from the beginning.";
const limitDesc = "Number of items to return (1-100). Defaults to 20.";

// --- Deliverable schema (reused in set_deliverables and deliver_order) ---

const deliverableSchema = z.object({
  type: z
    .enum(["file", "url", "text"])
    .describe("Deliverable type: 'file' (uploaded file token), 'url' (link), or 'text' (plain text)."),
  token: z
    .string()
    .optional()
    .describe("File token from upload_file. Required when type is 'file'."),
  value: z
    .string()
    .optional()
    .describe("URL or text content. Required when type is 'url' or 'text'."),
  label: z
    .string()
    .optional()
    .describe("Human-readable label shown to the buyer (e.g. 'Download link')."),
});

// --- Listing tools ---

export const createListingSchema = {
  name: z.string().describe("Product name shown to buyers."),
  price: z
    .number()
    .int()
    .min(100)
    .describe("Price in minor units (cents). Minimum $1.00 (100 cents)."),
  currency: z
    .string()
    .length(3)
    .optional()
    .describe("ISO 4217 currency code, e.g. 'USD'. Defaults to 'USD'."),
  description: z
    .string()
    .optional()
    .describe("Product description shown on the product page. Supports markdown."),
  tagline: z
    .string()
    .optional()
    .describe("Short tagline displayed below the product name."),
  stock: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe("Available stock quantity. Omit for unlimited."),
  cover: z
    .string()
    .optional()
    .describe("File token for cover image (from upload_file)."),
  metadata: z
    .record(z.string())
    .optional()
    .describe("Arbitrary key-value metadata attached to the listing."),
};

export const getListingSchema = {
  listing_id: z.string().describe(listingIdDesc),
};

export const updateListingSchema = {
  listing_id: z.string().describe(listingIdDesc),
  name: z.string().optional().describe("New product name."),
  slug: z
    .string()
    .optional()
    .describe("New URL slug. Must be globally unique."),
  price: z
    .number()
    .int()
    .min(100)
    .optional()
    .describe("New price in minor units (cents)."),
  currency: z
    .string()
    .length(3)
    .optional()
    .describe("New ISO 4217 currency code."),
  description: z.string().optional().describe("New product description."),
  tagline: z.string().optional().describe("New tagline."),
  stock: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe("New stock quantity. Omit for unlimited."),
  cover: z
    .string()
    .optional()
    .describe("New cover image file token."),
  metadata: z
    .record(z.string())
    .optional()
    .describe("Replace all metadata with these key-value pairs."),
};

export const listListingsSchema = {
  cursor: z.string().optional().describe(cursorDesc),
  limit: z.number().int().min(1).max(100).optional().describe(limitDesc),
};

export const publishListingSchema = {
  listing_id: z.string().describe(listingIdDesc),
};

export const setDeliverablesSchema = {
  listing_id: z.string().describe(listingIdDesc),
  deliverables: z
    .array(deliverableSchema)
    .min(1)
    .describe("Array of deliverables to attach. At least one required."),
};

export const removeDeliverablesSchema = {
  listing_id: z.string().describe(listingIdDesc),
};

export const deleteListingSchema = {
  listing_id: z.string().describe(listingIdDesc),
};

// --- File tools ---

export const uploadFileSchema = {
  url: z
    .string()
    .url()
    .describe(
      "Public URL of the file to upload. The server will fetch it and upload to ListBee.",
    ),
  filename: z
    .string()
    .optional()
    .describe(
      "Filename for the uploaded file. If omitted, derived from the URL.",
    ),
};

// --- Order tools ---

export const listOrdersSchema = {
  cursor: z.string().optional().describe(cursorDesc),
  limit: z.number().int().min(1).max(100).optional().describe(limitDesc),
};

export const getOrderSchema = {
  order_id: z.string().describe(orderIdDesc),
};

export const deliverOrderSchema = {
  order_id: z.string().describe(orderIdDesc),
  deliverables: z
    .array(deliverableSchema)
    .min(1)
    .describe("Deliverables to send to the buyer."),
};

// --- Stripe tools (no input params) ---
// start_stripe_connect has no input schema
