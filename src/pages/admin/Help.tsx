import { Link } from 'react-router-dom';
import { AdminSidebar } from '../../components/admin/AdminSidebar';

// Guía de uso del panel. Describe cómo funciona el sistema hoy; si cambia
// una pantalla o un paso, hay que actualizar este texto.

type Section = { id: string; title: string; body: React.ReactNode };

const P = ({ children }: { children: React.ReactNode }) => <p style={{ marginBottom: '0.875rem' }}>{children}</p>;
const B = ({ children }: { children: React.ReactNode }) => <strong style={{ color: 'var(--text)' }}>{children}</strong>;
const Steps = ({ items }: { items: React.ReactNode[] }) => (
  <ol className="list-decimal pl-6 flex flex-col gap-2" style={{ marginBottom: '1rem' }}>
    {items.map((it, i) => <li key={i}>{it}</li>)}
  </ol>
);
const Note = ({ children }: { children: React.ReactNode }) => (
  <p className="p-3" style={{ background: 'rgba(201,164,93,0.12)', borderRadius: 8, marginBottom: '1rem' }}>{children}</p>
);
const To = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <Link to={to} className="underline hover:text-(--gold)" style={{ color: 'var(--text)', fontWeight: 600 }}>{children}</Link>
);

const SECTIONS: Section[] = [
  {
    id: 'dia',
    title: '1. Empezar el día: el Resumen',
    body: (
      <>
        <P>Al entrar al panel abre <To to="/admin/dashboard">Resumen</To>. Arriba, en «Para hacer hoy», ves cuatro tarjetas:</P>
        <ul className="list-disc pl-6 flex flex-col gap-2" style={{ marginBottom: '1rem' }}>
          <li><B>Pagos por verificar:</B> clientes que pagaron con PayPal o enviaron el comprobante de una transferencia.</li>
          <li><B>Pedidos por cobrar:</B> pedidos que todavía no pagaron.</li>
          <li><B>Pedidos para enviar:</B> ya pagados, falta enviarlos o entregarlos.</li>
          <li><B>Mensajes sin leer:</B> mensajes del formulario de contacto.</li>
        </ul>
        <P>Toca una tarjeta para ir directo a esos pedidos o mensajes. Más abajo están las <B>ventas de hoy</B> y los productos con <B>stock bajo</B>.</P>
        <Note>Mientras el panel está abierto, cuando llega un pedido nuevo o un pago suena un aviso y aparece un cartel arriba a la derecha (puede tardar hasta un minuto). Además te llega un correo (ver la sección 9).</Note>
      </>
    ),
  },
  {
    id: 'pedidos',
    title: '2. Pedidos: cómo avanzan',
    body: (
      <>
        <P>En <To to="/admin/orders">Pedidos</To> cada pedido muestra en qué etapa está y <B>un botón grande con lo que toca hacer</B>. No hace falta elegir estados: el sistema mueve solo lo que puede y tú solo confirmas lo que pasó.</P>
        <P>Las etapas, en orden:</P>
        <ul className="list-disc pl-6 flex flex-col gap-2" style={{ marginBottom: '1rem' }}>
          <li><B>Esperando pago del cliente</B> (solo pedidos hechos en la web con PayPal): el cliente hizo el pedido pero todavía no pagó. No haces nada. Si no paga en 24 horas, el pedido se cancela solo y se le avisa.</li>
          <li><B>Por cobrar:</B> el cliente no pagó todavía (transferencia sin comprobante, WhatsApp o efectivo). Contáctalo con el botón verde «Escribirle por WhatsApp». Cuando te pague, toca <B>«Ya me pagó»</B>.</li>
          <li><B>Pago por verificar:</B> llegó un pago que tienes que revisar. Toca <B>«Sí, el pago llegó»</B> cuando confirmes que el dinero está en la cuenta.</li>
          <li><B>Para enviar:</B> ya está pagado. Cuando lo despaches toca <B>«Ya lo envié»</B>, o si lo entregaste en persona, <B>«Lo entregué en mano»</B>.</li>
          <li><B>Enviado:</B> cuando el cliente lo reciba puedes tocar <B>«El cliente ya lo recibió»</B>. Es opcional.</li>
          <li><B>Entregado</B> o <B>Cancelado:</B> el pedido terminó.</li>
        </ul>
        <P>Antes de cambiar algo, el sistema siempre te pregunta y te explica qué va a pasar. Puedes decir «No».</P>
        <P>Arriba de la lista están los filtros: <B>Por hacer</B> muestra todo lo que necesita algo de ti. También puedes buscar por número de pedido, nombre o teléfono.</P>
      </>
    ),
  },
  {
    id: 'paypal',
    title: '3. Verificar un pago con PayPal',
    body: (
      <>
        <P>Cuando un cliente paga con PayPal (o con tarjeta a través de PayPal), el pedido pasa solo a <B>Pago por verificar</B> y sus piezas quedan apartadas del stock.</P>
        <Steps items={[
          <>En el pedido, toca <B>«Ver el pago en PayPal»</B>. Se abre PayPal; entra con la cuenta PayPal de la tienda.</>,
          <>Comprueba que el pago aparezca como completado y que el monto sea el del pedido. Si el monto no coincide, el panel lo muestra en rojo.</>,
          <>Vuelve al panel y toca <B>«Sí, el pago llegó»</B>. El pedido pasa a «Para enviar».</>,
        ]} />
        <Note>Si el panel dice «El cliente pagó, pero ya no hay stock suficiente», alguien compró la última pieza mientras ese cliente pagaba. Agrega stock (sección 6) y toca «Sí, el pago llegó», o cancela el pedido y devuélvele el dinero desde PayPal.</Note>
      </>
    ),
  },
  {
    id: 'transferencia',
    title: '4. Verificar una transferencia',
    body: (
      <>
        <P>El cliente que elige <B>Transferencia</B> ve en la página las cuentas bancarias que cargaste en <To to="/admin/settings/bank">Configuración → Cuentas bancarias</To>. Puede subir el comprobante al hacer el pedido o después, desde «Sigue tu pedido».</P>
        <P>Cuando sube el comprobante, el pedido pasa solo a <B>Pago por verificar</B>, sus piezas quedan apartadas y te llega un aviso.</P>
        <Steps items={[
          <>En el pedido, toca <B>«Ver comprobante de transferencia»</B>.</>,
          <>Revisa en tu banco que el dinero haya llegado.</>,
          <>Si llegó, toca <B>«Sí, el pago llegó»</B>. Si no llegó, abre <B>«Más opciones» → «El pago no llegó»</B>: el pedido vuelve a «Por cobrar» y las piezas vuelven al stock. Después escríbele al cliente.</>,
        ]} />
      </>
    ),
  },
  {
    id: 'manual',
    title: '5. Pedidos que te llegan por WhatsApp, Instagram o en la tienda',
    body: (
      <>
        <Steps items={[
          <>En <To to="/admin/orders">Pedidos</To> toca <B>«Nuevo pedido»</B>.</>,
          <>Escribe el nombre y el teléfono del cliente (son obligatorios). Si pones su correo, le llegan los avisos del pedido.</>,
          <>Elige la forma de pago: Efectivo, Transferencia, PayPal o WhatsApp.</>,
          <>En «Productos», elige un producto de la lista y toca <B>«Agregar»</B>. Repite para cada producto y ajusta la cantidad.</>,
          <>Toca <B>«Crear pedido»</B>. Queda en «Por cobrar». Cuando te pague, toca «Ya me pagó».</>,
        ]} />
        <P>Los precios salen del producto. Mientras el pedido no esté pagado, puedes corregirlo en <B>«Más opciones» → «Editar cliente o productos»</B>.</P>
        <Note>Si el cliente compra y paga en el momento en la tienda, también puedes usar «Vender en tienda» (sección 7).</Note>
      </>
    ),
  },
  {
    id: 'mas',
    title: '6. Equivocaciones, cancelaciones y notas',
    body: (
      <>
        <ul className="list-disc pl-6 flex flex-col gap-2" style={{ marginBottom: '1rem' }}>
          <li><B>Toqué un botón por error:</B> abre <B>«Más opciones»</B> en ese pedido y usa la opción que empieza con <B>«Deshacer»</B>.</li>
          <li><B>Cancelar un pedido:</B> «Más opciones» → <B>«Cancelar pedido»</B>. Si ya se había descontado stock, las piezas vuelven al stock. Si el cliente ya había pagado, <B>tú le devuelves el dinero</B> (si fue con PayPal, desde PayPal).</li>
          <li><B>Nota interna:</B> «Más opciones» → «Agregar nota interna». Solo la ve la tienda (por ejemplo «envolver para regalo»).</li>
        </ul>
      </>
    ),
  },
  {
    id: 'tienda',
    title: '7. Vender en la tienda (mostrador)',
    body: (
      <>
        <Steps items={[
          <>Abre <To to="/admin/sales">Ventas → Vender en tienda</To>.</>,
          <>Busca el producto y tócalo para agregarlo. Ajusta la cantidad. Si haces un descuento, cambia el precio unitario.</>,
          <>Toca <B>«Confirmar Venta»</B>. El stock se descuenta en el momento.</>,
        ]} />
        <P>Las ventas aparecen en <To to="/admin/sales/history">Ventas realizadas</To>. Si registraste una venta de mostrador por error, ahí puedes <B>anularla</B> y las piezas vuelven al stock. Las ventas que vienen de un pedido no se anulan ahí: se cancela el pedido.</P>
      </>
    ),
  },
  {
    id: 'stock',
    title: '8. Productos y stock',
    body: (
      <>
        <P><B>Agregar un producto:</B> en <To to="/admin/products">Productos</To> toca «Agregar Producto». Completa código (único), nombre, categoría, subcategoría, precio, stock y stock mínimo, y sube las fotos. El <B>costo</B> es opcional, pero sin él los reportes no pueden calcular la ganancia. «Activo» lo muestra en la tienda. «Destacado» lo pone en la sección de productos destacados de la página de inicio.</P>
        <P><B>Ocultar un producto:</B> usa el interruptor Activo/Inactivo de la lista. Un producto que ya tuvo ventas o movimientos de stock no se puede eliminar, solo desactivar.</P>
        <P><B>Cambiar el stock:</B> en <To to="/admin/stock">Inventario → Ver y ajustar stock</To> toca «Registrar Entrada» y elige el tipo:</P>
        <ul className="list-disc pl-6 flex flex-col gap-2" style={{ marginBottom: '1rem' }}>
          <li><B>Entrada:</B> suma piezas (llegó mercadería, o un cliente devolvió una pieza a la tienda).</li>
          <li><B>Ajuste:</B> deja el stock en el número exacto que escribas (por ejemplo, después de contar).</li>
          <li><B>Devolución:</B> <B>resta</B> piezas (por ejemplo, si le devuelves mercadería al proveedor).</li>
        </ul>
        <P>Todo queda registrado en <To to="/admin/stock/movements">Entradas y salidas</To>. Las ventas y los pedidos pagados descuentan el stock solos.</P>
      </>
    ),
  },
  {
    id: 'mensajes',
    title: '9. Avisos, mensajes y reseñas',
    body: (
      <>
        <P><B>Correos para ti:</B> llegan al correo que pusiste en <To to="/admin/settings/store">Mi tienda</To> («Correo donde recibes los avisos»): pedido nuevo, pago con PayPal, comprobante de transferencia y mensajes de contacto.</P>
        <P><B>Correos para el cliente</B> (si dejó su correo): pedido recibido, pago recibido, pago confirmado, enviado, entregado y cancelado. Se envían solos cuando el pedido avanza.</P>
        <Note>Para que salga cualquier correo, la cuenta de Gmail tiene que estar cargada en <To to="/admin/settings/mail">Configuración → Correo</To>. Ahí mismo puedes enviar un correo de prueba.</Note>
        <P><B>Mensajes:</B> en <To to="/admin/messages">Mensajes de contacto</To>. Para contestar, toca el correo del cliente.</P>
        <P><B>Reseñas:</B> en <To to="/admin/testimonials">Reseñas</To>. Las que apruebas aparecen en la página de inicio; las que rechazas, no.</P>
      </>
    ),
  },
  {
    id: 'datos',
    title: '10. Clientes, reportes y Excel',
    body: (
      <>
        <P><To to="/admin/customers">Clientes</To> junta los pedidos por número de teléfono: ves cuántas veces compró cada cliente y cuánto. «Ver pedidos» te lleva a sus pedidos.</P>
        <P><To to="/admin/reports">Reportes</To> muestra ventas e ingresos por período. La ganancia solo se calcula en los productos que tienen costo.</P>
        <P>Pedidos, ventas realizadas y clientes tienen un botón <B>«Exportar a Excel»</B>.</P>
      </>
    ),
  },
  {
    id: 'config',
    title: '11. Configuración',
    body: (
      <>
        <P>En el menú, <B>Administración → Ajustes → Configuración</B>:</P>
        <ul className="list-disc pl-6 flex flex-col gap-2" style={{ marginBottom: '1rem' }}>
          <li><To to="/admin/settings/store">Mi tienda</To>: dirección, teléfono, WhatsApp, horario, correos y el mensaje de la barra de arriba del sitio.</li>
          <li><To to="/admin/settings/bank">Cuentas bancarias</To>: las que ve el cliente que paga por transferencia. Con «Agregar cuenta» sumas más de una.</li>
          <li><To to="/admin/settings/paypal">PayPal</To>: activar o desactivar el pago con PayPal.</li>
          <li><To to="/admin/settings/mail">Correo</To>: la cuenta de Gmail que envía los avisos.</li>
        </ul>
        <P>Los cambios se ven en el sitio en un minuto.</P>
      </>
    ),
  },
  {
    id: 'clave',
    title: '12. Si olvidas la contraseña',
    body: (
      <>
        <P>En la pantalla de entrada toca <B>«¿Olvidaste tu contraseña?»</B>, escribe tu usuario o tu correo, y abre el enlace que te llega por correo (sirve una vez y vence en 1 hora). Otra persona administradora también puede cambiártela desde <To to="/admin/users">Usuarios</To>.</P>
      </>
    ),
  },
];

export default function AdminHelpPage() {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content p-8">
        <div className="max-w-3xl" style={{ fontSize: '1.0625rem', lineHeight: 1.7, color: 'var(--text-muted)' }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.25rem', fontWeight: 300, color: 'var(--text)', marginBottom: '0.5rem' }}>Guía de uso</h1>
          <p style={{ marginBottom: '1.5rem' }}>Toca un tema para abrirlo. Puedes volver aquí cuando quieras desde el menú: <B>Inicio → Guía de uso</B>.</p>

          <div className="flex flex-col gap-3">
            {SECTIONS.map((s, i) => (
              <details key={s.id} open={i === 0} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10 }}>
                <summary className="cursor-pointer select-none px-5 py-4" style={{ fontSize: '1.1875rem', fontWeight: 600, color: 'var(--text)' }}>
                  {s.title}
                </summary>
                <div className="px-5 pb-5">{s.body}</div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
