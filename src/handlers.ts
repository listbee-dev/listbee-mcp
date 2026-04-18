import type { ListBee } from "listbee";

export type Handler = (client: ListBee, args: Record<string, unknown>) => Promise<unknown>;

export const handlers: Record<string, Handler> = {
  // Listings
  create_listing:      (c, a) => c.listings.create(a as any),
  get_listing:         (c, a) => c.listings.get(a.listing_id as string),
  list_listings:       (c, a) => c.listings.list(a as any),
  update_listing:      (c, a) => { const { listing_id, ...p } = a; return c.listings.update(listing_id as string, p as any); },
  delete_listing:      (c, a) => c.listings.delete(a.listing_id as string),
  publish_listing:     (c, a) => c.listings.publish(a.listing_id as string),

  // Orders
  list_orders:         (c, a) => c.orders.list(a as any),
  get_order:           (c, a) => c.orders.get(a.order_id as string),
  fulfill_order:       (c, a) => { const { order_id, ...p } = a; return c.orders.fulfill(order_id as string, p as any); },
  refund_order:        (c, a) => c.orders.refund(a.order_id as string),
  order_redeliver:     (c, a) => c.orders.redeliver(a.order_id as string),

  // Account
  get_account:         (c) => c.account.get(),
  update_account:      (c, a) => c.account.update(a as any),
  delete_account:      (c) => c.account.delete(),

  // Stripe
  disconnect_stripe:   (c) => c.stripe.disconnect(),

  // API Keys
  api_key_self_revoke: (c) => c.apiKeys.selfRevoke(),
};
