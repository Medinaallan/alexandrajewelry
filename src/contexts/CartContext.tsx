import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { CartContextType, CartItem, Product } from '../types';
import { useData } from './DataContext';

const CART_KEY = 'alexandra-cart';

const CartContext = createContext<CartContextType | null>(null);

function loadCart(): CartItem[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(CART_KEY) ?? '[]');
    if (!Array.isArray(saved)) return [];
    return saved.filter(
      (i): i is CartItem =>
        typeof i?.product?.id === 'number' && Number.isInteger(i?.quantity) && i.quantity > 0
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { products, loading, error } = useData();
  const [items, setItems] = useState<CartItem[]>(loadCart);
  const [isOpen, setIsOpen] = useState(false);

  // The cart survives a page reload
  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {
      // storage full or blocked: the cart just won't be remembered
    }
  }, [items]);

  // Once the catalog is loaded, refresh saved items with current prices and
  // drop products that are no longer on sale.
  useEffect(() => {
    if (loading || error) return;
    setItems((prev) =>
      prev.flatMap((item) => {
        const current = products.find((p) => p.id === item.product.id && p.active);
        return current ? [{ ...item, product: current }] : [];
      })
    );
  }, [products, loading, error]);

  const addItem = useCallback((product: Product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { product, quantity }];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((productId: number) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.product.id !== productId));
    } else {
      setItems((prev) =>
        prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
      );
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const totalItems = items.reduce((acc, i) => acc + i.quantity, 0);
  const subtotal = items.reduce((acc, i) => acc + i.product.price * i.quantity, 0);
  const total = subtotal; // Free shipping

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        total,
        isOpen,
        openCart,
        closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
