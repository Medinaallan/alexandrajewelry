// PayPal JS SDK, used with the store's public Client ID only.
// Without the account's secret the API cannot confirm payments with PayPal,
// so a payment made here is reported to the order and the admin checks it
// in PayPal before marking the order paid.

export const PAYPAL_CLIENT_ID: string = import.meta.env.VITE_PAYPAL_CLIENT_ID ?? '';
export const PAYPAL_CURRENCY = 'USD';

type OrderActions = {
  order: {
    create(body: unknown): Promise<string>;
    capture(): Promise<PayPalCapture>;
  };
};

export type PayPalCapture = {
  id: string;
  status: string;
  purchase_units?: Array<{
    payments?: { captures?: Array<{ id: string; status: string; amount?: { value: string } }> };
  }>;
};

export type PayPalButtonsOptions = {
  style?: Record<string, unknown>;
  createOrder(data: unknown, actions: OrderActions): Promise<string>;
  onApprove(data: unknown, actions: OrderActions): Promise<void>;
  onCancel?(): void;
  onError?(err: unknown): void;
};

type PayPalButtons = { render(container: HTMLElement): Promise<void>; close(): Promise<void> };
type PayPalNamespace = { Buttons(options: PayPalButtonsOptions): PayPalButtons };

declare global {
  interface Window {
    paypal?: PayPalNamespace;
  }
}

let loading: Promise<PayPalNamespace> | null = null;

/** Loads the SDK once; later calls reuse it. */
export function loadPayPal(): Promise<PayPalNamespace> {
  if (window.paypal) return Promise.resolve(window.paypal);
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const params = new URLSearchParams({
        'client-id': PAYPAL_CLIENT_ID,
        currency: PAYPAL_CURRENCY,
        intent: 'capture',
        components: 'buttons',
      });
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?${params}`;
      script.async = true;
      script.onload = () => (window.paypal ? resolve(window.paypal) : reject(new Error('PayPal no cargó')));
      script.onerror = () => {
        loading = null; // allow a retry
        script.remove();
        reject(new Error('PayPal no cargó'));
      };
      document.head.appendChild(script);
    });
  }
  return loading;
}

/** The capture inside PayPal's answer (the id the merchant sees in PayPal). */
export function captureOf(result: PayPalCapture) {
  return result.purchase_units?.[0]?.payments?.captures?.[0] ?? null;
}
