import { useCallback, useEffect, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAdmin } from '../../../contexts/AdminContext';
import { api, type BankAccountSetting } from '../../../lib/api';
import { Button } from '../../../components/ui/Button';
import { card, label, toast } from './ui';

const blank = (): BankAccountSetting => ({ bank: '', holder: '', number: '', details: '' });
const MAX_ACCOUNTS = 10;

/** Configuración > Cuentas bancarias: shown to customers who pay by transfer. */
export function BankSection() {
  const { token } = useAdmin();
  const [accounts, setAccounts] = useState<BankAccountSetting[]>([]);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setAccounts((await api.admin.settings.getBank(token)).accounts);
      setLoadError('');
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'No se pudieron cargar las cuentas.');
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const update = (i: number, key: keyof BankAccountSetting, value: string) =>
    setAccounts((list) => list.map((a, j) => (j === i ? { ...a, [key]: value } : a)));

  const remove = async (i: number) => {
    const a = accounts[i];
    if (a.bank || a.number) {
      const { isConfirmed } = await Swal.fire({
        title: '¿Quitar esta cuenta?',
        text: `${a.bank || 'Cuenta'} ${a.number}`.trim() + '. Se quita al pulsar Guardar.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Quitar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#ef4444',
      });
      if (!isConfirmed) return;
    }
    setAccounts((list) => list.filter((_, j) => j !== i));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      setAccounts((await api.admin.settings.saveBank(token, accounts)).accounts);
      toast('Cuentas guardadas');
    } catch (err) {
      void Swal.fire('No se guardó', err instanceof Error ? err.message : 'Intenta de nuevo.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {loadError && <p role="alert" style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem' }}>{loadError}</p>}
      <section style={card}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 400, marginBottom: '0.5rem' }}>Cuentas bancarias</h2>
        <p style={{ fontSize: '0.9375rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          Cuando un cliente elige <strong style={{ color: 'var(--text)' }}>Transferencia</strong>, ve estas cuentas en la página de pago, en la
          confirmación del pedido, en «Sigue tu pedido» y en el correo del pedido. Si no hay ninguna, se le dice que le enviarás los datos por mensaje.
        </p>

        <form onSubmit={save} className="flex flex-col gap-5">
          {accounts.length === 0 && (
            <p style={{ fontSize: '0.9375rem', color: '#b45309' }}>Todavía no hay cuentas. Pulsa «Agregar cuenta».</p>
          )}
          {accounts.map((a, i) => (
            <fieldset key={i} className="flex flex-col gap-4 p-5" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <legend style={{ fontSize: '0.9375rem', fontWeight: 600, padding: '0 6px' }}>Cuenta {i + 1}</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span style={label}>Nombre del banco *</span>
                  <input className="form-input" value={a.bank} placeholder="Ej: Chase, Bank of America, Zelle" onChange={(e) => update(i, 'bank', e.target.value)} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span style={label}>Titular de la cuenta *</span>
                  <input className="form-input" value={a.holder} placeholder="Nombre completo" onChange={(e) => update(i, 'holder', e.target.value)} />
                </label>
              </div>
              <label className="flex flex-col gap-1.5">
                <span style={label}>Número de cuenta *</span>
                <input className="form-input" value={a.number} placeholder="Número de cuenta, correo o teléfono de Zelle" onChange={(e) => update(i, 'number', e.target.value)} style={{ fontFamily: 'monospace' }} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span style={label}>Otros datos (opcional)</span>
                <input className="form-input" value={a.details} placeholder="Ej: Routing number, tipo de cuenta" onChange={(e) => update(i, 'details', e.target.value)} />
              </label>
              <button type="button" onClick={() => void remove(i)} className="self-start flex items-center gap-1.5 hover:text-red-500" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                <Trash2 size={15} /> Quitar esta cuenta
              </button>
            </fieldset>
          ))}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" onClick={() => setAccounts((l) => [...l, blank()])} disabled={accounts.length >= MAX_ACCOUNTS}>
              <Plus size={16} /> Agregar cuenta
            </Button>
            <Button type="submit" variant="gold" isLoading={saving}>
              <Save size={16} /> Guardar
            </Button>
          </div>
        </form>
      </section>
    </>
  );
}
