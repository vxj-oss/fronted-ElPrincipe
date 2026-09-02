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
    id: `resp-${Date.now()}`,
    rol: 'agent',
    texto: response.respuesta,
    timestamp: new Date().toISOString(),
    tipo: 'texto',
    datos_estructurados: response.datos_estructurados || null,
    sesion_id: response.sesion_id,
  };
}