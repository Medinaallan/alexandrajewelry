import type { CartItem } from '../types';
import { formatPrice } from './formatPrice';

// The store's WhatsApp number (country code + number, digits only) comes from
// Configuración > Mi tienda; see useSiteConfig().
export function generateWhatsAppMessage(
  whatsappNumber: string,
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
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}
