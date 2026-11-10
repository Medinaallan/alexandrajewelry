import { Link, Navigate, useParams } from 'react-router-dom';
import { STORE } from '../../utils/store';

type Section = { title: string; body: (string | string[])[] };
type Doc = { title: string; intro: string; sections: Section[] };

const UPDATED = '9 de noviembre de 2026';

const contactLine = `${STORE.name}, ${STORE.address}. Teléfono ${STORE.phone}. Correo ${STORE.email}.`;

export const LEGAL_DOCS: Record<string, Doc> = {
  privacy: {
    title: 'Política de Privacidad',
    intro: `En ${STORE.name} cuidamos tus datos. Aquí explicamos qué información recogemos, para qué la usamos y qué derechos tienes.`,
    sections: [
      {
        title: 'Quiénes somos',
        body: [`Este sitio pertenece a ${contactLine}`],
      },
      {
        title: 'Qué datos recogemos',
        body: [
          'Solo los que nos das al usar el sitio:',
          [
            'Al hacer un pedido: nombre, teléfono, correo electrónico, dirección, ciudad, notas del pedido y, si pagas por transferencia, el comprobante que subas.',
            'Al pagar con PayPal: la referencia y el monto del pago. Los datos de tu cuenta o tarjeta los procesa PayPal; nosotros no los vemos ni los guardamos.',
            'Al escribirnos por el formulario de contacto: nombre, correo, teléfono (opcional) y tu mensaje.',
            'Al dejar una reseña: el nombre, la ubicación y el texto que escribas.',
          ],
        ],
      },
      {
        title: 'Para qué los usamos',
        body: [
          [
            'Preparar, cobrar, enviar y dar seguimiento a tus pedidos.',
            'Avisarte por correo o por WhatsApp sobre el estado de tu pedido.',
            'Responder tus mensajes y consultas.',
            'Cumplir obligaciones legales y contables.',
          ],
          'No vendemos ni alquilamos tus datos, y no te enviamos publicidad sin tu permiso.',
        ],
      },
      {
        title: 'Con quién los compartimos',
        body: [
          'Solo con los servicios que necesitamos para operar la tienda, y únicamente para ese fin:',
          [
            'PayPal, para procesar los pagos.',
            'Cloudflare, Neon y Vercel, que alojan el sitio y la base de datos.',
            'Google (Gmail), para enviarte los correos de tu pedido.',
            'La empresa de envío que lleve tu pedido, con los datos necesarios para entregarlo.',
          ],
          'También podemos entregar datos cuando la ley lo exija.',
        ],
      },
      {
        title: 'Cuánto tiempo los guardamos',
        body: [
          'Guardamos los datos de los pedidos el tiempo que exigen las normas contables y fiscales. Los mensajes de contacto se borran cuando ya no son necesarios para atender tu consulta.',
        ],
      },
      {
        title: 'Seguridad',
        body: [
          'El sitio usa conexión cifrada (HTTPS). El acceso al panel de administración está protegido con usuario y contraseña, y los comprobantes de pago solo pueden verlos los administradores.',
        ],
      },
      {
        title: 'Tus derechos',
        body: [
          `Puedes pedirnos ver, corregir o borrar tus datos escribiendo a ${STORE.email} o llamando al ${STORE.phone}. Te responderemos lo antes posible.`,
        ],
      },
      {
        title: 'Menores de edad',
        body: ['Este sitio no está dirigido a menores de 13 años y no recogemos sus datos a sabiendas.'],
      },
      {
        title: 'Cambios',
        body: ['Si cambiamos esta política, publicaremos la nueva versión en esta página con su fecha de actualización.'],
      },
    ],
  },

  terms: {
    title: 'Términos y Condiciones',
    intro: `Estos términos regulan el uso de este sitio y las compras que hagas en ${STORE.name}. Al hacer un pedido aceptas estos términos.`,
    sections: [
      {
        title: 'La tienda',
        body: [contactLine],
      },
      {
        title: 'Productos y precios',
        body: [
          'Las fotos muestran las piezas lo más fielmente posible, pero el color y el brillo pueden variar según tu pantalla.',
          'Los precios están en dólares estadounidenses (USD). Podemos cambiar precios y disponibilidad en cualquier momento; el precio que se aplica es el que aparece al confirmar tu pedido.',
          'Si un producto se agota después de tu pedido, te avisaremos y te devolveremos lo que hayas pagado por él.',
        ],
      },
      {
        title: 'Pedidos',
        body: [
          'Al confirmar el pedido recibes un número de pedido. El pedido queda confirmado cuando lo aceptamos y recibimos el pago.',
          'Podemos cancelar un pedido si hay un error evidente de precio, si el producto no está disponible o si no podemos verificar el pago. En ese caso te devolvemos el dinero completo.',
        ],
      },
      {
        title: 'Pagos',
        body: [
          [
            'PayPal o tarjeta de débito o crédito (a través de PayPal). Los pedidos pagados con PayPal deben pagarse dentro de las 24 horas siguientes; si no, se cancelan automáticamente.',
            'Transferencia, subiendo el comprobante.',
            'Coordinando el pago por WhatsApp.',
          ],
          'Verificamos cada pago antes de preparar el pedido.',
        ],
      },
      {
        title: 'Envíos',
        body: [
          'Enviamos a la dirección que indiques en el pedido. Los tiempos de entrega son estimados y pueden variar por causas ajenas a nosotros. Revisa que tu dirección esté completa y correcta.',
          'Puedes ver el estado de tu pedido en la página «Sigue tu pedido» con tu número de pedido y tu teléfono.',
        ],
      },
      {
        title: 'Devoluciones',
        body: ['Las devoluciones y cambios se rigen por nuestra Política de Devoluciones.'],
      },
      {
        title: 'Uso del sitio',
        body: [
          'Las imágenes, textos y diseños de este sitio pertenecen a la tienda y no pueden usarse sin permiso. No está permitido usar el sitio para fines fraudulentos o para dañar su funcionamiento.',
        ],
      },
      {
        title: 'Responsabilidad',
        body: [
          'Hacemos lo posible para que el sitio funcione siempre y la información sea correcta, pero no podemos garantizar que no haya interrupciones o errores. Nuestra responsabilidad por un pedido se limita al importe pagado por él.',
        ],
      },
      {
        title: 'Ley aplicable',
        body: ['Estos términos se rigen por las leyes del Estado de Massachusetts, Estados Unidos.'],
      },
    ],
  },

  returns: {
    title: 'Política de Devoluciones',
    intro: 'Queremos que ames tu joya. Si algo no está bien, escríbenos y lo resolvemos.',
    sections: [
      {
        title: 'Plazo',
        body: [
          'Puedes pedir un cambio o devolución dentro de los 14 días siguientes a recibir tu pedido. Escríbenos antes de enviar nada, indicando tu número de pedido.',
        ],
      },
      {
        title: 'Condiciones',
        body: [
          [
            'La pieza debe estar sin usar, en perfecto estado y con su empaque original.',
            'Por higiene, los aretes (pendientes) no se aceptan en devolución, salvo que tengan un defecto.',
            'Las piezas hechas o ajustadas a medida (grabados, tallas especiales) no tienen devolución, salvo defecto.',
          ],
        ],
      },
      {
        title: 'Productos defectuosos o equivocados',
        body: [
          'Si tu pedido llega dañado, con un defecto o no es lo que pediste, avísanos dentro de las 48 horas siguientes a recibirlo, con fotos. Lo cambiamos o te devolvemos el dinero, y nosotros cubrimos el envío.',
        ],
      },
      {
        title: 'Reembolsos',
        body: [
          'Una vez que recibimos y revisamos la pieza, te devolvemos el dinero por el mismo medio de pago. Si pagaste con PayPal, el reembolso se hace por PayPal. Salvo defecto o error nuestro, el costo del envío de la devolución corre por tu cuenta.',
        ],
      },
      {
        title: 'Cómo pedirlo',
        body: [`Escríbenos a ${STORE.email}, llama al ${STORE.phone} o usa el formulario de contacto.`],
      },
    ],
  },

  cookies: {
    title: 'Política de Cookies',
    intro: 'Esta página explica qué guarda este sitio en tu navegador y para qué.',
    sections: [
      {
        title: 'Qué son',
        body: [
          'Las cookies y el almacenamiento local son pequeños datos que un sitio guarda en tu navegador para recordar cosas entre una visita y otra.',
        ],
      },
      {
        title: 'Lo que guardamos nosotros',
        body: [
          'No usamos cookies de publicidad ni de seguimiento. Solo guardamos en tu navegador lo necesario para que el sitio funcione:',
          [
            'Tu carrito de compras, para que no se pierda al recargar la página.',
            'Tus preferencias de idioma y de tema (claro u oscuro).',
            'Que ya viste el aviso de cookies.',
            'Si eres administrador, tu sesión del panel.',
          ],
        ],
      },
      {
        title: 'Cookies de otros servicios',
        body: [
          'Algunas funciones usan servicios de terceros que pueden guardar sus propias cookies:',
          [
            'Google Translate, si usas el traductor del sitio (recuerda el idioma elegido).',
            'PayPal, cuando pagas con PayPal o con tarjeta, para procesar el pago de forma segura y prevenir fraudes.',
            'Google Maps, en el mapa de la página de contacto.',
            'Google Fonts, que entrega los tipos de letra del sitio.',
          ],
          'Cada uno se rige por su propia política de privacidad.',
        ],
      },
      {
        title: 'Cómo controlarlas',
        body: [
          'Puedes borrar o bloquear las cookies desde la configuración de tu navegador. Si lo haces, el carrito y tus preferencias no se recordarán, y es posible que el pago con PayPal no funcione.',
        ],
      },
    ],
  },
};

export default function LegalPage() {
  const { doc = '' } = useParams();
  const page = LEGAL_DOCS[doc];
  if (!page) return <Navigate to="/" replace />;

  return (
    <main className="pb-24 pt-12">
      <article className="page-container max-w-3xl mx-auto">
        <header className="text-center mb-12">
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 300 }}>{page.title}</h1>
          <div className="gold-line mt-4" />
          <p style={{ color: 'var(--text-muted)', marginTop: '1rem', fontSize: '0.8125rem' }}>Última actualización: {UPDATED}</p>
        </header>

        <p style={{ fontSize: '1rem', lineHeight: 1.8, marginBottom: '2rem' }}>{page.intro}</p>

        {page.sections.map((section) => (
          <section key={section.title} style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.375rem', fontWeight: 400, marginBottom: '0.75rem' }}>{section.title}</h2>
            {section.body.map((part, i) =>
              Array.isArray(part) ? (
                <ul key={i} className="list-disc pl-6 flex flex-col gap-1.5" style={{ fontSize: '0.9375rem', lineHeight: 1.7, color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  {part.map((item) => <li key={item}>{item}</li>)}
                </ul>
              ) : (
                <p key={i} style={{ fontSize: '0.9375rem', lineHeight: 1.7, color: 'var(--text-muted)', marginBottom: '0.75rem' }}>{part}</p>
              ),
            )}
          </section>
        ))}

        <nav className="flex flex-wrap gap-x-6 gap-y-2 justify-center mt-12 pt-8" style={{ borderTop: '1px solid var(--border)', fontSize: '0.8125rem' }}>
          {Object.entries(LEGAL_DOCS).map(([key, d]) => (
            <Link key={key} to={`/legal/${key}`} className="hover:text-(--gold)" style={{ color: key === doc ? 'var(--gold)' : 'var(--text-muted)' }}>
              {d.title}
            </Link>
          ))}
        </nav>
      </article>
    </main>
  );
}
