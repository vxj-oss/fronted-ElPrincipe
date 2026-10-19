import { ArrowRight, ListChecks } from 'lucide-react';
import { useAgentContext } from './AgentContext';
import styles from './agent.module.css';

export default function PlanChat({ plan, mensajeId }) {
  const { planActivo, usarSeguimiento, enviando } = useAgentContext();
  const activo = planActivo?.tarjetaId === mensajeId;

  return (
    <div className={styles.planChat}>
      <p className={styles.planTitulo}>
        <ListChecks size={13} aria-hidden="true" /> Pasos que siguen
      </p>
      <ol className={styles.planLista}>
        {plan.pendientes.map((paso) => (
          <li key={`${paso.etiqueta}-${paso.texto}`} className={styles.planPaso}>
            {paso.espera ? (
              <span>
                {paso.etiqueta}
                <em className={styles.planNota}>{activo ? ' — se hará solo al confirmar el paso anterior' : ''}</em>
              </span>
            ) : (
              <button
                type="button"
                className={styles.seguimientoBtn}
                disabled={enviando}
                onClick={() => usarSeguimiento(paso.texto)}
              >
                {paso.etiqueta}
                <ArrowRight size={12} aria-hidden="true" />
              </button>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
