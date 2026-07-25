import type { CartItem } from '../types';
import { formatPrice } from './formatPrice';

const WHATSAPP_NUMBER = '15550000000'; // Replace with real number

export function generateWhatsAppMessage(
  items: CartItem[],
  total: number,
  customerName: string
): string {
  const lines = [
    `Hello! I would like to place an order 🛍️`,
    ``,
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
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
