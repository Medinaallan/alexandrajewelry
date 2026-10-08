import type { CartItem } from '../types';
import { formatPrice } from './formatPrice';

// Store's WhatsApp number: country code + number, digits only.
// Set VITE_WHATSAPP_NUMBER in .env.local and in the Vercel project settings.
export const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER ?? '15550000000';

export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

export function generateWhatsAppMessage(
  items: CartItem[],
  total: number,
  customerName: string,
  orderId?: number
): string {
  const lines = [
    `Hello! I would like to place an order 🛍️`,
    ``,
    ...(orderId ? [`*Order #${orderId}*`] : []),
    `*Customer:* ${customerName}`,
    ``,
    `*Order Details:*`,
    ...items.map(
      (item) =>
        `• ${item.product.name} x${item.quantity} — ${formatPrice(item.product.price * item.quantity)}`
    ),
    ``,
    `*Total: ${formatPrice(total)}*`,
    ``,
    `Please confirm availability and payment details. Thank you!`,
  ];

  const message = lines.join('\n');
  return `${WHATSAPP_URL}?text=${encodeURIComponent(message)}`;
}
