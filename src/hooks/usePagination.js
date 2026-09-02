import { useState, useMemo, useEffect } from 'react';

export function usePagination(items, porPagina = 7) {
  const [pagina, setPagina] = useState(1);

  const totalItems = items.length;
  const totalPaginas = Math.max(1, Math.ceil(totalItems / porPagina));

  useEffect(() => {
    if (pagina > totalPaginas) setPagina(1);
  }, [totalPaginas, pagina]);

  const itemsPagina = useMemo(() => {
    const inicio = (pagina - 1) * porPagina;
    return items.slice(inicio, inicio + porPagina);
  }, [items, pagina, porPagina]);

  const irAPagina = (p) => setPagina(Math.min(Math.max(1, p), totalPaginas));
  const paginaAnterior = () => setPagina((p) => Math.max(1, p - 1));
  const paginaSiguiente = () => setPagina((p) => Math.min(totalPaginas, p + 1));

  return {
    itemsPagina,
    pagina,
    totalPaginas,
    totalItems,
    porPagina,
    irAPagina,
    paginaAnterior,
    paginaSiguiente,
  };
}
