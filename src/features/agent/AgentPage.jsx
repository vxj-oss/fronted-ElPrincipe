import { Plus, Send, Bot, AlertCircle, Sparkles } from 'lucide-react';
import { useAgent } from './useAgent';
import { useAuth } from '../../context/AuthContext';
import { EMPRESA } from '../../constants/appConstants';
import styles from './agent.module.css';

function Burbuja({ mensaje, avatarAgente, avatarUsuario }) {
  const esAgente = mensaje.rol === 'agent';
  const esError = mensaje.tipo === 'error';

  const hora = new Date(mensaje.timestamp).toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`${styles.msgRow} ${esAgente ? styles.msgAgent : styles.msgUser}`}>
      <div className={`${styles.avatar} ${esAgente ? styles.avatarAgent : styles.avatarUser}`}>
        {esAgente ? avatarAgente : avatarUsuario}
      </div>
      <div className={styles.bubbleWrap}>
        <div
          className={`
            ${styles.bubble}
            ${esAgente ? styles.bubbleAgent : styles.bubbleUser}
            ${esError ? styles.bubbleError : ''}
          `}
        >
          {mensaje.texto && (
            <p className={styles.bubbleTexto} style={{ whiteSpace: 'pre-line' }}>
              {mensaje.texto}
            </p>
          )}
        </div>
        <span className={styles.bubbleHora}>{hora}</span>
      </div>
    </div>
  );
}

function TypingIndicator({ avatarAgente }) {
  return (
    <div className={`${styles.msgRow} ${styles.msgAgent}`}>
      <div className={`${styles.avatar} ${styles.avatarAgent}`}>{avatarAgente}</div>
      <div className={styles.typing}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>
    </div>
  );
}

function HistorialItem({ conv, activa, onClick }) {
  const fecha = new Date(conv.fechaISO).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <button
      onClick={() => onClick(conv.id)}
      className={`${styles.histItem} ${activa ? styles.histItemActivo : ''}`}
      aria-current={activa ? 'page' : undefined}
    >
      <span className={styles.histLabel}>{conv.titulo}</span>
      <span className={styles.histFecha}>{fecha}</span>
    </button>
  );
}

export default function AgentPage() {
  const { user } = useAuth();
  const {
    conversaciones,
    conversacionActiva,
    mensajes,
    input,
    enviando,
    cargando,
    error,
    preguntasSugeridas,
    chatBodyRef,
    inputRef,
    seleccionarConversacion,
    nuevaConversacion,
    handleInputChange,
    handleEnviar,
    handleKeyDown,
    usarPreguntaSugerida,
    limpiarError,
  } = useAgent();

  const inicialesAgente = <Bot size={16} aria-hidden="true" />;
  const inicialesUsuario = user?.nombre_completo
    ? user.nombre_completo.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    : 'US';

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label="Historial de conversaciones">
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitulo}>Conversaciones</h2>
          <button
            onClick={nuevaConversacion}
            className={styles.btnNueva}
            title="Nueva conversación"
          >
            <Plus size={14} aria-hidden="true" />
            Nueva consulta
          </button>
        </div>

        <nav className={styles.histLista}>
          {cargando ? (
            <div className={styles.histCargando}>Cargando...</div>
          ) : conversaciones.length === 0 ? (
            <p className={styles.histVacio}>Sin conversaciones aún</p>
          ) : (
            conversaciones.map((conv) => (
              <HistorialItem
                key={conv.id}
                conv={conv}
                activa={conv.id === conversacionActiva}
                onClick={seleccionarConversacion}
              />
            ))
          )}
        </nav>
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
          <div className={styles.statusRow}>
            <span className={styles.statusDot} aria-hidden="true" />
            <span className={styles.statusLabel}>En línea</span>
          </div>
        </header>

        {error && (
          <div className={styles.errorBanner} role="alert">
            <AlertCircle size={14} aria-hidden="true" />
            {error}
            <button onClick={limpiarError} className={styles.errorClose} aria-label="Cerrar">
              ×
            </button>
          </div>
        )}

        <div
          className={styles.chatBody}
          ref={chatBodyRef}
          aria-live="polite"
          aria-label="Conversación con el agente"
        >
          {mensajes.map((m) => (
            <Burbuja
              key={m.id}
              mensaje={m}
              avatarAgente={inicialesAgente}
              avatarUsuario={inicialesUsuario}
            />
          ))}

          {enviando && <TypingIndicator avatarAgente={inicialesAgente} />}
        </div>

        <div className={styles.suggRow} aria-label="Preguntas sugeridas">
          {preguntasSugeridas.slice(0, 4).map((p) => (
            <button
              key={p}
              onClick={() => usarPreguntaSugerida(p)}
              className={styles.suggBtn}
            >
              <Sparkles size={12} className="inline mr-1" />
              {p.length > 42 ? p.slice(0, 40) + '…' : p}
            </button>
          ))}
        </div>

        <div className={styles.inputRow}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Pregunta sobre ventas, stock, clientes o cotizaciones..."
            className={styles.chatInput}
            rows={1}
            aria-label="Escribe tu mensaje"
            disabled={enviando}
          />
          <button
            onClick={handleEnviar}
            disabled={!input.trim() || enviando}
            className={styles.sendBtn}
            aria-label="Enviar mensaje"
          >
            <Send size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}