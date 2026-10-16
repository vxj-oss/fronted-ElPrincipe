import { useEffect } from 'react';
import { useAgentContext } from './AgentContext';

export function useContextoAgente(entidad) {
  const { registrarEntidad } = useAgentContext();
  const tipo = entidad?.tipo ?? null;
  const id = entidad?.id ?? null;
  const nombre = entidad?.nombre ?? null;
  const codigo = entidad?.codigo ?? null;

  useEffect(() => {
    registrarEntidad(tipo ? { tipo, id, nombre, codigo } : null);
    return () => registrarEntidad(null);
  }, [tipo, id, nombre, codigo, registrarEntidad]);
}
