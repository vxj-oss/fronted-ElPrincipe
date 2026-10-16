import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Check, FileDown, ArrowRight, Sparkles } from 'lucide-react';
import { descargarArchivo } from '../../utils/descargas';
import { descargarGraficoPdf, descargarInformePdf } from './graficoExport';
import { useAgentContext } from './AgentContext';
import styles from './agent.module.css';

async function copiarTexto(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
}

function FilaAnalisis({ fila, onConsultar }) {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    if (await copiarTexto(fila.mensaje)) {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    }
  };

  return (
    <li className={styles.analisisFila}>
      <div className={styles.analisisTexto}>
        <strong>{fila.titulo}</strong>
        <span>{fila.detalle}</span>
      </div>
      <div className={styles.analisisBotones}>
        {fila.mensaje && (
          <button type="button" onClick={copiar} className={styles.seguimientoBtn}>
            {copiado ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
            {copiado ? 'Copiado' : 'Copiar mensaje'}
          </button>
        )}
        {fila.consulta && (
          <button type="button" onClick={() => onConsultar(fila.consulta)} className={styles.seguimientoBtn}>
            <Sparkles size={12} aria-hidden="true" />
            Cotizar
          </button>
        )}
      </div>
    </li>
  );
}

export function AccionesChat({ acciones }) {
  const navigate = useNavigate();
  const { usarSeguimiento, cerrarPanel } = useAgentContext();
  const [error, setError] = useState('');

  const ejecutar = async (accion) => {
    setError('');
    if (accion.tipo === 'descarga') {
      try {
        await descargarArchivo(accion.ruta, accion.nombre);
      } catch {
        setError('No se pudo generar el archivo.');
      }
      return;
    }
    if (accion.tipo === 'pdf_grafico') {
      try {
        await descargarGraficoPdf(accion.grafico);
      } catch {
        setError('No se pudo generar el PDF.');
      }
      return;
    }
    if (accion.tipo === 'pdf_informe') {
      try {
        await descargarInformePdf(accion.informe);
      } catch {
        setError('No se pudo generar el PDF.');
      }
      return;
    }
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
    <div className={styles.accionesChat}>
      <div className={styles.accionesFila}>
        {acciones.map((accion) => (
          <button
            key={`${accion.tipo}-${accion.etiqueta}`}
            type="button"
            onClick={() => ejecutar(accion)}
            className={styles.seguimientoBtn}
          >
            {accion.tipo === 'descarga' || accion.tipo === 'pdf_grafico' || accion.tipo === 'pdf_informe' ? <FileDown size={12} aria-hidden="true" /> : <ArrowRight size={12} aria-hidden="true" />}
            {accion.etiqueta}
          </button>
        ))}
      </div>
      {error && <p className={styles.borradorError}>{error}</p>}
    </div>
  );
}

export default function AnalisisChat({ datos }) {
  const { usarSeguimiento } = useAgentContext();

  return (
    <>
      {datos.filas?.length > 0 && (
        <ul className={styles.analisisLista}>
          {datos.filas.map((fila) => (
            <FilaAnalisis key={fila.titulo} fila={fila} onConsultar={usarSeguimiento} />
          ))}
        </ul>
      )}
      {datos.acciones?.length > 0 && <AccionesChat acciones={datos.acciones} />}
    </>
  );
}
