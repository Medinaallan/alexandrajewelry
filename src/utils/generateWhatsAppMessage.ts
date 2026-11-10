import type { CartItem } from '../types';
import { formatPrice } from './formatPrice';

// Store's WhatsApp number: country code + number, digits only.
// Set VITE_WHATSAPP_NUMBER in .env.local and in the Vercel project settings.
export const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '14137709901';

export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

export function generateWhatsAppMessage(
  items: CartItem[],
  total: number,
  customerName: string,
  orderId?: number
): string {
  const lines = [
    `¡Hola! Quiero hacer un pedido 🛍️`,
    ``,
    ...(orderId ? [`*Pedido #${orderId}*`] : []),
    `*Cliente:* ${customerName}`,
    ``,
    `*Detalle del pedido:*`,
    ...items.map(
      (item) =>
        `• ${item.product.name} x${item.quantity} — ${formatPrice(item.product.price * item.quantity)}`
    ),
    ``,
    `*Total: ${formatPrice(total)}*`,
    ``,
    `Por favor confírmenme la disponibilidad y cómo pagar. ¡Gracias!`,
  ];

  const message = lines.join('\n');
  return `${WHATSAPP_URL}?text=${encodeURIComponent(message)}`;
}
