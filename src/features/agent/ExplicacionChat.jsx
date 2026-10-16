import { useState } from 'react';
import { Calculator, ChevronUp } from 'lucide-react';
import styles from './agent.module.css';

export default function ExplicacionChat({ explicacion }) {
  const [abierta, setAbierta] = useState(false);

  return (
    <div className={styles.explicacion}>
      <button
        type="button"
        onClick={() => setAbierta((v) => !v)}
        className={styles.explicacionBtn}
        aria-expanded={abierta}
      >
        {abierta ? <ChevronUp size={12} aria-hidden="true" /> : <Calculator size={12} aria-hidden="true" />}
        ¿Cómo lo calculaste?
      </button>
      {abierta && (
        <div className={styles.explicacionCuerpo}>
          <p>{explicacion.resumen}</p>
          {explicacion.fuentes?.length > 0 && (
            <>
              <h4>Datos usados</h4>
              <ul>
                {explicacion.fuentes.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </>
          )}
          {explicacion.periodo && (
            <p>
              <strong>Periodo:</strong> {explicacion.periodo}
            </p>
          )}
          {explicacion.formula && (
            <p>
              <strong>Fórmula:</strong> <code>{explicacion.formula}</code>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
