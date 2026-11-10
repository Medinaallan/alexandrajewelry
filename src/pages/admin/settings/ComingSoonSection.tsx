import { Clock } from 'lucide-react';
import { card } from './ui';

type Props = {
  title: string;
  description: string;
  /** What has to happen before it can be turned on */
  needs: string[];
};

/** A payment option the store doesn't offer yet. Honest about what's missing. */
export function ComingSoonSection({ title, description, needs }: Props) {
  return (
    <section style={card}>
      <div className="flex items-center gap-3 mb-3">
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.375rem', fontWeight: 400 }}>{title}</h2>
        <span className="flex items-center gap-1" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: '999px' }}>
          <Clock size={11} /> Próximamente
        </span>
      </div>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.25rem' }}>{description}</p>
      <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Qué hace falta para activarlo</h3>
      <ul className="list-disc pl-5 flex flex-col gap-1.5" style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
        {needs.map((n) => <li key={n}>{n}</li>)}
      </ul>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '1.25rem' }}>
        Esta opción todavía no está disponible en la tienda. Cuando se integre, sus datos se configurarán aquí.
      </p>
    </section>
  );
}
