import { apiRequest, BASE_URL } from '../../utils/api';
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

export async function fetchAvisos() {
  const data = await apiRequest('/agent/avisos');
  return data?.avisos || [];
}

export async function fetchLecturaDashboard(forzar = false) {
  return apiRequest(`/agent/lectura-dashboard${forzar ? '?forzar=true' : ''}`);
}

export async function fetchConversaciones() {
  const data = await apiRequest('/agent/sessions');
  return data.map(normalizeSession);
}

export async function crearConversacion() {
  const data = await apiRequest('/agent/sessions', { method: 'POST', body: JSON.stringify({}) });
  return normalizeSession(data);
}

export async function eliminarConversacion(sessionId) {
  await apiRequest(`/agent/sessions/${sessionId}`, { method: 'DELETE' });
}

export async function eliminarTodasConversaciones() {
  await apiRequest('/agent/sessions', { method: 'DELETE' });
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

function normalizarRespuesta(response) {
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

export async function enviarMensajeStream({ sesionId, contenido, contextoAdicional = null, onDelta }) {
  const respuesta = await fetch(`${BASE_URL}/agent/chat/stream`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sesion_id: sesionId ? parseInt(sesionId, 10) : null,
      mensaje: contenido,
      contexto_adicional: contextoAdicional,
    }),
  });

  if (respuesta.status === 401) {
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Sesión expirada o no autorizada');
  }
  if (!respuesta.ok || !respuesta.body) throw new Error('No se pudo iniciar la respuesta.');

  const lector = respuesta.body.getReader();
  const decodificador = new TextDecoder();
  let pendiente = '';
  let final = null;

  const procesar = (bloque) => {
    const linea = bloque.split('\n').find((l) => l.startsWith('data:'));
    if (!linea) return;
    const evento = JSON.parse(linea.slice(5).trim());
    if (evento.t === 'delta') onDelta?.(evento.x);
    else if (evento.t === 'done') final = evento;
    else if (evento.t === 'error') throw new Error(evento.detalle || 'Error al procesar la consulta.');
  };

  for (;;) {
    const { done, value } = await lector.read();
    if (done) break;
    pendiente += decodificador.decode(value, { stream: true });
    let corte = pendiente.indexOf('\n\n');
    while (corte !== -1) {
      procesar(pendiente.slice(0, corte));
      pendiente = pendiente.slice(corte + 2);
      corte = pendiente.indexOf('\n\n');
    }
  }
  if (pendiente.trim()) procesar(pendiente);
  if (!final) throw new Error('La respuesta se interrumpió.');
  return normalizarRespuesta(final);
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
  { cmd: '/nuevocliente', descripcion: 'Registrar un cliente nuevo', plantilla: 'Crea el cliente ' },
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

const SUGERENCIAS_PANTALLA = {
  '/dashboard': ['¿Cómo vamos hoy?', '¿Cuál es mi avance de meta diaria?', 'Dame un resumen de ventas de EL PRÍNCIPE'],
  '/productos': ['¿Qué productos tienen stock crítico?', '¿Cuáles son los productos con más rotación esta semana?', 'Stock de …'],
  '/clientes': ['¿A quién debería llamar hoy?', '¿Qué clientes compraron hoy?', 'Resumen del cliente …'],
  '/solicitudes': ['Arma una cotización para…', 'Hazle a … lo mismo que la última vez', '¿A quién debería llamar hoy?'],
  '/pedidos': ['¿Qué pedidos están pendientes de confirmar?', '¿Qué clientes compraron hoy?', 'Estado del pedido PED-…'],
  '/indicadores': ['¿Cómo vamos hoy?', '¿Cuál es mi avance de meta diaria?', '¿Qué es el tiempo promedio de decisión?'],
  '/reportes': ['Dame un resumen de ventas de EL PRÍNCIPE', '¿Cuáles son los productos con más rotación esta semana?'],
};

export function sugerenciasPantalla(pathname) {
  return SUGERENCIAS_PANTALLA[pathname] || null;
}

const SUGERENCIAS_ENTIDAD = {
  cliente: [
    'Dame el resumen de este cliente',
    '¿Qué suele llevar este cliente?',
    'Hazle una cotización',
    '¿Cuándo fue su última compra?',
  ],
  pedido: [
    'Dame el detalle de este pedido',
    'Descarga el ticket de este pedido',
    'Descarga el PDF de este pedido',
    'Pásalo a entregado',
  ],
  producto: ['¿Cuánto stock queda de este producto?', '¿Cuál es su precio?', 'Repón 20 unidades'],
};

export function sugerenciasEntidad(tipo) {
  return SUGERENCIAS_ENTIDAD[tipo] || null;
}
