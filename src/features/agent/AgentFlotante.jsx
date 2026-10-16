import { useEffect, useState } from 'react';
import { Bot, X, Maximize2, Plus, Volume2, VolumeX, History, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAgentContext } from './AgentContext';
import ChatVista from './ChatVista';
import ListaConversaciones from './ListaConversaciones';
import { EMPRESA } from '../../constants/appConstants';
import styles from './agent.module.css';

export default function AgentFlotante() {
  const navigate = useNavigate();
  const {
    panelAbierto,
    abrirPanel,
    cerrarPanel,
    nuevaConversacion,
    pathname,
    inputRef,
    avisosNuevos,
    globoOculto,
    ocultarGlobo,
    voz,
    leerAuto,
    setLeerAuto,
    conversaciones,
    conversacionActiva,
    cargando,
    seleccionarConversacion,
    eliminarUna,
  } = useAgentContext();
  const [verHistorial, setVerHistorial] = useState(false);

  useEffect(() => {
    if (!panelAbierto) return undefined;
    const t = setTimeout(() => inputRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, [panelAbierto, inputRef]);

  useEffect(() => {
    if (!panelAbierto) return undefined;
    const alPresionar = (e) => {
      if (e.key === 'Escape') cerrarPanel();
    };
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [panelAbierto, cerrarPanel]);

  useEffect(() => {
    if (!panelAbierto) setVerHistorial(false);
  }, [panelAbierto]);

  if (pathname === '/agente') return null;

  return (
    <>
      {!panelAbierto && avisosNuevos.length > 0 && !globoOculto && (
        <div className={styles.fabGlobo} role="status">
          <button type="button" className={styles.fabGloboTexto} onClick={abrirPanel}>
            <strong>{avisosNuevos[0].titulo}</strong>
            <span>Toca para ver los avisos</span>
          </button>
          <button type="button" className={styles.fabGloboCerrar} onClick={ocultarGlobo} aria-label="Cerrar aviso">
            <X size={12} aria-hidden="true" />
          </button>
        </div>
      )}

      {!panelAbierto && (
        <button
          type="button"
          className={styles.fabAgente}
          onClick={abrirPanel}
          aria-label={
            avisosNuevos.length > 0
              ? `Abrir el agente comercial, ${avisosNuevos.length} avisos nuevos`
              : 'Abrir el agente comercial'
          }
          title="Agente comercial IA"
        >
          <Bot size={26} aria-hidden="true" />
          {avisosNuevos.length > 0 ? (
            <span className={styles.fabInsignia}>{avisosNuevos.length}</span>
          ) : (
            <span className={styles.fabPunto} aria-hidden="true" />
          )}
        </button>
      )}

      {panelAbierto && (
        <section
          className={`${styles.chatPanel} ${styles.flotante}`}
          role="dialog"
          aria-label="Agente comercial IA"
        >
          <header className={styles.flotanteHeader}>
            <div className={styles.agentId}>
              <div className={styles.agentAvatar}>
                <Bot size={16} aria-hidden="true" />
              </div>
              <div>
                <p className={styles.agentNombre}>Agente Comercial IA</p>
                <p className={styles.flotanteSub}>{EMPRESA.NOMBRE}</p>
              </div>
            </div>
            <div className={styles.flotanteAcciones}>
              {voz.soportada && (
                <button
                  type="button"
                  onClick={() => setLeerAuto(!leerAuto)}
                  className={styles.flotanteBtn}
                  aria-pressed={leerAuto}
                  aria-label={leerAuto ? 'Desactivar lectura automática' : 'Leer respuestas en voz alta'}
                  title={leerAuto ? 'Lectura automática activada' : 'Leer respuestas en voz alta'}
                >
                  {leerAuto ? <Volume2 size={16} aria-hidden="true" /> : <VolumeX size={16} aria-hidden="true" />}
                </button>
              )}
              <button
                type="button"
                onClick={() => setVerHistorial((v) => !v)}
                className={styles.flotanteBtn}
                aria-pressed={verHistorial}
                aria-label="Historial de conversaciones"
                title="Historial de conversaciones"
              >
                <History size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setVerHistorial(false);
                  nuevaConversacion();
                }}
                className={styles.flotanteBtn}
                aria-label="Nueva consulta"
                title="Nueva consulta"
              >
                <Plus size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => {
                  cerrarPanel();
                  navigate('/agente');
                }}
                className={styles.flotanteBtn}
                aria-label="Abrir en pantalla completa"
                title="Abrir en pantalla completa"
              >
                <Maximize2 size={15} aria-hidden="true" />
              </button>
              <button type="button" onClick={cerrarPanel} className={styles.flotanteBtn} aria-label="Cerrar" title="Cerrar">
                <X size={17} aria-hidden="true" />
              </button>
            </div>
          </header>
          {verHistorial ? (
            <div className={styles.flotanteHistorial}>
              <div className={styles.flotanteHistorialCab}>
                <button type="button" className={styles.flotanteVolver} onClick={() => setVerHistorial(false)}>
                  <ArrowLeft size={14} aria-hidden="true" /> Volver al chat
                </button>
                <button
                  type="button"
                  className={styles.flotanteNueva}
                  onClick={() => {
                    setVerHistorial(false);
                    nuevaConversacion();
                  }}
                >
                  <Plus size={14} aria-hidden="true" /> Nueva
                </button>
              </div>
              <div className={styles.flotanteHistorialLista}>
                <ListaConversaciones
                  conversaciones={conversaciones}
                  activa={conversacionActiva}
                  cargando={cargando}
                  onSeleccionar={(id) => {
                    setVerHistorial(false);
                    seleccionarConversacion(id);
                  }}
                  onEliminar={eliminarUna}
                />
              </div>
            </div>
          ) : (
            <ChatVista />
          )}
        </section>
      )}
    </>
  );
}
