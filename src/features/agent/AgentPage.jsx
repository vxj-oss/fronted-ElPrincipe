import { useState } from 'react';
import { Plus, Bot, Volume2, VolumeX, History, Trash2, X } from 'lucide-react';
import { useAgentContext } from './AgentContext';
import ChatVista from './ChatVista';
import ListaConversaciones from './ListaConversaciones';
import { EMPRESA } from '../../constants/appConstants';
import styles from './agent.module.css';

export default function AgentPage() {
  const {
    conversaciones,
    conversacionActiva,
    cargando,
    seleccionarConversacion,
    nuevaConversacion,
    eliminarUna,
    eliminarTodas,
    voz,
    leerAuto,
    setLeerAuto,
  } = useAgentContext();
  const [historialMovil, setHistorialMovil] = useState(false);
  const [confirmarTodas, setConfirmarTodas] = useState(false);

  const elegir = (id) => {
    setHistorialMovil(false);
    seleccionarConversacion(id);
  };

  const borrarTodas = () => {
    setConfirmarTodas(false);
    eliminarTodas();
  };

  const lista = (
    <ListaConversaciones
      conversaciones={conversaciones}
      activa={conversacionActiva}
      cargando={cargando}
      onSeleccionar={elegir}
      onEliminar={eliminarUna}
    />
  );

  const pieHistorial = conversaciones.length > 0 && (
    <div className={styles.histPie}>
      {confirmarTodas ? (
        <div className={styles.histConfirmar}>
          <span>¿Borrar todo el historial?</span>
          <div>
            <button type="button" className={styles.histBtnSi} onClick={borrarTodas}>
              Borrar todo
            </button>
            <button type="button" className={styles.histBtnNo} onClick={() => setConfirmarTodas(false)} aria-label="Cancelar">
              <X size={13} aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className={styles.histBorrarTodo} onClick={() => setConfirmarTodas(true)}>
          <Trash2 size={13} aria-hidden="true" /> Borrar todo el historial
        </button>
      )}
    </div>
  );

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label="Historial de conversaciones">
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitulo}>Conversaciones</h2>
          <button onClick={nuevaConversacion} className={styles.btnNueva} title="Nueva conversación">
            <Plus size={14} aria-hidden="true" />
            Nueva consulta
          </button>
        </div>

        <nav className={styles.histLista}>{lista}</nav>
        {pieHistorial}
      </aside>

      <div className={styles.chatPanel}>
        <header className={styles.chatTopbar}>
          <div className={styles.agentId}>
            <div className={styles.agentAvatar}>
              <Bot size={16} aria-hidden="true" />
            </div>
            <div>
              <p className={styles.agentNombre}>Agente Comercial IA</p>
              <p className={styles.agentSub}>{EMPRESA.NOMBRE} · {EMPRESA.SUBTITULO}</p>
            </div>
          </div>
          <div className={styles.topbarAcciones}>
            {voz.soportada && (
              <button
                type="button"
                onClick={() => setLeerAuto(!leerAuto)}
                className={`${styles.btnVozAuto} ${leerAuto ? styles.btnVozAutoActivo : ''}`}
                aria-pressed={leerAuto}
                aria-label={leerAuto ? 'Desactivar lectura automática' : 'Leer respuestas en voz alta'}
                title={leerAuto ? 'Lectura automática activada' : 'Leer respuestas en voz alta'}
              >
                {leerAuto ? <Volume2 size={15} aria-hidden="true" /> : <VolumeX size={15} aria-hidden="true" />}
                <span>{leerAuto ? 'Voz activada' : 'Voz'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setHistorialMovil(true)}
              className={styles.btnNuevaMovil}
              aria-label="Historial de conversaciones"
            >
              <History size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={nuevaConversacion}
              className={styles.btnNuevaMovil}
              aria-label="Nueva consulta"
            >
              <Plus size={16} aria-hidden="true" />
            </button>
            <div className={styles.statusRow}>
              <span className={styles.statusDot} aria-hidden="true" />
              <span className={styles.statusLabel}>En línea</span>
            </div>
          </div>
        </header>

        <ChatVista />
      </div>

      {historialMovil && (
        <div className={styles.historialMovil} role="dialog" aria-label="Historial de conversaciones">
          <div className={styles.historialMovilCab}>
            <h2 className={styles.sidebarTitulo}>Conversaciones</h2>
            <button type="button" className={styles.flotanteBtnOscuro} onClick={() => setHistorialMovil(false)} aria-label="Cerrar">
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            className={styles.btnNueva}
            onClick={() => {
              setHistorialMovil(false);
              nuevaConversacion();
            }}
          >
            <Plus size={14} aria-hidden="true" /> Nueva consulta
          </button>
          <div className={styles.historialMovilLista}>{lista}</div>
          {pieHistorial}
        </div>
      )}
    </div>
  );
}
