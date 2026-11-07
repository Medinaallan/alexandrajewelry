import type { Product } from '../types';

/** Units of a product that can go in the cart: never more than in stock. */
export function maxUnits(product: Product): number {
  return product.active ? Math.max(0, product.stock) : 0;
}
