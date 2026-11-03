import { useEffect, useRef, useState } from 'react';
import { FileDown, Printer } from 'lucide-react';
import Modal from './Modal';
import styles from './VistaTicketModal.module.css';

export default function VistaTicketModal({ open, onClose, titulo, obtenerBlob, nombreArchivo }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const marcoRef = useRef(null);
  const obtenerRef = useRef(obtenerBlob);
  obtenerRef.current = obtenerBlob;

  useEffect(() => {
    if (!open) return undefined;
    let activo = true;
    let creada = '';
    setCargando(true);
    setError('');
    setUrl('');
    obtenerRef.current()
      .then((blob) => {
        if (!activo) return;
        creada = URL.createObjectURL(blob);
        setUrl(creada);
      })
      .catch((e) => activo && setError(e.message || 'No se pudo generar el ticket.'))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
      if (creada) URL.revokeObjectURL(creada);
    };
  }, [open]);

  const imprimir = () => {
    try {
      marcoRef.current.contentWindow.focus();
      marcoRef.current.contentWindow.print();
    } catch {
      window.open(url, '_blank');
    }
  };

  const descargar = () => {
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombreArchivo;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={titulo}
      size="md"
      footer={
        <>
          <button type="button" className={styles.btn} onClick={onClose}>
            Cerrar
          </button>
          <button type="button" className={styles.btn} onClick={descargar} disabled={!url}>
            <FileDown size={14} aria-hidden="true" /> Descargar
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnPrimario}`} onClick={imprimir} disabled={!url}>
            <Printer size={14} aria-hidden="true" /> Imprimir
          </button>
        </>
      }
    >
      {cargando && <p style={{ padding: '24px 0', textAlign: 'center', fontSize: '0.8125rem' }}>Generando ticket…</p>}
      {error && <p style={{ padding: '12px 0', fontSize: '0.8125rem', color: '#b91c1c' }}>{error}</p>}
      {url && (
        <iframe
          ref={marcoRef}
          src={url}
          title={titulo}
          style={{ width: '100%', height: '65vh', border: '1px solid #ebebeb', borderRadius: 16, background: '#fff' }}
        />
      )}
    </Modal>
  );
}
