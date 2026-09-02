import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Pagination.module.css';

export default function Pagination({
  pagina,
  totalPaginas,
  totalItems,
  porPagina,
  onIrA,
  onAnterior,
  onSiguiente,
  etiqueta = 'registros',
}) {
  if (totalPaginas <= 1) return null;

  const inicio = (pagina - 1) * porPagina + 1;
  const fin = Math.min(pagina * porPagina, totalItems);

  const paginas = [];
  let desde = Math.max(1, pagina - 2);
  let hasta = Math.min(totalPaginas, pagina + 2);
  if (pagina <= 2) hasta = Math.min(5, totalPaginas);
  if (pagina >= totalPaginas - 1) desde = Math.max(1, totalPaginas - 4);
  for (let i = desde; i <= hasta; i++) paginas.push(i);

  return (
    <div className={styles.paginacion}>
      <p className={styles.paginacionInfo}>
        Mostrando {inicio}–{fin} de {totalItems} {etiqueta}
      </p>
      <div className={styles.paginacionBtns}>
        <button
          onClick={onAnterior}
          disabled={pagina === 1}
          className={styles.btnPag}
          aria-label="Página anterior"
        >
          <ChevronLeft size={14} aria-hidden="true" />
        </button>

        {desde > 1 && (
          <>
            <button onClick={() => onIrA(1)} className={styles.btnPag}>1</button>
            {desde > 2 && <span className={styles.paginacionEllipsis}>…</span>}
          </>
        )}

        {paginas.map((p) => (
          <button
            key={p}
            onClick={() => onIrA(p)}
            className={`${styles.btnPag} ${p === pagina ? styles.btnPagActivo : ''}`}
            aria-current={p === pagina ? 'page' : undefined}
          >
            {p}
          </button>
        ))}

        {hasta < totalPaginas && (
          <>
            {hasta < totalPaginas - 1 && <span className={styles.paginacionEllipsis}>…</span>}
            <button onClick={() => onIrA(totalPaginas)} className={styles.btnPag}>
              {totalPaginas}
            </button>
          </>
        )}

        <button
          onClick={onSiguiente}
          disabled={pagina === totalPaginas}
          className={styles.btnPag}
          aria-label="Página siguiente"
        >
          <ChevronRight size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
