import { Landmark } from 'lucide-react';
import type { PayChoice } from '../../lib/payChoice';

// Official marks of each payment brand, served from /public/payment:
// PayPal (paypalobjects.com), Google Pay (Google's brand guidelines),
// and the card networks, Apple Pay and WhatsApp (Simple Icons, in brand colors).

// Acceptance marks sit on white, as the brands ask, in light and dark mode
const chip: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 26,
  minWidth: 40,
  padding: '0 6px',
  background: '#fff',
  border: '1px solid #d6d6d6',
  borderRadius: 4,
};

function Chip({ src, alt, h = 16 }: { src: string; alt: string; h?: number }) {
  return (
    <span style={chip}>
      <img src={src} alt={alt} style={{ height: h, width: 'auto', display: 'block' }} loading="lazy" />
    </span>
  );
}

export function CardMarks() {
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <Chip src="/payment/visa.svg" alt="Visa" h={11} />
      <Chip src="/payment/mastercard.svg" alt="Mastercard" />
      <Chip src="/payment/amex.svg" alt="American Express" h={20} />
      <Chip src="/payment/discover.svg" alt="Discover" h={7} />
    </span>
  );
}

const MARKS: Record<PayChoice, React.ReactNode> = {
  card: <CardMarks />,
  // These two marks already include their own outline
  googlePay: <img src="/payment/google-pay-mark.png" alt="Google Pay" style={{ height: 26, width: 'auto', display: 'block' }} />,
  applePay: (
    <span style={{ ...chip, padding: 0, border: 'none', background: 'transparent' }}>
      <img src="/payment/apple-pay.svg" alt="Apple Pay" style={{ height: 26, width: 'auto', display: 'block', background: '#fff', borderRadius: 5 }} />
    </span>
  ),
  paypal: <Chip src="/payment/paypal.svg" alt="PayPal" h={16} />,
  transfer: (
    <span style={{ ...chip, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
      <Landmark size={16} strokeWidth={1.75} />
    </span>
  ),
  whatsapp: <Chip src="/payment/whatsapp.svg" alt="WhatsApp" h={16} />,
};

export type PayOption = { id: PayChoice; title: string; subtitle: string };

type Props = {
  options: PayOption[];
  value: PayChoice;
  onChange(choice: PayChoice): void;
  /** What shows under the selected option */
  renderDetail(choice: PayChoice): React.ReactNode;
};

/** The payment methods as a list of radio rows; the chosen one opens its details. */
export function PaymentOptions({ options, value, onChange, renderDetail }: Props) {
  return (
    <div role="radiogroup" aria-label="Método de pago" style={{ border: '1px solid var(--border)', background: 'var(--bg)' }}>
      {options.map(({ id, title, subtitle }, i) => {
        const selected = value === id;
        const detail = selected ? renderDetail(id) : null;
        return (
          <div key={id} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)', background: selected ? 'var(--bg-subtle)' : 'var(--bg)' }}>
            <label className="flex items-center gap-4 px-5 py-4 cursor-pointer">
              <input
                type="radio"
                name="payment-method"
                value={id}
                checked={selected}
                onChange={() => onChange(id)}
                className="sr-only"
              />
              {/* Radio dot */}
              <span
                aria-hidden
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  border: `1.5px solid ${selected ? 'var(--gold)' : 'var(--border-strong, #b5b5b5)'}`,
                }}
              >
                {selected && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)' }} />}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block" style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'var(--text)' }}>{title}</span>
                <span className="block" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</span>
              </span>
              <span className="hidden sm:flex shrink-0">{MARKS[id]}</span>
            </label>
            {/* Marks under the title on phones, where the row is narrow */}
            <span className="flex sm:hidden px-5 pb-3" style={{ paddingLeft: 'calc(1.25rem + 18px + 1rem)', marginTop: -6 }}>{MARKS[id]}</span>
            {detail && (
              <div className="px-5 pb-5" style={{ paddingLeft: 'calc(1.25rem + 18px + 1rem)' }}>
                {detail}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
