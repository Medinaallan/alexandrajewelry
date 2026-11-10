import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BadgeCheck, CheckCircle2, ChevronDown, Clock, Download, ExternalLink, FileText, Hand, MessageCircle, Package, Pencil, Plus,
  Search, Send, StickyNote, Undo2, XCircle, type LucideIcon,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { NEW_ORDER_EVENT, ORDERS_CHANGED_EVENT } from '../../lib/orderAlerts';
import { useAdmin } from '../../contexts/AdminContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../lib/api';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { formatPrice } from '../../utils/formatPrice';
import { Button } from '../../components/ui/Button';
import { OrderEditor } from '../../components/admin/OrderEditor';
import { downloadExcel, datedName, MONEY_FORMAT, DATE_FORMAT } from '../../lib/adminExcel';
import type { Order, OrderStatus } from '../../types';

// ─── Where each order is in its life ─────────────────────────────────────────
// The operator never picks a status from a list. The system moves orders on
// its own where it can (PayPal payment or transfer receipt -> payment to
// verify; unpaid PayPal after 24 h -> cancelled), and for the rest she presses
// the one button that says what just happened ("Ya me pagó", "Ya lo envié").

type Stage = 'verify' | 'collect' | 'waiting' | 'ship' | 'shipped' | 'done' | 'cancelled';

const isOpen = (o: Order) => o.status === 'pending' || o.status === 'confirmed';

function stageOf(o: Order): Stage {
  if (o.status === 'cancelled') return 'cancelled';
  if (o.status === 'delivered') return 'done';
  if (o.status === 'shipped') return 'shipped';
  if (o.status === 'paid') return 'ship';
  if (o.status === 'review') return 'verify';
  // Still open but paid on PayPal: the stock ran out while paying -> verify too
  if (o.paymentRef) return 'verify';
  // Web PayPal orders wait for the customer; panel orders are collected by her
  if (o.paymentMethod === 'paypal' && o.source === 'web') return 'waiting';
  return 'collect';
}

const STAGE: Record<Stage, { label: string; color: string; Icon: LucideIcon }> = {
  verify: { label: 'Pago por verificar', color: '#0284c7', Icon: BadgeCheck },
  collect: { label: 'Por cobrar', color: '#d97706', Icon: Hand },
  waiting: { label: 'Esperando pago del cliente', color: '#6b7280', Icon: Clock },
  ship: { label: 'Para enviar', color: '#7c3aed', Icon: Package },
  shipped: { label: 'Enviado', color: '#4f46e5', Icon: Send },
  done: { label: 'Entregado', color: '#16a34a', Icon: CheckCircle2 },
  cancelled: { label: 'Cancelado', color: '#ef4444', Icon: XCircle },
};

type View = 'todo' | Stage | 'all';
const VIEWS: { id: View; label: string; stages: Stage[] }[] = [
  { id: 'todo', label: 'Por hacer', stages: ['verify', 'collect', 'ship'] },
  { id: 'verify', label: 'Pagos por verificar', stages: ['verify'] },
  { id: 'collect', label: 'Por cobrar', stages: ['collect'] },
  { id: 'ship', label: 'Para enviar', stages: ['ship'] },
  { id: 'waiting', label: 'Esperando pago', stages: ['waiting'] },
  { id: 'shipped', label: 'Enviados', stages: ['shipped'] },
  { id: 'done', label: 'Entregados', stages: ['done'] },
  { id: 'cancelled', label: 'Cancelados', stages: ['cancelled'] },
  { id: 'all', label: 'Todos', stages: ['verify', 'collect', 'waiting', 'ship', 'shipped', 'done', 'cancelled'] },
];
// Links from the summary page (?view=attend means "por cobrar")
const VIEW_ALIASES: Record<string, View> = { attend: 'collect' };

type Step = { label: string; to: OrderStatus; Icon: LucideIcon; confirm: string; primary?: boolean };

/** The buttons for the next thing that happens to the order. */
function nextSteps(o: Order): Step[] {
  const mail = o.customerEmail ? ' Le avisamos al cliente por correo.' : '';
  switch (stageOf(o)) {
    case 'verify':
      return [{
        label: 'Sí, el pago llegó',
        to: 'paid',
        Icon: BadgeCheck,
        primary: true,
        confirm: `Confirmas que el dinero del pedido #${o.id} (${formatPrice(o.total)}) ya está en la cuenta de la tienda. El pedido pasa a «Para enviar».${mail}`,
      }];
    case 'collect':
      return [{
        label: 'Ya me pagó',
        to: 'paid',
        Icon: BadgeCheck,
        primary: true,
        confirm: `Confirmas que el cliente ya pagó ${formatPrice(o.total)}. Se descuenta el stock y se registra la venta. El pedido pasa a «Para enviar».${mail}`,
      }];
    case 'ship':
      return [
        { label: 'Ya lo envié', to: 'shipped', Icon: Send, primary: true, confirm: `El pedido #${o.id} pasa a «Enviado».${mail}` },
        { label: 'Lo entregué en mano', to: 'delivered', Icon: Hand, confirm: `El cliente ya tiene su pedido #${o.id}. Queda como «Entregado».${mail}` },
      ];
    case 'shipped':
      return [{ label: 'El cliente ya lo recibió', to: 'delivered', Icon: CheckCircle2, primary: true, confirm: `El pedido #${o.id} queda como «Entregado».${mail}` }];
    default:
      return [];
  }
}

/** One step back, for a button pressed by mistake. */
function undoStep(o: Order): Step | null {
  const mail = o.customerEmail ? ' (el cliente no recibe otro correo por esto)' : '';
  switch (o.status) {
    case 'paid':
      return o.paymentRef || o.receiptAt
        ? { label: 'Deshacer: volver a «Pago por verificar»', to: 'review', Icon: Undo2, confirm: `El pedido #${o.id} vuelve a «Pago por verificar».` }
        : { label: 'Deshacer: todavía no pagó', to: 'pending', Icon: Undo2, confirm: `El pedido #${o.id} vuelve a «Por cobrar». El stock se devuelve y la venta se quita de los reportes.` };
    case 'shipped':
      return { label: 'Deshacer: todavía no lo envié', to: 'paid', Icon: Undo2, confirm: `El pedido #${o.id} vuelve a «Para enviar».` };
    case 'delivered':
      return { label: 'Deshacer: todavía no lo recibió', to: 'paid', Icon: Undo2, confirm: `El pedido #${o.id} vuelve a «Para enviar».` };
    case 'review':
      return { label: 'El pago no llegó', to: 'pending', Icon: Undo2, confirm: `El pedido #${o.id} vuelve a «Por cobrar» y el stock apartado se libera. Contacta al cliente para resolverlo${mail}.` };
    default:
      return null;
  }
}

/** WhatsApp chat with the customer, with the order number already written. */
function customerWhatsAppUrl(order: Order): string | null {
  let digits = order.customerPhone.replace(/\D/g, '');
  if (digits.length < 7) return null;
  // The store is in the US: a 10-digit number gets the +1 country code
  if (digits.length === 10) digits = `1${digits}`;
  const firstName = order.customerName.trim().split(/\s+/)[0] ?? '';
  const text = `Hola ${firstName}, te escribimos de Alexandra Jewelry por tu pedido #${order.id}.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

const canEdit = (o: Order) => isOpen(o) && !o.paymentRef && !o.receiptAt;

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AdminOrdersPage() {
  const { token } = useAdmin();
  const { t } = useLanguage();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<number | null>(null);
  const [params] = useSearchParams();
  const initialView = (() => {
    const v = params.get('view') ?? '';
    const view = (VIEW_ALIASES[v] ?? v) as View;
    return VIEWS.some((x) => x.id === view) ? view : params.get('q') ? 'all' : 'todo';
  })();
  const [view, setView] = useState<View>(initialView);
  // ?q= comes from the Customers page ("Ver pedidos")
  const [search, setSearch] = useState(() => params.get('q') ?? '');
  const [editor, setEditor] = useState<{ open: boolean; order: Order | null }>({ open: false, order: null });
  const [moreFor, setMoreFor] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      setOrders(await api.admin.orders.list(token));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.orders.error'));
    } finally {
      setLoading(false);
    }
  }, [token, t]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  // Reload when the panel announces a new order or payment
  useEffect(() => {
    const onNew = () => void fetchData();
    window.addEventListener(NEW_ORDER_EVENT, onNew);
    return () => window.removeEventListener(NEW_ORDER_EVENT, onNew);
  }, [fetchData]);

  const replace = (updated: Order) => setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));

  const onSaved = (saved: Order) => {
    setOrders((prev) => (prev.some((o) => o.id === saved.id) ? prev.map((o) => (o.id === saved.id ? saved : o)) : [saved, ...prev]));
    setEditor({ open: false, order: null });
    window.dispatchEvent(new Event(ORDERS_CHANGED_EVENT));
    void Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: `Pedido #${saved.id} guardado`, showConfirmButton: false, timer: 2500 });
  };

  /** Runs one step after she confirms what it will do. */
  const runStep = async (order: Order, step: Step) => {
    if (!token) return;
    const { isConfirmed } = await Swal.fire({
      title: step.label,
      text: step.confirm,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'No',
      reverseButtons: true,
    });
    if (!isConfirmed) return;
    setBusy(order.id);
    try {
      replace(await api.admin.orders.updateStatus(token, order.id, step.to));
      setError('');
      setMoreFor(null);
      window.dispatchEvent(new Event(ORDERS_CHANGED_EVENT));
      void Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Listo', showConfirmButton: false, timer: 2000 });
    } catch (err) {
      void Swal.fire('No se pudo', err instanceof Error ? err.message : t('admin.orders.error'), 'error');
    } finally {
      setBusy(null);
    }
  };

  const cancelOrder = async (order: Order) => {
    if (!token) return;
    const stockBack = ['review', 'paid', 'shipped', 'delivered'].includes(order.status);
    const { isConfirmed } = await Swal.fire({
      title: `¿Cancelar el pedido #${order.id}?`,
      text: [
        stockBack ? 'Las piezas vuelven al stock y la venta se quita de los reportes.' : 'El pedido queda cancelado.',
        order.paymentRef ? `Este pedido se pagó con PayPal (${order.paymentRef}): devuélvele el dinero al cliente desde PayPal.` : '',
        order.receiptAt ? 'El cliente envió un comprobante de transferencia: si te pagó, devuélvele el dinero.' : '',
        order.customerEmail ? 'Le avisamos al cliente por correo.' : '',
      ].filter(Boolean).join(' '),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar pedido',
      cancelButtonText: 'No',
      confirmButtonColor: '#ef4444',
      reverseButtons: true,
    });
    if (!isConfirmed) return;
    setBusy(order.id);
    try {
      replace(await api.admin.orders.updateStatus(token, order.id, 'cancelled'));
      setMoreFor(null);
      window.dispatchEvent(new Event(ORDERS_CHANGED_EVENT));
    } catch (err) {
      void Swal.fire('No se pudo', err instanceof Error ? err.message : t('admin.orders.error'), 'error');
    } finally {
      setBusy(null);
    }
  };

  const editNotes = async (order: Order) => {
    if (!token) return;
    const { value, isConfirmed } = await Swal.fire({
      title: `Nota interna · pedido #${order.id}`,
      text: 'Solo la ve la tienda.',
      input: 'textarea',
      inputValue: order.adminNotes,
      inputAttributes: { maxlength: '2000' },
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
    });
    if (!isConfirmed) return;
    try {
      replace(await api.admin.orders.setNotes(token, order.id, String(value ?? '').trim()));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.orders.error'));
    }
  };

  const openReceipt = async (order: Order) => {
    if (!token) return;
    // Open the tab right away (inside the click) so it isn't blocked as a pop-up
    const tab = window.open('', '_blank');
    try {
      const blob = await api.admin.orders.receipt(token, order.id);
      const url = URL.createObjectURL(blob);
      if (tab) tab.location.href = url;
      else window.location.href = url;
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setError('');
    } catch (err) {
      tab?.close();
      setError(err instanceof Error ? err.message : t('admin.orders.error'));
    }
  };

  const exportExcel = (list: Order[]) =>
    void downloadExcel(datedName('pedidos'), 'Pedidos', [
      { header: 'Pedido', width: 9, value: (o: Order) => o.id },
      { header: 'Fecha', width: 18, value: (o) => new Date(o.createdAt), format: DATE_FORMAT },
      { header: 'Estado', width: 22, value: (o) => STAGE[stageOf(o)].label },
      { header: 'Origen', width: 10, value: (o) => (o.source === 'manual' ? 'Panel' : 'Web') },
      { header: 'Cliente', width: 24, value: (o) => o.customerName },
      { header: 'Teléfono', width: 16, value: (o) => o.customerPhone },
      { header: 'Correo', width: 26, value: (o) => o.customerEmail },
      { header: 'Dirección', width: 30, value: (o) => [o.customerAddress, o.customerCity].filter(Boolean).join(', ') },
      { header: 'Productos', width: 40, value: (o) => (Array.isArray(o.items) ? o.items : []).map((i) => `${i.quantity} x ${i.name} (${i.code})`).join('; ') },
      { header: 'Total', width: 12, value: (o) => o.total, format: MONEY_FORMAT },
      { header: 'Forma de pago', width: 16, value: (o) => t(`checkout.${o.paymentMethod}`) },
      { header: 'Referencia PayPal', width: 20, value: (o) => o.paymentRef ?? '' },
      { header: 'Notas del cliente', width: 30, value: (o) => o.notes },
      { header: 'Nota interna', width: 30, value: (o) => o.adminNotes },
    ], list);

  const counts = useMemo(() => {
    const byStage = {} as Record<Stage, number>;
    for (const o of orders) byStage[stageOf(o)] = (byStage[stageOf(o)] ?? 0) + 1;
    return byStage;
  }, [orders]);
  const countFor = (v: (typeof VIEWS)[number]) => v.stages.reduce((n, s) => n + (counts[s] ?? 0), 0);

  const visible = useMemo(() => {
    const stages = VIEWS.find((v) => v.id === view)?.stages ?? [];
    const q = search.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, '');
    return orders.filter((o) => {
      if (!q && !stages.includes(stageOf(o))) return false;
      if (!q) return true;
      return (
        String(o.id) === q.replace(/^#/, '') ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerCity.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q) ||
        (qDigits.length >= 3 && o.customerPhone.replace(/\D/g, '').includes(qDigits))
      );
    });
  }, [orders, view, search]);

  const linkBtn = 'inline-flex items-center gap-1.5 hover:text-(--gold) transition-colors';

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content p-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.25rem', fontWeight: 300, color: 'var(--text)' }}>Pedidos</h1>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => exportExcel(visible)} disabled={visible.length === 0} title="Exporta los pedidos que se ven ahora">
              <Download size={16} /> Exportar a Excel
            </Button>
            <Button variant="gold" onClick={() => setEditor({ open: true, order: null })}>
              <Plus size={18} /> Nuevo pedido
            </Button>
          </div>
        </div>
        <OrderEditor isOpen={editor.open} order={editor.order} onClose={() => setEditor({ open: false, order: null })} onSaved={onSaved} />

        {error && <p role="alert" style={{ color: '#ef4444', fontSize: '0.9375rem', marginBottom: '12px' }}>{error}</p>}

        {/* Views */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {VIEWS.map((v) => {
            const active = view === v.id && !search;
            const n = countFor(v);
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => { setView(v.id); setSearch(''); }}
                aria-pressed={active}
                style={{
                  padding: '8px 14px',
                  fontSize: '0.9375rem',
                  borderRadius: '999px',
                  border: `2px solid ${active ? 'var(--gold)' : 'var(--border)'}`,
                  background: active ? 'rgba(201,164,93,0.15)' : 'var(--bg)',
                  color: active ? 'var(--text)' : 'var(--text-muted)',
                  fontWeight: active ? 600 : 400,
                }}
              >
                {v.label} ({n})
              </button>
            );
          })}
        </div>
        <div className="relative mb-6" style={{ maxWidth: 420 }}>
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por número, nombre, teléfono o ciudad"
            aria-label="Buscar pedidos"
            className="form-input"
            style={{ padding: '0.625rem 0.75rem 0.625rem 2.25rem', fontSize: '0.9375rem' }}
          />
        </div>

        {loading && orders.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Cargando…</p>
        ) : visible.length === 0 ? (
          <p className="p-8 text-center" style={{ color: 'var(--text-muted)', fontSize: '1rem', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px' }}>
            {search ? 'Ningún pedido coincide con la búsqueda.' : view === 'todo' ? '¡Todo al día! No hay pedidos pendientes.' : 'No hay pedidos aquí.'}
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {visible.map((o) => {
              const stage = stageOf(o);
              const st = STAGE[stage];
              const steps = nextSteps(o);
              const undo = undoStep(o);
              const wa = customerWhatsAppUrl(o);
              const amountDiffers = o.paymentAmount != null && Math.abs(o.paymentAmount - o.total) > 0.009;
              const stockShort = isOpen(o) && Boolean(o.paymentRef);
              return (
                <li key={o.id} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderLeft: `5px solid ${st.color}`, borderRadius: '10px' }}>
                  {/* Top line */}
                  <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="flex flex-wrap items-center gap-3">
                      <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>#{o.id}</span>
                      <span className="inline-flex items-center gap-1.5" style={{ fontSize: '0.9375rem', fontWeight: 600, color: st.color }}>
                        <st.Icon size={18} /> {st.label}
                      </span>
                      {o.source === 'manual' && (
                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 999, border: '1px solid var(--border)', color: 'var(--text-muted)' }}>Cargado en el panel</span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      {new Date(o.createdAt).toLocaleString('es-US', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr_auto] gap-5 px-5 py-4" style={{ fontSize: '0.9375rem' }}>
                    {/* Customer */}
                    <div className="flex flex-col gap-1">
                      <span style={{ fontWeight: 600, fontSize: '1rem' }}>{o.customerName}</span>
                      <span className="flex flex-wrap items-center gap-3">
                        {o.customerPhone}
                        {wa && (
                          <a href={wa} target="_blank" rel="noopener noreferrer" className={linkBtn} style={{ color: '#16a34a', fontWeight: 600 }}>
                            <MessageCircle size={16} /> Escribirle por WhatsApp
                          </a>
                        )}
                      </span>
                      {o.customerEmail && <a href={`mailto:${o.customerEmail}`} className="underline hover:text-(--gold)" style={{ color: 'var(--text-muted)' }}>{o.customerEmail}</a>}
                      {(o.customerAddress || o.customerCity) && <span style={{ color: 'var(--text-muted)' }}>{[o.customerAddress, o.customerCity].filter(Boolean).join(', ')}</span>}
                      {o.notes && <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Nota del cliente: “{o.notes}”</span>}
                      {o.adminNotes && (
                        <span className="flex items-start gap-1.5 mt-1 p-2" style={{ background: 'rgba(201,164,93,0.12)', whiteSpace: 'pre-wrap', borderRadius: 6 }}>
                          <StickyNote size={15} style={{ marginTop: 3, flexShrink: 0, color: 'var(--gold)' }} /> {o.adminNotes}
                        </span>
                      )}
                    </div>

                    {/* Products and payment */}
                    <div className="flex flex-col gap-1">
                      {(Array.isArray(o.items) ? o.items : []).map((item) => (
                        <span key={item.productId}>
                          {item.quantity} × {item.name} <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>({item.code})</span>
                        </span>
                      ))}
                      <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--gold)', marginTop: 4 }}>{formatPrice(o.total)}</span>
                      <span style={{ color: 'var(--text-muted)' }}>Pago: {t(`checkout.${o.paymentMethod}`)}</span>

                      {/* Proof of payment, when there is one */}
                      {o.paymentRef && (
                        <span className="flex flex-col gap-0.5 mt-1">
                          <a href={`https://www.paypal.com/activity/payment/${encodeURIComponent(o.paymentRef)}`} target="_blank" rel="noopener noreferrer" className={`${linkBtn} underline`} style={{ fontWeight: 600 }}>
                            <ExternalLink size={15} /> Ver el pago en PayPal
                          </a>
                          {o.paymentAmount != null && (
                            <span style={{ color: amountDiffers ? '#ef4444' : 'var(--text-muted)', fontWeight: amountDiffers ? 700 : 400 }}>
                              Pagó {formatPrice(o.paymentAmount)}{amountDiffers && ` (el pedido es de ${formatPrice(o.total)})`}
                            </span>
                          )}
                        </span>
                      )}
                      {o.paymentMethod === 'transfer' && (o.receiptAt || ['review', 'paid', 'shipped', 'delivered'].includes(o.status)) && (
                        <button type="button" onClick={() => void openReceipt(o)} className={`${linkBtn} underline mt-1`} style={{ fontWeight: o.receiptAt ? 600 : 400 }}>
                          <FileText size={15} /> {o.receiptAt ? 'Ver comprobante de transferencia' : 'Ver comprobante (si lo envió)'}
                        </button>
                      )}
                      {stockShort && (
                        <span className="mt-1 p-2" style={{ background: 'rgba(239,68,68,0.08)', color: '#b91c1c', borderRadius: 6, fontWeight: 600 }}>
                          El cliente pagó, pero ya no hay stock suficiente. Agrega stock y confirma el pago, o cancela el pedido y devuélvele el dinero.
                        </span>
                      )}
                      {stage === 'waiting' && (
                        <span style={{ color: 'var(--text-muted)', marginTop: 4 }}>El cliente todavía no pagó con PayPal. Si no paga en 24 horas, el pedido se cancela solo.</span>
                      )}
                      {stage === 'collect' && o.receiptAt && (
                        <span style={{ color: '#b45309', marginTop: 4, fontWeight: 600 }}>El cliente envió un comprobante. Revísalo y, si el dinero llegó, pulsa «Ya me pagó».</span>
                      )}
                      {stage === 'collect' && o.paymentMethod === 'transfer' && !o.receiptAt && (
                        <span style={{ color: 'var(--text-muted)', marginTop: 4 }}>Cuando el cliente suba el comprobante, este pedido pasa solo a «Pago por verificar».</span>
                      )}
                    </div>

                    {/* What to do now */}
                    <div className="flex flex-col gap-2 lg:min-w-[230px]">
                      {steps.map((step) => (
                        <Button
                          key={step.to}
                          variant={step.primary ? 'gold' : 'outline'}
                          onClick={() => void runStep(o, step)}
                          isLoading={busy === o.id && step.primary}
                          disabled={busy === o.id}
                          className="justify-center"
                        >
                          <step.Icon size={18} /> {step.label}
                        </Button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setMoreFor((id) => (id === o.id ? null : o.id))}
                        aria-expanded={moreFor === o.id}
                        className="inline-flex items-center justify-center gap-1 py-2 hover:text-(--gold)"
                        style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}
                      >
                        Más opciones <ChevronDown size={15} style={{ transform: moreFor === o.id ? 'rotate(180deg)' : 'none' }} />
                      </button>
                      {moreFor === o.id && (
                        <div className="flex flex-col items-start gap-2 p-3" style={{ background: 'var(--bg-subtle)', borderRadius: 8, fontSize: '0.875rem' }}>
                          {canEdit(o) && (
                            <button type="button" className={linkBtn} onClick={() => setEditor({ open: true, order: o })}>
                              <Pencil size={15} /> Editar cliente o productos
                            </button>
                          )}
                          <button type="button" className={linkBtn} onClick={() => void editNotes(o)}>
                            <StickyNote size={15} /> {o.adminNotes ? 'Editar nota interna' : 'Agregar nota interna'}
                          </button>
                          {undo && (
                            <button type="button" className={linkBtn} onClick={() => void runStep(o, undo)}>
                              <Undo2 size={15} /> {undo.label}
                            </button>
                          )}
                          {o.status !== 'cancelled' && o.status !== 'delivered' && (
                            <button type="button" className={`${linkBtn} hover:text-red-500`} style={{ color: '#b91c1c' }} onClick={() => void cancelOrder(o)}>
                              <XCircle size={15} /> Cancelar pedido
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
