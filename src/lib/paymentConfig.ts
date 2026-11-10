import { api } from './api';

/** Payment methods as set in the admin panel (Configuración). */
export type PaymentConfig = {
  paypal: { enabled: boolean; clientId: string };
};

// Used while PayPal was never saved in the panel (set in Vercel)
const BUILD_PAYPAL_CLIENT_ID: string = import.meta.env.VITE_PAYPAL_CLIENT_ID ?? '';

let pending: Promise<PaymentConfig> | null = null;

/** Loaded once per visit; a failed load is retried on the next call. */
export function loadPaymentConfig(): Promise<PaymentConfig> {
  if (!pending) {
    pending = api.config
      .payments()
      .then(({ paypal }) => ({
        paypal: paypal.configured
          ? { enabled: paypal.enabled && Boolean(paypal.clientId), clientId: paypal.clientId }
          : { enabled: Boolean(BUILD_PAYPAL_CLIENT_ID), clientId: BUILD_PAYPAL_CLIENT_ID },
      }))
      .catch((err: unknown) => {
        pending = null;
        throw err;
      });
  }
  return pending;
}
