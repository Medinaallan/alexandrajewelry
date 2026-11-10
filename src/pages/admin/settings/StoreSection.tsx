import { useCallback, useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAdmin } from '../../../contexts/AdminContext';
import { api, type StoreSettings } from '../../../lib/api';
import { Button } from '../../../components/ui/Button';
import { card, label, toast } from './ui';

const EMPTY: StoreSettings = { name: '', street: '', cityLine: '', phone: '', whatsapp: '', email: '', notifyEmail: '', hours: '', topbarMessage: '' };

type FieldProps = { name: keyof StoreSettings; title: string; help?: string; placeholder?: string; type?: string; multiline?: boolean };

/** Configuración > Mi tienda: the details customers see, and where notices go. */
export function StoreSection() {
  const { token } = useAdmin();
  const [form, setForm] = useState<StoreSettings>(EMPTY);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setForm(await api.admin.settings.getStore(token));
      setLoadError('');
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'No se pudo cargar la configuración.');
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      setForm(await api.admin.settings.saveStore(token, form));
      toast('Datos de la tienda guardados');
    } catch (err) {
      void Swal.fire('No se guardó', err instanceof Error ? err.message : 'Intenta de nuevo.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const field = ({ name, title, help, placeholder, type = 'text', multiline }: FieldProps) => (
    <label className="flex flex-col gap-1.5">
      <span style={label}>{title}</span>
      {multiline ? (
        <textarea className="form-input resize-y" rows={4} value={form[name]} placeholder={placeholder} onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))} />
      ) : (
        <input className="form-input" type={type} value={form[name]} placeholder={placeholder} onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))} />
      )}
      {help && <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{help}</span>}
    </label>
  );

  const groupTitle = (text: string) => (
    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginTop: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>{text}</h3>
  );

  return (
    <>
      {loadError && <p role="alert" style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem' }}>{loadError}</p>}
      <section style={card}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 400, marginBottom: '0.5rem' }}>Mi tienda</h2>
        <p style={{ fontSize: '0.9375rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          Estos datos aparecen en el sitio (Contacto, pie de página, Sobre nosotros, políticas) y en los correos. Al guardar, el sitio se actualiza en un minuto.
        </p>

        <form onSubmit={save} className="flex flex-col gap-5">
          {groupTitle('Datos de la tienda')}
          {field({ name: 'name', title: 'Nombre de la tienda' })}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field({ name: 'street', title: 'Dirección', placeholder: '16 Ashland Street' })}
            {field({ name: 'cityLine', title: 'Ciudad, estado y código postal', placeholder: 'North Adams, MA 01247' })}
          </div>
          {field({ name: 'hours', title: 'Horario de atención', multiline: true, placeholder: 'Lunes a viernes: 10:00 am - 6:00 pm\nSábado: 10:00 am - 2:00 pm\nDomingo: cerrado', help: 'Una línea por cada día o grupo de días. Si lo dejas vacío, no se muestra en el sitio.' })}

          {groupTitle('Cómo te contactan los clientes')}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field({ name: 'phone', title: 'Teléfono', type: 'tel', placeholder: '413-770-9901' })}
            {field({ name: 'whatsapp', title: 'WhatsApp', type: 'tel', placeholder: '413-770-9901', help: 'El número de WhatsApp de la tienda. Si es de Estados Unidos, basta con los 10 dígitos.' })}
          </div>
          {field({ name: 'email', title: 'Correo de contacto', type: 'email', help: 'El que ven los clientes en Contacto y en las políticas.' })}

          {groupTitle('Avisos para ti')}
          {field({ name: 'notifyEmail', title: 'Correo donde recibes los avisos', type: 'email', help: 'Aquí llegan los avisos de pedidos nuevos, pagos, comprobantes y mensajes de contacto.' })}

          {groupTitle('Mensaje en la parte de arriba del sitio')}
          {field({ name: 'topbarMessage', title: 'Mensaje (opcional)', placeholder: 'Ej: Nueva colección disponible', help: 'Una frase corta que aparece en la barra negra arriba de todas las páginas. Si lo dejas vacío, la barra no se muestra.' })}

          <div className="mt-2">
            <Button type="submit" variant="gold" isLoading={saving}>
              <Save size={16} /> Guardar cambios
            </Button>
          </div>
        </form>
      </section>
    </>
  );
}
