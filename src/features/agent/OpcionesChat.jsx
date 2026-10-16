import { useState } from 'react';
import { useAgentContext } from './AgentContext';
import styles from './agent.module.css';

export default function OpcionesChat({ datos }) {
  const { usarSeguimiento, enviando } = useAgentContext();
  const [elegida, setElegida] = useState(null);

  const elegir = (opcion) => {
    setElegida(opcion.consulta);
    usarSeguimiento(opcion.consulta);
  };

  return (
    <div className={styles.opcionesChat} role="group" aria-label="Elige una opción">
      {datos.opciones.map((opcion) => (
        <button
          key={opcion.consulta}
          type="button"
          disabled={enviando || (elegida !== null && elegida !== opcion.consulta)}
          className={`${styles.opcionBtn} ${elegida === opcion.consulta ? styles.opcionBtnElegida : ''}`}
          onClick={() => elegir(opcion)}
        >
          {opcion.etiqueta}
        </button>
      ))}
    </div>
  );
}
