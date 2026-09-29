export const EMPRESA = {
  NOMBRE: 'EL PRÍNCIPE',
  SUBTITULO: 'Sistema de Gestión Comercial e Inteligencia de Ventas',
  RUC: '20601234567',
  CIUDAD: 'Trujillo, La Libertad, Perú',
  MONEDA_SIMBOLO: 'S/',
  MONEDA_CODIGO: 'PEN',
};

export const DISTRITOS_TRUJILLO = [
  'Trujillo',
  'La Esperanza',
  'El Porvenir',
  'Florencia de Mora',
  'Víctor Larco Herrera',
  'Huanchaco',
  'Moche',
  'Salaverry',
  'Laredo',
];

export const TIPOS_CLIENTE = ['Mayorista', 'Institucional', 'Minorista'];
export const CLASIFICACIONES_CLIENTE = ['Regular', 'VIP'];
export const UNIDADES_MEDIDA = ['Galón', 'Bidón 5L', 'Saco 15Kg', 'Unidad'];
export const NIVELES_ROTACION = ['Alta', 'Media', 'Baja'];

export const ESTADOS_PEDIDO = [
  'Pendiente',
  'Aprobado',
  'Entregado',
  'Cancelado',
];

export const FORMAS_PAGO = ['Contado'];

export const ROLES_USUARIO = {
  ASESOR: 'asesor',
  ADMINISTRADOR: 'administrador',
};

export const TIPOS_ERROR = [
  'SKU_Incorrecto',
  'Precio_Desactualizado',
  'Stock_Insuficiente',
  'Cantidad_Erronea',
];

export const TIPOS_CONDICION_COMERCIAL = ['Credito', 'Descuento', 'Forma_Pago'];
export const OPCIONES_CONDICION_FALLBACK = {
  Credito: [],
  Descuento: [],
  Forma_Pago: [],
};

export const LABELS_TIPO_CONDICION = {
  Credito: 'Crédito',
  Descuento: 'Descuento',
  Forma_Pago: 'Forma de Pago',
};

export const TIPOS_DECISION_COMERCIAL = [
  'Aprobacion_Descuento',
  'Extension_Credito',
  'Sustitucion_Producto',
  'Ajuste_Precio',
];

export const ACCIONES_AUDITORIA = [
  'CREAR',
  'ACTUALIZAR',
  'ELIMINAR',
  'CONSULTA_IA',
  'INICIAR_SESION',
  'CERRAR_SESION',
  'EXPORTAR',
  'ERROR',
];

export const MODULOS_SISTEMA = [
  'Pedidos',
  'Productos',
  'Clientes',
  'Condiciones',
  'Reportes',
  'Indicadores',
  'Agente IA',
  'Auth',
];

export const CONFIG_ACCION_AUDITORIA = {
  CREAR: { label: 'Crear', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  ACTUALIZAR: { label: 'Actualizar', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  ELIMINAR: { label: 'Eliminar', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
  CONSULTA_IA: { label: 'Consulta IA', color: '#7e22ce', bg: '#fdf4ff', border: '#e9d5ff' },
  INICIAR_SESION: { label: 'Inicio de sesión', color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' },
  CERRAR_SESION: { label: 'Cierre de sesión', color: '#475569', bg: '#f8fafc', border: '#e2e8f0' },
  EXPORTAR: { label: 'Exportar', color: '#c2410c', bg: '#fff7ed', border: '#fed7aa' },
  ERROR: { label: 'Error', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
};

export const FORMATOS_REPORTE = ['Excel', 'PDF'];

export const REPORTES_DISPONIBLES = [
  {
    id: 'orders',
    nombre: 'Reporte de Pedidos',
    descripcion: 'Historial consolidado con clientes, montos, estados y observaciones.',
    icono: 'chart-bar',
    colorBg: '#eff6ff',
    colorIcon: '#1d4ed8',
    formatos: ['Excel', 'PDF'],
    endpointExcel: '/reports/orders/excel',
    endpointPdf: '/reports/orders/pdf',
    archivoBase: 'pedidos',
  },
  {
    id: 'inventory',
    nombre: 'Reporte de Inventario',
    descripcion: 'Existencias de almacén, stock mínimo, costos, precios y rotación.',
    icono: 'package',
    colorBg: '#fff7ed',
    colorIcon: '#c2410c',
    formatos: ['Excel', 'PDF'],
    endpointExcel: '/reports/inventory/excel',
    endpointPdf: '/reports/inventory/pdf',
    archivoBase: 'inventario',
  },
  {
    id: 'customers',
    nombre: 'Cartera de Clientes',
    descripcion: 'Listado oficial de clientes con RUC/DNI, dirección, contacto y estado.',
    icono: 'users',
    colorBg: '#fdf4ff',
    colorIcon: '#7e22ce',
    formatos: ['Excel', 'PDF'],
    endpointExcel: '/reports/customers/excel',
    endpointPdf: '/reports/customers/pdf',
    archivoBase: 'clientes',
  },
  {
    id: 'errors',
    nombre: 'Pedidos con Errores',
    descripcion: 'Detalle de incidencias, tipos de error detectados y motivos de devolución.',
    icono: 'alert-triangle',
    colorBg: '#fef2f2',
    colorIcon: '#b91c1c',
    formatos: ['Excel', 'PDF'],
    endpointExcel: '/reports/errors/excel',
    endpointPdf: '/reports/errors/pdf',
    archivoBase: 'pedidos_errores',
  },
  {
    id: 'indicators',
    nombre: 'Indicadores Comerciales',
    descripcion: 'Cálculo consolidado de indicadores comerciales: NSC, NPP y TPD.',
    icono: 'report-analytics',
    colorBg: '#f0fdf4',
    colorIcon: '#15803d',
    formatos: ['Excel', 'PDF'],
    endpointExcel: '/reports/indicators/excel',
    endpointPdf: '/reports/indicators/pdf',
    archivoBase: 'indicadores',
  },
];

export const PREGUNTAS_SUGERIDAS_AGENTE = [
  '¿Cuáles son los productos con más rotación esta semana?',
  '¿Qué clientes compraron hoy?',
  '¿Cuál es mi avance de meta diaria?',
  '¿Qué pedidos están pendientes de confirmar?',
  '¿Cuál es el margen promedio de mis ventas este mes?',
  'Dame un resumen de ventas de EL PRÍNCIPE',
];

export const PERIODOS_GRAFICA_DASHBOARD = [
  { key: 'hoy', label: 'Hoy' },
  { key: 'semana', label: 'Semana' },
  { key: 'mes', label: 'Mes' },
];

export const METAS_COMERCIALES = {
  META_DIARIA_VENTAS: 6000,
};

export const INDICADORES_META = {
  NSC: {
    nombre: 'Número de Solicitudes de Clientes',
    color: '#1E3A8A',
    metaTexto: 'Meta: ≥ 15/día',
    tipo: 'conteo',
    maxEscala: 30,
  },
  NPP: {
    nombre: 'Número de Pedidos Procesados',
    color: '#854f0b',
    metaTexto: 'Meta: ≥ 15/día',
    tipo: 'conteo',
    maxEscala: 30,
  },
  TPD: {
    nombre: 'Tiempo Promedio de Decisión',
    color: '#085041',
    metaTexto: 'Meta: ≤ 240 min',
    tipo: 'tiempo_respuesta',
    maxEscala: 720,
  },
};

export const INDICADORES_DEF = {
  NSC: {
    numero: '01',
    sigla: 'NSC',
    nombre: 'Número de Solicitudes de Clientes',
    descripcion: 'Mide el número de solicitudes de clientes atendidas y auditadas por el agente de IA en el día actual, evaluando si se alcanza la meta mínima diaria establecida.',
    formula: 'NSC = Σ Solicitudes Atendidas',
    variables: [
      { clave: 'SA', nombre: 'Solicitudes día actual', desc: 'Solicitudes atendidas y auditadas por el agente de IA en el día en curso' },
      { clave: 'SP', nombre: 'Solicitudes día anterior', desc: 'Solicitudes atendidas y auditadas por el agente de IA en el día calendario anterior' },
    ],
    umbrales: [
      { nivel: 'bueno', label: 'Bueno', rango: 'NSC ≥ 15', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', min: 15, max: null },
      { nivel: 'regular', label: 'Regular', rango: '8 a 14', color: '#c2410c', bg: '#fff7ed', border: '#fed7aa', min: 8, max: 15 },
      { nivel: 'critico', label: 'Crítico', rango: 'NSC < 8', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca', min: null, max: 8 },
    ],
  },
  NPP: {
    numero: '02',
    sigla: 'NPP',
    nombre: 'Número de Pedidos Procesados',
    descripcion: 'Mide el número de pedidos procesados (aprobados o entregados) y auditados por el agente de IA en el día actual, evaluando si se alcanza la meta mínima diaria establecida.',
    formula: 'NPP = Σ Pedidos Procesados',
    variables: [
      { clave: 'PA', nombre: 'Pedidos día actual', desc: 'Pedidos aprobados o entregados y auditados por el agente de IA en el día en curso' },
      { clave: 'PP', nombre: 'Pedidos día anterior', desc: 'Pedidos aprobados o entregados y auditados por el agente de IA en el día calendario anterior' },
    ],
    umbrales: [
      { nivel: 'bueno', label: 'Bueno', rango: 'NPP ≥ 15', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', min: 15, max: null },
      { nivel: 'regular', label: 'Regular', rango: '8 a 14', color: '#c2410c', bg: '#fff7ed', border: '#fed7aa', min: 8, max: 15 },
      { nivel: 'critico', label: 'Crítico', rango: 'NPP < 8', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca', min: null, max: 8 },
    ],
  },
  TPD: {
    numero: '03',
    sigla: 'TPD',
    nombre: 'Tiempo Promedio de Decisión',
    descripcion: 'Mide el tiempo promedio, en minutos, que transcurre entre la apertura del registro de solicitud de un cliente (apertura del modal) y la aprobación del pedido correspondiente (tras el registro y la auditoría de la IA), evaluando la rapidez del asesor comercial en la toma de decisiones. La espera de la auditoría del agente de IA al guardar (unos segundos) forma parte de este tiempo y debe considerarse al comparar con el grupo de control.',
    formula: 'TPD = Σ(Fecha de aprobación del pedido − Hora de apertura del registro de solicitud) ÷ N',
    variables: [
      { clave: 'FP', nombre: 'Fecha de aprobación del pedido', desc: 'Momento en que el pedido queda marcado como Aprobado, tras el registro y la auditoría de la IA' },
      { clave: 'FS', nombre: 'Hora de apertura del registro de solicitud', desc: 'Momento en que el asesor abre el modal para registrar la solicitud del cliente' },
      { clave: 'N', nombre: 'Número de pedidos', desc: 'Cantidad de pedidos aprobados considerados en el promedio (los del día actual)' },
    ],
    umbrales: [
      { nivel: 'bueno', label: 'Bueno', rango: 'TPD ≤ 240 min', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', min: null, max: 240, maxIncl: true },
      { nivel: 'regular', label: 'Regular', rango: '240 a 720 min', color: '#c2410c', bg: '#fff7ed', border: '#fed7aa', min: 240, max: 720, maxIncl: true },
      { nivel: 'critico', label: 'Crítico', rango: 'TPD > 720 min', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca', min: 720, max: null },
    ],
  },
};