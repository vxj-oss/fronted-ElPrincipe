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
                Términos del Servicio y Política de Cookies
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
        title="Términos del Servicio y Política de Cookies"
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
              1. Términos del Servicio
            </h3>
            <p>
              Esta plataforma es un sistema interno de gestión comercial de {EMPRESA.NOMBRE}
              {' '}({EMPRESA.CIUDAD}), de uso exclusivo para personal autorizado de la empresa
              (administradores y asesores comerciales).
            </p>
          </section>

          <section>
            <h4 className="font-medium text-neutral-text dark:text-white mb-1">
              Cuentas y acceso
            </h4>
            <p>
              Eres responsable de mantener la confidencialidad de tu usuario y contraseña, y de
              toda actividad realizada bajo tu cuenta. Notifica de inmediato cualquier uso no
              autorizado de tus credenciales.
            </p>
          </section>

          <section>
            <h4 className="font-medium text-neutral-text dark:text-white mb-1">Uso aceptable</h4>
            <p>
              El acceso al sistema no debe compartirse con terceros ni utilizarse para fines
              distintos a la operación comercial de {EMPRESA.NOMBRE}. Los datos de clientes,
              pedidos y condiciones comerciales registrados son propiedad de la empresa y deben
              tratarse con confidencialidad.
            </p>
          </section>

          <section>
            <h4 className="font-medium text-neutral-text dark:text-white mb-1">
              Asistente comercial (IA)
            </h4>
            <p>
              Las respuestas generadas por el Agente Comercial son un apoyo a la toma de
              decisiones basado en los datos registrados en el sistema, y no sustituyen el
              criterio profesional del usuario.
            </p>
          </section>

          <section>
            <h4 className="font-medium text-neutral-text dark:text-white mb-1">Disponibilidad</h4>
            <p>
              El sistema puede presentar interrupciones por mantenimiento y no garantiza una
              disponibilidad ininterrumpida.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-neutral-text dark:text-white mb-1 pt-2 border-t border-surface-border dark:border-slate-800">
              2. Política de Cookies y Almacenamiento Local
            </h3>
            <p>
              Este sistema no utiliza cookies de rastreo publicitario ni de terceros. Usamos una
              cookie técnica y el almacenamiento local de tu navegador (localStorage) únicamente
              para:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                Mantener tu sesión iniciada mediante una cookie de autenticación segura
                (HttpOnly), que no es accesible desde el código de la página.
              </li>
              <li>Recordar tus datos básicos de usuario mientras la sesión está activa.</li>
              <li>Recordar tu preferencia de tema (claro u oscuro).</li>
            </ul>
            <p className="mt-2">
              Esta información se guarda solo en tu propio navegador y se elimina al cerrar
              sesión o al limpiar el almacenamiento del navegador.
            </p>
          </section>

          <section>
            <h4 className="font-medium text-neutral-text dark:text-white mb-1">
              Cambios en estos términos
            </h4>
            <p>
              Estos términos pueden actualizarse periódicamente. El uso continuado del sistema
              después de una actualización implica la aceptación de los cambios.
            </p>
          </section>
        </div>
      </Modal>
    </>
  );
}
