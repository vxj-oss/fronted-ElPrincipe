import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAgentContext } from './AgentContext';
import styles from './agent.module.css';

export default function NavegacionChat({ datos }) {
  const navigate = useNavigate();
  const { cerrarPanel } = useAgentContext();

  return (
    <div className={styles.accionesChat}>
      <button
        type="button"
        className={styles.seguimientoBtn}
        onClick={() => {
          if (window.matchMedia('(max-width: 768px)').matches) cerrarPanel();
          navigate(datos.ruta);
        }}
      >
        <ArrowRight size={12} aria-hidden="true" />
        Abrir {datos.etiqueta}
      </button>
    </div>
  );
}
