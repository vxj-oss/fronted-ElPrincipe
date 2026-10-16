import { useNavigate } from 'react-router-dom';
import { X, ArrowRight } from 'lucide-react';
import { useAgentContext } from './AgentContext';
import styles from './agent.module.css';

const MAX_AVISOS = 3;

export default function AvisosAgente() {
  const navigate = useNavigate();
  const { avisosVisibles, descartarAviso, usarSeguimiento, cerrarPanel, hayConsulta } = useAgentContext();

  if (hayConsulta || avisosVisibles.length === 0) return null;

  const ejecutar = (accion) => {
    if (accion.tipo === 'pregunta') {
      usarSeguimiento(accion.texto);
      return;
    }
    if (accion.tipo === 'enlace') {
      cerrarPanel();
      navigate(accion.ruta);
    }
  };

  return (
    <section className={styles.avisos} aria-label="Avisos del agente">
      <p className={styles.avisosTitulo}>Avisos para hoy</p>
      <ul className={styles.avisosLista}>
        {avisosVisibles.slice(0, MAX_AVISOS).map((aviso) => (
          <li key={aviso.id} className={`${styles.aviso} ${styles[`aviso_${aviso.nivel}`] || ''}`}>
            <div className={styles.avisoTexto}>
              <strong>{aviso.titulo}</strong>
              <span>{aviso.detalle}</span>
            </div>
            <div className={styles.avisoAcciones}>
              {aviso.accion && (
                <button type="button" className={styles.avisoBtn} onClick={() => ejecutar(aviso.accion)}>
                  {aviso.accion.etiqueta}
                  <ArrowRight size={12} aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                className={styles.avisoCerrar}
                onClick={() => descartarAviso(aviso)}
                aria-label="Descartar aviso"
              >
                <X size={13} aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
