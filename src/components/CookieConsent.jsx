import { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { EMPRESA } from '../constants/appConstants';

const CONSENT_VERSION = '1';
const CONSENT_KEY = `elprincipe_consentimiento_v${CONSENT_VERSION}`;

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);

  useEffect(() => {
    const aceptado = localStorage.getItem(CONSENT_KEY);
    if (!aceptado) setVisible(true);
  }, []);

  const aceptar = () => {
    localStorage.setItem(CONSENT_KEY, 'true');
    setVisible(false);
    setModalAbierto(false);
  };

  if (!visible) return null;

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center p-4 sm:p-6">
        <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-lg shadow-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-start gap-3 flex-1">
            <ShieldCheck
              size={20}
              className="text-brand-900 dark:text-brand-500 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <p className="text-sm text-neutral-text dark:text-slate-200 leading-relaxed">
              Usamos cookies y almacenamiento local para mantener tu sesión iniciada y recordar
              tus preferencias. Al continuar, aceptas nuestros{' '}
              <button
                type="button"
                onClick={() => setModalAbierto(true)}
                className="font-medium text-brand-900 dark:text-brand-500 underline underline-offset-2 hover:no-underline"
              >
                Términos y Condiciones y Política de Privacidad
              </button>
              .
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 justify-end">
            <Button variant="secondary" onClick={() => setModalAbierto(true)}>
              Ver términos
            </Button>
            <Button variant="primary" onClick={aceptar}>
              Aceptar
            </Button>
          </div>
        </div>
      </div>

      <Modal
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title="Términos y Condiciones y Política de Privacidad"
        size="lg"
        footer={
          <Button variant="primary" onClick={aceptar}>
            Entendido, aceptar
          </Button>
        }
      >
        <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4 text-sm text-neutral-text dark:text-slate-200 leading-relaxed">
          <section>
            <h3 className="font-semibold text-neutral-text dark:text-white mb-1">
              1. Términos y Condiciones
            </h3>
            <p>
              Bienvenido a la página web de Productos {EMPRESA.NOMBRE}. Al navegar por este
              sitio o realizar una compra, el usuario declara haber leído y aceptado los
              presentes términos y condiciones.
            </p>
          </section>

          <section>
            <h4 className="font-medium text-neutral-text dark:text-white mb-1">
              Productos y disponibilidad
            </h4>
            <p>
              Ofrecemos productos de limpieza, higiene, cuidado del hogar y artículos
              complementarios. La disponibilidad está sujeta al stock existente.
            </p>
            <p className="mt-2">
              Las imágenes son referenciales. El color, presentación o empaque del producto
              podría variar debido a actualizaciones realizadas por el fabricante, sin alterar
              sus características principales.
            </p>
          </section>

          <section>
            <h4 className="font-medium text-neutral-text dark:text-white mb-1">Precios</h4>
            <p>
              Todos los precios se muestran en soles peruanos (S/) e incluyen los impuestos
              aplicables, salvo que se indique lo contrario.
            </p>
            <p className="mt-2">
              Los precios, descuentos y promociones pueden cambiar sin previo aviso. El precio
              válido será el mostrado al momento de confirmar la compra. Las promociones están
              sujetas a disponibilidad, condiciones y fechas señaladas.
            </p>
          </section>

          <section>
            <h4 className="font-medium text-neutral-text dark:text-white mb-1">Pedidos</h4>
            <p>
              El cliente deberá proporcionar información correcta y completa para procesar su
              pedido. La compra se considerará confirmada después de verificar el pago y la
              disponibilidad de los productos.
            </p>
            <p className="mt-2">
              En caso de falta de stock, error en el precio o imposibilidad de atender el
              pedido, nos comunicaremos con el cliente para ofrecerle un cambio, una
              reprogramación o la devolución del importe pagado, según corresponda.
            </p>
          </section>

          <section>
            <h4 className="font-medium text-neutral-text dark:text-white mb-1">
              Uso de la página web
            </h4>
            <p>
              El usuario se compromete a utilizar esta página de manera responsable y lícita.
              Está prohibido realizar pedidos fraudulentos, proporcionar información falsa,
              intentar alterar el funcionamiento del sitio o utilizar su contenido sin
              autorización.
            </p>
          </section>

          <section>
            <h4 className="font-medium text-neutral-text dark:text-white mb-1">
              Propiedad intelectual
            </h4>
            <p>
              El nombre comercial, logotipos, diseños, fotografías, textos y demás elementos
              propios de Productos {EMPRESA.NOMBRE} están protegidos por la normativa
              correspondiente. No podrán reproducirse ni utilizarse con fines comerciales sin
              autorización previa.
            </p>
          </section>

          <section>
            <h4 className="font-medium text-neutral-text dark:text-white mb-1">
              Atención de reclamos
            </h4>
            <p>
              Los clientes pueden presentar consultas o reclamos mediante nuestros canales de
              atención o a través del Libro de Reclamaciones Virtual disponible en esta página.
            </p>
            <p className="mt-2">
              Estos términos se interpretan de acuerdo con las leyes vigentes de la República
              del Perú y el Código de Protección y Defensa del Consumidor.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-neutral-text dark:text-white mb-1 pt-2 border-t border-surface-border dark:border-slate-800">
              2. Política de Privacidad
            </h3>
            <p>
              En Productos {EMPRESA.NOMBRE} respetamos y protegemos la información personal de
              nuestros clientes y usuarios.
            </p>
          </section>

          <section>
            <h4 className="font-medium text-neutral-text dark:text-white mb-1">
              Información recopilada
            </h4>
            <p>Podemos recopilar los siguientes datos:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Nombres y apellidos.</li>
              <li>DNI o RUC, cuando sea necesario.</li>
              <li>Número telefónico y correo electrónico.</li>
              <li>Dirección de entrega.</li>
              <li>Información relacionada con pedidos y comprobantes de pago.</li>
              <li>Datos de navegación y preferencias dentro de la página.</li>
            </ul>
            <p className="mt-2">
              No almacenamos directamente los datos completos de tarjetas bancarias cuando el
              pago es procesado por una plataforma externa.
            </p>
          </section>

          <section>
            <h4 className="font-medium text-neutral-text dark:text-white mb-1">
              Uso de la información
            </h4>
            <p>Utilizamos los datos para:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Procesar, confirmar y entregar pedidos.</li>
              <li>Emitir boletas o facturas.</li>
              <li>Comunicarnos con el cliente.</li>
              <li>Atender consultas, cambios o reclamos.</li>
              <li>Mejorar nuestros productos y servicios.</li>
              <li>Enviar promociones, únicamente cuando exista autorización.</li>
              <li>Cumplir obligaciones legales y tributarias.</li>
            </ul>
          </section>

          <section>
            <h4 className="font-medium text-neutral-text dark:text-white mb-1">
              Protección y conservación
            </h4>
            <p>
              Adoptamos medidas razonables para evitar el acceso, pérdida, alteración o uso no
              autorizado de la información. Los datos se conservarán únicamente durante el
              tiempo necesario para cumplir las finalidades señaladas y las obligaciones legales
              aplicables.
            </p>
            <p className="mt-2">
              La información podrá compartirse con proveedores de delivery, medios de pago u
              otros prestadores cuando sea necesario para completar el pedido. No vendemos ni
              alquilamos los datos personales de nuestros clientes.
            </p>
          </section>

          <section>
            <h4 className="font-medium text-neutral-text dark:text-white mb-1">
              Derechos del usuario
            </h4>
            <p>
              El titular puede solicitar el acceso, rectificación, cancelación u oposición al
              tratamiento de sus datos personales —derechos ARCO— escribiendo a nuestros canales
              de atención. La solicitud deberá incluir sus datos de identificación y una
              descripción clara de lo solicitado.
            </p>
            <p className="mt-2">
              Esta política se encuentra alineada con la Ley N.° 29733, Ley de Protección de
              Datos Personales.
            </p>
          </section>
        </div>
      </Modal>
    </>
  );
}
