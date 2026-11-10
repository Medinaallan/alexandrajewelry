import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAdmin } from '../../contexts/AdminContext';
import { useAdminProducts } from '../../hooks/useAdminProducts';
import { api, type AdminOrderInput } from '../../lib/api';
import { formatPrice } from '../../utils/formatPrice';
import type { Order } from '../../types';

const METHODS: { id: AdminOrderInput['paymentMethod']; label: string }[] = [
  { id: 'cash', label: 'Efectivo' },
  { id: 'transfer', label: 'Transferencia' },
  { id: 'paypal', label: 'PayPal o tarjeta' },
  { id: 'whatsapp', label: 'WhatsApp' },
];

type Line = { productId: number; quantity: number };

const labelStyle: React.CSSProperties = { fontSize: '0.6875rem', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' };

type Props = {
  isOpen: boolean;
  /** null: new order typed in the panel */
  order: Order | null;
  onClose(): void;
  onSaved(order: Order): void;
};

/**
 * New order taken outside the website (WhatsApp, Instagram, the store), or
 * changes to one that hasn't taken stock yet. Prices come from the products.
 */
export function OrderEditor({ isOpen, order, onClose, onSaved }: Props) {
  const { token } = useAdmin();
  const { products, loading: productsLoading } = useAdminProducts();
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', city: '', notes: '', paymentMethod: 'cash' as AdminOrderInput['paymentMethod'] });
  const [lines, setLines] = useState<Line[]>([]);
  const [pick, setPick] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Fill the form each time it opens
  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setPick('');
    if (order) {
      setForm({
        name: order.customerName,
        phone: order.customerPhone,
        email: order.customerEmail,
        address: order.customerAddress,
        city: order.customerCity,
        notes: order.notes,
        paymentMethod: (METHODS.some((m) => m.id === order.paymentMethod) ? order.paymentMethod : 'transfer') as AdminOrderInput['paymentMethod'],
      });
      setLines((Array.isArray(order.items) ? order.items : []).map((i) => ({ productId: i.productId, quantity: i.quantity })));
    } else {
      setForm({ name: '', phone: '', email: '', address: '', city: '', notes: '', paymentMethod: 'cash' });
      setLines([]);
    }
  }, [isOpen, order]);

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const available = useMemo(
    () => products.filter((p) => p.active && !lines.some((l) => l.productId === p.id)).sort((a, b) => a.name.localeCompare(b.name)),
    [products, lines]
  );
  const total = lines.reduce((sum, l) => sum + (byId.get(l.productId)?.price ?? 0) * l.quantity, 0);

  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const addLine = () => {
    const id = Number(pick);
    if (!id) return;
    setLines((ls) => [...ls, { productId: id, quantity: 1 }]);
    setPick('');
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!form.name.trim() || !form.phone.trim()) return setError('El nombre y el teléfono son obligatorios.');
    if (lines.length === 0) return setError('Agrega al menos un producto.');
    setSaving(true);
    setError('');
    try {
      const data: AdminOrderInput = { ...form, items: lines };
      const saved = order ? await api.admin.orders.update(token, order.id, data) : await api.admin.orders.createManual(token, data);
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el pedido.');
    } finally {
      setSaving(false);
    }
  };

  const field = (key: keyof typeof form, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="flex flex-col gap-1">
      <span style={labelStyle}>{label}</span>
      <input className="form-input" value={form[key]} onChange={(e) => set(key, e.target.value)} {...props} />
    </label>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={order ? `Editar pedido #${order.id}` : 'Nuevo pedido'} size="lg">
      <form onSubmit={save} className="flex flex-col gap-4" style={{ maxHeight: '75vh', overflowY: 'auto', paddingRight: 4 }}>
        {!order && (
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Para pedidos que llegan por WhatsApp, Instagram o en la tienda. Queda como <strong>Pendiente</strong>; cuando lo cobres, márcalo como Pagado y el stock se descuenta.
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {field('name', 'Nombre *', { autoComplete: 'off' })}
          {field('phone', 'Teléfono *', { type: 'tel', autoComplete: 'off' })}
          {field('email', 'Correo (opcional, para avisarle)', { type: 'email', autoComplete: 'off' })}
          <label className="flex flex-col gap-1">
            <span style={labelStyle}>Forma de pago</span>
            <select className="form-input" value={form.paymentMethod} onChange={(e) => set('paymentMethod', e.target.value)}>
              {METHODS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </label>
          {field('address', 'Dirección (opcional)')}
          {field('city', 'Ciudad (opcional)')}
        </div>
        <label className="flex flex-col gap-1">
          <span style={labelStyle}>Notas del cliente</span>
          <textarea className="form-input resize-none" rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </label>

        <div>
          <span style={labelStyle}>Productos</span>
          <ul className="flex flex-col gap-2 mt-2">
            {lines.map((l) => {
              const p = byId.get(l.productId);
              const max = Math.max(1, p?.stock ?? 1);
              return (
                <li key={l.productId} className="flex items-center gap-3" style={{ fontSize: '0.8125rem' }}>
                  <span className="flex-1 min-w-0 truncate">
                    {p ? `${p.name} (${p.code})` : `Producto #${l.productId}`}
                    <span style={{ color: 'var(--text-muted)' }}> · {p ? `${formatPrice(p.price)} · stock ${p.stock}` : ''}</span>
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={max}
                    aria-label="Cantidad"
                    className="form-input"
                    style={{ width: 72, padding: '0.375rem 0.5rem' }}
                    value={l.quantity}
                    onChange={(e) => {
                      const q = Math.max(1, Math.min(99, Number(e.target.value) || 1));
                      setLines((ls) => ls.map((x) => (x.productId === l.productId ? { ...x, quantity: q } : x)));
                    }}
                  />
                  <span style={{ width: 80, textAlign: 'right' }}>{formatPrice((p?.price ?? 0) * l.quantity)}</span>
                  <button type="button" onClick={() => setLines((ls) => ls.filter((x) => x.productId !== l.productId))} className="hover:text-red-500" aria-label="Quitar producto" style={{ color: 'var(--text-muted)' }}>
                    <Trash2 size={14} />
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex gap-2 mt-3">
            <select className="form-input flex-1" value={pick} onChange={(e) => setPick(e.target.value)} disabled={productsLoading} aria-label="Producto para agregar">
              <option value="">{productsLoading ? 'Cargando productos…' : 'Elige un producto…'}</option>
              {available.map((p) => (
                <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                  {p.code} — {p.name} · {formatPrice(p.price)} · {p.stock > 0 ? `stock ${p.stock}` : 'agotado'}
                </option>
              ))}
            </select>
            <Button type="button" variant="outline" size="sm" onClick={addLine} disabled={!pick}>
              <Plus size={14} /> Agregar
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border)' }}>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem' }}>Total {formatPrice(total)}</span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="gold" size="sm" isLoading={saving}>{order ? 'Guardar cambios' : 'Crear pedido'}</Button>
          </div>
        </div>
        {error && <p role="alert" style={{ fontSize: '0.8125rem', color: '#ef4444' }}>{error}</p>}
      </form>
    </Modal>
  );
}
