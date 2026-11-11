// The payment options of the checkout and how they map to the API's methods.

import { useEffect, useState } from 'react';

/** What the customer picks. Card, Google Pay and Apple Pay are charged through Square. */
export type PayChoice = 'card' | 'googlePay' | 'applePay' | 'paypal' | 'transfer' | 'whatsapp';

export const SQUARE_CHOICES = ['card', 'googlePay', 'applePay'] as const;
export type SquareChoice = (typeof SQUARE_CHOICES)[number];
export const isSquareChoice = (c: PayChoice): c is SquareChoice => (SQUARE_CHOICES as readonly string[]).includes(c);

/** The order's payment method as the API knows it. */
export const methodOf = (c: PayChoice) => (isSquareChoice(c) ? 'square' : c);

declare global {
  interface Window {
    ApplePaySession?: { canMakePayments(): boolean };
  }
}

/** Apple Pay only appears where Apple allows it (Safari with a card in Wallet). */
export function useApplePayAvailable(): boolean {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    try {
      setOk(Boolean(window.ApplePaySession?.canMakePayments()));
    } catch {
      setOk(false); // only allowed on secure pages
    }
  }, []);
  return ok;
}
