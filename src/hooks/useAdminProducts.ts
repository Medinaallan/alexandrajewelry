import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAdmin } from '../contexts/AdminContext';
import { useData } from '../contexts/DataContext';
import type { Product } from '../types';

/**
 * Every product, active or not, with internal fields (cost, minimum stock).
 * The public catalog in DataContext only has active products without those
 * fields, so admin pages must use this instead.
 */
export function useAdminProducts() {
  const { token } = useAdmin();
  const { refetch: refetchCatalog } = useData();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      setProducts(await api.admin.products.list(token));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los productos.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  // Also refresh the public catalog so the store shows the change right away
  const refetch = useCallback(async () => {
    await Promise.all([load(), refetchCatalog()]);
  }, [load, refetchCatalog]);

  return { products, loading, error, refetch };
}
