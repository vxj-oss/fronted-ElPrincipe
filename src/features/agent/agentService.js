import { apiRequest } from '../../utils/api';
import { PREGUNTAS_SUGERIDAS_AGENTE as PREGUNTAS_SUGERIDAS } from '../../constants/appConstants';

export { PREGUNTAS_SUGERIDAS };

function normalizeSession(s) {
  return {
    id: s.id,
    titulo: s.titulo_sesion || 'Consulta Asistente de Ventas',
    fechaISO: s.fecha_creacion || new Date().toISOString(),
    activa: s.esta_activa ?? true,
  };
}

function normalizeMessage(m) {
  return {
    id: String(m.id || Date.now()),
    rol: m.rol_emisor === 'user' ? 'user' : 'agent',
    texto: m.contenido,
    timestamp: m.fecha_hora || new Date().toISOString(),
    tipo: 'texto',
    datos_estructurados: m.datos_estructurados || null,
  };
}

export async function fetchResumenDia() {
  const data = await apiRequest('/agent/resumen-dia');
  return data?.texto || null;
}

export async function fetchConversaciones() {
  const data = await apiRequest('/agent/sessions');
  return data.map(normalizeSession);
}

export async function fetchMensajes(sessionId) {
  const data = await apiRequest(`/agent/sessions/${sessionId}`);
  return (data.mensajes || []).map(normalizeMessage);
}

export async function enviarMensaje({ sesionId, contenido, contextoAdicional = null }) {
  const payload = {
    sesion_id: sesionId ? parseInt(sesionId, 10) : null,
    mensaje: contenido,
    contexto_adicional: contextoAdicional,
  };

  const response = await apiRequest('/agent/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return {
    id: response.mensaje_id ? String(response.mensaje_id) : `resp-${Date.now()}`,
    rol: 'agent',
    texto: response.respuesta,
    timestamp: new Date().toISOString(),
    tipo: 'texto',
    datos_estructurados: response.datos_estructurados || null,
    sesion_id: response.sesion_id,
  };
}

const SEGUIMIENTO = [
  {
    patron: /borrador|cotizaci[oó]n .* registrad/i,
    sugerencias: ['Ver mis cotizaciones pendientes', 'Arma una cotización para…', '¿A quién debería llamar hoy?'],
  },
  {
    patron: /stock|producto|precio|papelera|lej[ií]a|detergente/i,
    sugerencias: ['¿Qué productos tienen stock crítico?', '¿Cuáles son los productos con más rotación esta semana?', 'Arma una cotización para…'],
  },
  {
    patron: /llamar|sin comprar|compr/i,
    sugerencias: ['¿Qué clientes compraron hoy?', 'Hazle a … lo mismo que la última vez', '¿Cómo vamos hoy?'],
  },
  {
    patron: /indicador|vamos|ncca|npp|tptd|sem[aá]foro|pedidos procesados/i,
    sugerencias: ['¿Qué pedidos están pendientes de confirmar?', '¿Cuáles son los productos con más rotación esta semana?', 'Dame un resumen de ventas de EL PRÍNCIPE'],
  },
];

export function sugerirSeguimiento(mensajes) {
  const ultimoAgente = [...mensajes].reverse().find((m) => m.rol === 'agent' && m.id !== 'welcome');
  if (!ultimoAgente) return PREGUNTAS_SUGERIDAS.slice(0, 4);

  const ultimoUsuario = [...mensajes].reverse().find((m) => m.rol === 'user');
  const contexto = `${ultimoUsuario?.texto || ''} ${ultimoAgente.texto || ''}`;
  const coincidencia = SEGUIMIENTO.find((s) => s.patron.test(contexto));
  return (coincidencia ? coincidencia.sugerencias : PREGUNTAS_SUGERIDAS).slice(0, 3);
}

export const COMANDOS = [
  { cmd: '/resumen', descripcion: 'Cómo vamos hoy (indicadores)', texto: '¿Cómo vamos hoy?' },
  { cmd: '/ventas', descripcion: 'Ventas de hoy, la semana y el mes', texto: 'resumen de ventas' },
  { cmd: '/margen', descripcion: 'Margen de hoy, la semana y el mes', texto: 'margen' },
  { cmd: '/meta', descripcion: 'Avance de la meta diaria', texto: '¿Cuál es mi avance de meta diaria?' },
  { cmd: '/masvendidos', descripcion: 'Productos más vendidos del mes', texto: 'productos más vendidos del mes' },
  { cmd: '/critico', descripcion: 'Productos con stock crítico', texto: 'stock crítico' },
  { cmd: '/pendientes', descripcion: 'Pedidos pendientes de confirmar', texto: 'pedidos pendientes de confirmar' },
  { cmd: '/llamar', descripcion: 'Clientes con 30 o más días sin comprar', texto: '¿A quién debería llamar hoy?' },
  { cmd: '/stock', descripcion: 'Stock y precio de un producto', plantilla: 'stock de ' },
  { cmd: '/cliente', descripcion: 'Resumen de un cliente', plantilla: 'resumen del cliente ' },
  { cmd: '/pedido', descripcion: 'Detalle de un pedido por código', plantilla: 'estado del pedido PED-' },
  { cmd: '/cotizacion', descripcion: 'Detalle de una cotización por código', plantilla: 'detalle de la cotización COT-' },
  { cmd: '/cotizar', descripcion: 'Armar una cotización', plantilla: 'Arma una cotización para ' },
  { cmd: '/repetir', descripcion: 'Repetir la última cotización de un cliente', plantilla: 'Repite la última cotización de ' },
  { cmd: '/ayuda', descripcion: 'Qué puedo preguntar', texto: '¿Qué puedes hacer?' },
];

export function filtrarComandos(entrada) {
  const buscado = entrada.toLowerCase();
  return COMANDOS.filter((c) => c.cmd.startsWith(buscado));
}

export function expandirComando(texto) {
  if (!texto.startsWith('/')) return texto;
  const [cmd, ...resto] = texto.split(/\s+/);
  const comando = COMANDOS.find((c) => c.cmd === cmd.toLowerCase());
  if (!comando) return texto;
  if (comando.texto) return comando.texto;
  return `${comando.plantilla}${resto.join(' ')}`.trim();
}
