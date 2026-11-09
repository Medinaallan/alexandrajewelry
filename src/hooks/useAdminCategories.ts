import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAdmin } from '../contexts/AdminContext';
import { useData } from '../contexts/DataContext';
import type { Category, Subcategory } from '../types';

/**
 * Every category and subcategory, active or not. The public catalog in
 * DataContext only has active ones, so an inactive one would vanish from the
 * admin and could never be switched back on.
 */
export function useAdminCategories() {
  const { token } = useAdmin();
  const { refetch: refetchCatalog } = useData();
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [cats, subs] = await Promise.all([
        api.admin.categories.list(token),
        api.admin.subcategories.list(token),
      ]);
      setCategories(cats);
      setSubcategories(subs);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las categorías.');
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  // Also refresh the public catalog so the store shows the change right away
  const refetch = useCallback(async () => {
    await Promise.all([load(), refetchCatalog()]);
  }, [load, refetchCatalog]);

  return { categories, subcategories, error, refetch };
}
