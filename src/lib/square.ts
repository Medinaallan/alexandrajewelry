// Square Web Payments SDK: the card form, Google Pay and Apple Pay on the
// checkout. The browser only turns what the customer enters into a one-time
// token; the API charges it with the store's secret token (see the API's
// square.ts), so the payment is confirmed on the spot.
// Configured in the admin panel, Configuración > Square.

export const SQUARE_CURRENCY = 'USD';

export type SquareEnvironment = 'production' | 'sandbox';
export type SquareMethods = { card: boolean; googlePay: boolean; applePay: boolean };
export type SquareConfig = {
  enabled: boolean;
  environment: SquareEnvironment;
  applicationId: string;
  locationId: string;
  methods: SquareMethods;
};

export type TokenResult = {
  status: 'OK' | 'Cancel' | 'Invalid' | 'Abort' | 'Unknown' | string;
  token?: string;
  errors?: Array<{ message?: string; field?: string; type?: string }>;
  details?: { method?: string };
};

export type VerificationDetails = {
  amount: string;
  currencyCode: string;
  intent: 'CHARGE';
  customerInitiated: boolean;
  sellerKeyedIn: boolean;
  billingContact: {
    givenName?: string;
    familyName?: string;
    email?: string;
    phone?: string;
    countryCode?: string;
  };
};

export type SquareCard = {
  attach(selector: string | HTMLElement): Promise<void>;
  tokenize(verification?: VerificationDetails): Promise<TokenResult>;
  destroy(): Promise<boolean>;
};

export type SquareWallet = {
  attach?(selector: string | HTMLElement, options?: Record<string, unknown>): Promise<void>;
  tokenize(): Promise<TokenResult>;
  destroy(): Promise<boolean>;
};

type PaymentRequest = unknown;

export type SquarePayments = {
  card(options?: Record<string, unknown>): Promise<SquareCard>;
  paymentRequest(options: {
    countryCode: string;
    currencyCode: string;
    total: { amount: string; label: string };
  }): PaymentRequest;
  googlePay(request: PaymentRequest): Promise<SquareWallet>;
  applePay(request: PaymentRequest): Promise<SquareWallet>;
  /** Older SDKs: 3-D Secure check returning a verification token */
  verifyBuyer?(sourceId: string, details: unknown): Promise<{ token?: string } | null>;
};

type SquareNamespace = { payments(applicationId: string, locationId: string): SquarePayments };

declare global {
  interface Window {
    Square?: SquareNamespace;
  }
}

const SDK_URL: Record<SquareEnvironment, string> = {
  production: 'https://web.squarecdn.com/v1/square.js',
  sandbox: 'https://sandbox.web.squarecdn.com/v1/square.js',
};

let loading: { env: SquareEnvironment; promise: Promise<SquareNamespace> } | null = null;

/** Loads the SDK once per environment; later calls reuse it. */
export function loadSquare(environment: SquareEnvironment): Promise<SquareNamespace> {
  if (loading?.env === environment) return loading.promise;
  const promise = new Promise<SquareNamespace>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SDK_URL[environment];
    script.async = true;
    script.onload = () => (window.Square ? resolve(window.Square) : reject(new Error('Square no cargó')));
    script.onerror = () => {
      loading = null; // allow a retry
      script.remove();
      reject(new Error('Square no cargó'));
    };
    document.head.appendChild(script);
  });
  loading = { env: environment, promise };
  return promise;
}

/** "Ana María Pérez" → { givenName: "Ana", familyName: "María Pérez" } */
export function splitName(name: string) {
  const [givenName = '', ...rest] = name.trim().split(/\s+/);
  return { givenName, familyName: rest.join(' ') };
}
