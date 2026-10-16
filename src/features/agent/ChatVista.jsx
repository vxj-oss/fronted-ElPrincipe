import { useEffect, useMemo, useState } from 'react';
import { Send, Bot, AlertCircle, Sparkles, Mic, Square, Volume2, Eye, EyeOff } from 'lucide-react';
import { useAgentContext } from './AgentContext';
import { useAuth } from '../../context/AuthContext';
import BorradorCotizacion from './BorradorCotizacion';
import GraficoChat from './GraficoChat';
import BorradorPedido from './BorradorPedido';
import AccionEstado from './AccionEstado';
import AnalisisChat from './AnalisisChat';
import ExplicacionChat from './ExplicacionChat';
import AvisosAgente from './AvisosAgente';
import OpcionesChat from './OpcionesChat';
import NavegacionChat from './NavegacionChat';
import AccionStock from './AccionStock';
import AccionCondicion from './AccionCondicion';
import AccionProducto from './AccionProducto';
import BorradorProducto from './BorradorProducto';
import AccionEntidad from './AccionEntidad';
import BorradorCliente from './BorradorCliente';
import styles from './agent.module.css';

function TextoRespuesta({ texto, animar, onTermina }) {
  const { chatBodyRef } = useAgentContext();
  const piezas = useMemo(() => texto.split(/(\s+)/), [texto]);
  const [visibles, setVisibles] = useState(animar ? 0 : piezas.length);

  useEffect(() => {
    if (!animar) {
      setVisibles(piezas.length);
      return undefined;
    }
    const paso = Math.max(1, Math.ceil(piezas.length / 70));
    const temporizador = setInterval(() => {
      setVisibles((actual) => {
        const siguiente = Math.min(piezas.length, actual + paso);
        if (siguiente >= piezas.length) clearInterval(temporizador);
        return siguiente;
      });
    }, 26);
    return () => clearInterval(temporizador);
  }, [animar, piezas]);

  useEffect(() => {
    if (chatBodyRef.current) chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    if (visibles >= piezas.length) onTermina?.();
  }, [visibles, piezas.length, chatBodyRef, onTermina]);

  return (
    <p className={styles.bubbleTexto} style={{ whiteSpace: 'pre-line' }}>
      {animar ? piezas.slice(0, visibles).join('') : texto}
    </p>
  );
}

export function Burbuja({ mensaje, avatarAgente, avatarUsuario, inicioAtencion }) {
  const { voz } = useAgentContext();
  const esAgente = mensaje.rol === 'agent';
  const esError = mensaje.tipo === 'error';
  const [textoTerminado, setTextoTerminado] = useState(!mensaje.animar);
  const datos = mensaje.datos_estructurados;
  const mostrarExtras = esAgente && textoTerminado && !mensaje.transmitiendo;
  const hablando = voz.hablandoId === mensaje.id;

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
            <TextoRespuesta
              texto={mensaje.texto}
              animar={Boolean(mensaje.animar)}
              onTermina={() => setTextoTerminado(true)}
            />
          )}
          {mostrarExtras && datos?.tipo === 'borrador_cotizacion' && (
            <BorradorCotizacion mensajeId={mensaje.id} datos={datos} inicioAtencion={inicioAtencion} />
          )}
          {mostrarExtras && datos?.tipo === 'borrador_pedido' && (
            <BorradorPedido mensajeId={mensaje.id} datos={datos} inicioAtencion={inicioAtencion} />
          )}
          {mostrarExtras && datos?.tipo === 'accion_estado' && <AccionEstado mensajeId={mensaje.id} datos={datos} />}
          {mostrarExtras && datos?.tipo === 'accion_stock' && <AccionStock mensajeId={mensaje.id} datos={datos} />}
          {mostrarExtras && datos?.tipo === 'accion_condicion' && <AccionCondicion mensajeId={mensaje.id} datos={datos} />}
          {mostrarExtras && datos?.tipo === 'accion_producto' && <AccionProducto mensajeId={mensaje.id} datos={datos} />}
          {mostrarExtras && datos?.tipo === 'borrador_producto' && <BorradorProducto mensajeId={mensaje.id} datos={datos} />}
          {mostrarExtras && ['accion_cliente', 'accion_cotizacion', 'accion_pedido_items'].includes(datos?.tipo) && (
            <AccionEntidad mensajeId={mensaje.id} datos={datos} />
          )}
          {mostrarExtras && datos?.tipo === 'borrador_cliente' && <BorradorCliente mensajeId={mensaje.id} datos={datos} />}
          {mostrarExtras && datos?.tipo === 'opciones' && <OpcionesChat datos={datos} />}
          {mostrarExtras && datos?.tipo === 'navegacion' && <NavegacionChat datos={datos} />}
          {mostrarExtras && datos?.tipo === 'grafico' && <GraficoChat datos={datos} />}
          {mostrarExtras && datos?.tipo === 'analisis' && <AnalisisChat datos={datos} />}
          {mostrarExtras && datos?.explicacion && <ExplicacionChat explicacion={datos.explicacion} />}
        </div>
        <div className={styles.bubblePie}>
          <span className={styles.bubbleHora}>{hora}</span>
          {esAgente && voz.soportada && mensaje.texto && !mensaje.transmitiendo && (
            <button
              type="button"
              className={`${styles.bubbleVoz} ${hablando ? styles.bubbleVozActiva : ''}`}
              onClick={() => voz.alternar(mensaje.id, mensaje.texto)}
              aria-label={hablando ? 'Detener lectura' : 'Leer en voz alta'}
              title={hablando ? 'Detener lectura' : 'Leer en voz alta'}
            >
              {hablando ? <Square size={11} aria-hidden="true" /> : <Volume2 size={13} aria-hidden="true" />}
            </button>
          )}
        </div>
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

export default function ChatVista() {
  const { user } = useAuth();
  const {
    mensajes,
    input,
    enviando,
    error,
    preguntasSugeridas,
    chatBodyRef,
    inputRef,
    handleInputChange,
    handleEnviar,
    handleKeyDown,
    usarSeguimiento,
    comandosVisibles,
    comandoActivo,
    setComandoActivo,
    seleccionarComando,
    limpiarError,
    dictado,
    entidadPantalla,
    usarPantalla,
    setUsarPantalla,
  } = useAgentContext();

  const avatarAgente = <Bot size={16} aria-hidden="true" />;
  const avatarUsuario = user?.nombre_completo
    ? user.nombre_completo.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    : 'US';

  return (
    <>
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
        <AvisosAgente />
        {mensajes.map((m, i) => (
          <Burbuja
            key={m.id}
            mensaje={m}
            avatarAgente={avatarAgente}
            avatarUsuario={avatarUsuario}
            inicioAtencion={
              m.rol === 'agent'
                ? mensajes.slice(0, i).reverse().find((x) => x.rol === 'user')?.timestamp
                : undefined
            }
          />
        ))}

        {enviando && !mensajes.some((m) => m.transmitiendo) && <TypingIndicator avatarAgente={avatarAgente} />}
      </div>

      {entidadPantalla && (
        <div className={`${styles.chipContexto} ${usarPantalla ? '' : styles.chipContextoApagado}`}>
          {usarPantalla ? <Eye size={13} aria-hidden="true" /> : <EyeOff size={13} aria-hidden="true" />}
          <span>
            {usarPantalla ? 'Viendo' : 'Ignorando'}:{' '}
            <strong>{entidadPantalla.nombre || entidadPantalla.codigo}</strong>
          </span>
          <button type="button" onClick={() => setUsarPantalla(!usarPantalla)}>
            {usarPantalla ? 'Ignorar' : 'Usar'}
          </button>
        </div>
      )}

      <div className={styles.suggRow} aria-label="Preguntas sugeridas">
        {preguntasSugeridas.slice(0, 4).map((p) => (
          <button
            key={p}
            onClick={() => usarSeguimiento(p)}
            disabled={enviando}
            className={styles.suggBtn}
          >
            <Sparkles size={12} className="inline mr-1" />
            {p.length > 42 ? p.slice(0, 40) + '…' : p}
          </button>
        ))}
      </div>

      {dictado.errorDictado && (
        <div className={styles.errorBanner} role="alert">
          <AlertCircle size={14} aria-hidden="true" />
          {dictado.errorDictado}
        </div>
      )}

      {comandosVisibles.length > 0 && (
        <ul className={styles.comandosMenu} role="listbox" aria-label="Comandos disponibles">
          {comandosVisibles.map((c, i) => (
            <li key={c.cmd} role="option" aria-selected={i === comandoActivo}>
              <button
                type="button"
                className={`${styles.comandoItem} ${i === comandoActivo ? styles.comandoItemActivo : ''}`}
                onMouseEnter={() => setComandoActivo(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  seleccionarComando(c);
                }}
              >
                <strong>{c.cmd}</strong>
                <span>{c.descripcion}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.inputRow}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Escribe tu pregunta…"
          className={styles.chatInput}
          rows={1}
          aria-label="Escribe tu mensaje"
          disabled={enviando}
        />
        {dictado.soportado && (
          <button
            type="button"
            onClick={() => dictado.alternar(input)}
            disabled={enviando}
            className={`${styles.micBtn} ${dictado.escuchando ? styles.micBtnActivo : ''}`}
            aria-label={dictado.escuchando ? 'Detener dictado' : 'Dictar por voz'}
            title={dictado.escuchando ? 'Detener dictado' : 'Dictar por voz'}
          >
            {dictado.escuchando ? <Square size={14} aria-hidden="true" /> : <Mic size={16} aria-hidden="true" />}
          </button>
        )}
        <button
          onClick={handleEnviar}
          disabled={!input.trim() || enviando}
          className={styles.sendBtn}
          aria-label="Enviar mensaje"
        >
          <Send size={16} aria-hidden="true" />
        </button>
      </div>
    </>
  );
}
