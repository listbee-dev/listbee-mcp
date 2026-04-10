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
  set_deliverables:    (c, a) => c.listings.setDeliverables(a.listing_id as string, a as any),
  remove_deliverables: (c, a) => c.listings.removeDeliverables(a.listing_id as string),

  // Orders
  list_orders:         (c, a) => c.orders.list(a as any),
  get_order:           (c, a) => c.orders.get(a.order_id as string),
  fulfill_order:       (c, a) => { const { order_id, ...p } = a; return c.orders.fulfill(order_id as string, p as any); },
  refund_order:        (c, a) => c.orders.refund(a.order_id as string),

  // Customers
  list_customers:      (c, a) => c.customers.list(a as any),
  get_customer:        (c, a) => c.customers.get(a.customer_id as string),

  // Account
  get_account:         (c) => c.account.get(),
  update_account:      (c, a) => c.account.update(a as any),
  delete_account:      (c) => c.account.delete(),

  // Store
  get_store:           async (c) => { const r = await c.get('/v1/store'); return r.json(); },
  update_store:        async (c, a) => { const r = await c.put('/v1/store', a); return r.json(); },

  // Stripe
  disconnect_stripe:   (c) => c.stripe.disconnect(),

  // Webhooks
  list_webhooks:       (c) => c.webhooks.list(),
  create_webhook:      (c, a) => c.webhooks.create(a as any),
  update_webhook:      (c, a) => { const { webhook_id, ...p } = a; return c.webhooks.update(webhook_id as string, p as any); },
  delete_webhook:      (c, a) => c.webhooks.delete(a.webhook_id as string),
  list_webhook_events: (c, a) => { const { webhook_id, ...p } = a; return c.webhooks.listEvents(webhook_id as string, p as any); },
  retry_webhook_event: (c, a) => c.webhooks.retryEvent(a.webhook_id as string, a.event_id as string),
  test_webhook:        (c, a) => c.webhooks.test(a.webhook_id as string),
};
