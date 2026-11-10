import { useEffect, useState } from 'react';
import { api } from './api';
import { STORE } from '../utils/store';

// What the operator set in the panel (Configuración > Mi tienda, Cuentas
// bancarias, PayPal), read once per visit. Until it loads, or if it fails,
// the site uses the defaults in utils/store.ts.

export type StoreInfo = {
  name: string;
  street: string;
  cityLine: string;
  phone: string;
  /** Country code + number, digits only */
  whatsapp: string;
  email: string;
  /** One line per row; empty: not shown */
  hours: string;
  /** Empty: the top bar is hidden */
  topbarMessage: string;
};

export type BankAccount = { bank: string; holder: string; number: string; details: string };

export type SiteConfig = {
  store: StoreInfo;
  bankAccounts: BankAccount[];
  paypal: { enabled: boolean; clientId: string };
};

// Used while PayPal was never saved in the panel (set in Vercel)
const BUILD_PAYPAL_CLIENT_ID: string = import.meta.env.VITE_PAYPAL_CLIENT_ID ?? '';

export const DEFAULT_CONFIG: SiteConfig = {
  store: {
    name: STORE.name,
    street: STORE.street,
    cityLine: STORE.cityLine,
    phone: STORE.phone,
    whatsapp: import.meta.env.VITE_WHATSAPP_NUMBER || '14137709901',
    email: STORE.email,
    hours: '',
    topbarMessage: '',
  },
  bankAccounts: [],
  paypal: { enabled: Boolean(BUILD_PAYPAL_CLIENT_ID), clientId: BUILD_PAYPAL_CLIENT_ID },
};

let pending: Promise<SiteConfig> | null = null;
let loaded: SiteConfig | null = null;

/** Loaded once per visit; a failed load is retried on the next call. */
export function loadSiteConfig(): Promise<SiteConfig> {
  if (!pending) {
    pending = api.config
      .site()
      .then(({ store, bankAccounts, paypal }) => {
        loaded = {
          store: { ...DEFAULT_CONFIG.store, ...store, whatsapp: store.whatsapp || DEFAULT_CONFIG.store.whatsapp },
          bankAccounts,
          paypal: paypal.configured
            ? { enabled: paypal.enabled && Boolean(paypal.clientId), clientId: paypal.clientId }
            : DEFAULT_CONFIG.paypal,
        };
        return loaded;
      })
      .catch((err: unknown) => {
        pending = null;
        throw err;
      });
  }
  return pending;
}

/** The site config for components: defaults first, the real values once loaded. */
export function useSiteConfig(): SiteConfig {
  const [config, setConfig] = useState<SiteConfig>(loaded ?? DEFAULT_CONFIG);
  useEffect(() => {
    let active = true;
    loadSiteConfig()
      .then((c) => { if (active) setConfig(c); })
      .catch(() => {});
    return () => { active = false; };
  }, []);
  return config;
}

/** Google Maps links for the store's address */
export function mapsLinks(store: StoreInfo) {
  const q = encodeURIComponent([store.street, store.cityLine].filter(Boolean).join(', '));
  return {
    url: `https://www.google.com/maps/search/?api=1&query=${q}`,
    embed: `https://www.google.com/maps?q=${q}&output=embed`,
  };
}

/** tel: link from a phone as written ("413-770-9901" -> "tel:+14137709901") */
export function telHref(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return `tel:+${digits.length === 10 ? `1${digits}` : digits}`;
}

export const whatsappUrl = (number: string) => `https://wa.me/${number}`;
