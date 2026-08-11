/**
 * GTM / dataLayer push helpers.
 *
 * Import these in client components to fire events that GTM picks up and
 * forwards to GA4 as custom events.  The event names match GA4's enhanced
 * ecommerce spec so they appear in the funnel report automatically.
 *
 * Usage:
 *   import { gtmEvent, gtmAddToCart } from "@/lib/gtm";
 *   gtmAddToCart({ item_id: "SKU-123", item_name: "Blue T-Shirt", price: 29.99 });
 */

declare global {
  interface Window {
    dataLayer: object[];
  }
}

function push(event: object) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(event);
}

export function gtmPageView(path: string, title: string) {
  push({ event: "page_view", page_path: path, page_title: title });
}

export function gtmAddToCart(item: {
  item_id: string;
  item_name: string;
  price: number;
  quantity?: number;
  currency?: string;
}) {
  push({
    event: "add_to_cart",
    ecommerce: {
      currency: item.currency ?? "USD",
      value: item.price * (item.quantity ?? 1),
      items: [{ ...item, quantity: item.quantity ?? 1 }],
    },
  });
}

export function gtmBeginCheckout(items: object[], value: number, currency = "USD") {
  push({ event: "begin_checkout", ecommerce: { currency, value, items } });
}

export function gtmAddPaymentInfo(items: object[], value: number, paymentType: string, currency = "USD") {
  push({ event: "add_payment_info", ecommerce: { currency, value, payment_type: paymentType, items } });
}

export function gtmPurchase(params: {
  transaction_id: string;
  value: number;
  tax?: number;
  shipping?: number;
  currency?: string;
  items: object[];
}) {
  push({
    event: "purchase",
    ecommerce: {
      currency: params.currency ?? "USD",
      transaction_id: params.transaction_id,
      value: params.value,
      tax: params.tax ?? 0,
      shipping: params.shipping ?? 0,
      items: params.items,
    },
  });
}

/** Generic event — use for custom funnel steps not covered above */
export function gtmEvent(eventName: string, params?: object) {
  push({ event: eventName, ...params });
}
