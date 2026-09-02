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

export const FORMAS_PAGO = [
  'Contado',
  'Credito 15d',
  'Credito 30d',
];

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

export const TIPOS_CONDICION_COMERCIAL = [
  'Plazo_Credito',
  'Descuento_Volumen',
  'Limite_Credito',
  'Forma_Pago',
];

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
    descripcion: 'Cálculo consolidado de indicadores oficiales: NEPP, PFCC y NTDC.',
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
  NEPP: {
    nombre: 'Número de errores en los productos pedidos',
    color: '#1E3A8A',
    metaTexto: 'Meta: < 0.05',
    tipo: 'ratio',
    maxEscala: 0.15,
  },
  PFCC: {
    nombre: 'Porcentaje de fallas al definir condiciones comerciales',
    color: '#854f0b',
    metaTexto: 'Meta: < 10%',
    tipo: 'porcentaje_falla',
    maxEscala: 30,
  },
  NTDC: {
    nombre: 'Nivel de toma de decisiones comerciales',
    color: '#085041',
    metaTexto: 'Meta: ≥ 75%',
    tipo: 'porcentaje_exito',
    maxEscala: 100,
  },
};

export const INDICADORES_DEF = {
  NEPP: {
    numero: '01',
    sigla: 'NEPP',
    nombre: 'Número de errores en los productos pedidos',
    descripcion: 'Mide la tasa de errores detectados en los productos registrados dentro de los pedidos del periodo.',
    formula: 'NEPP = TEPP ÷ TPP',
    variables: [
      { clave: 'TEPP', nombre: 'Total de errores en productos pedidos', desc: 'Productos con error detectado en el periodo' },
      { clave: 'TPP', nombre: 'Total de productos pedidos', desc: 'Total de productos registrados en pedidos del periodo' },
    ],
    umbrales: [
      { nivel: 'bueno', label: 'Bueno', rango: 'NEPP < 0.05', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', min: null, max: 0.05 },
      { nivel: 'regular', label: 'Regular', rango: '0.05 – 0.10', color: '#c2410c', bg: '#fff7ed', border: '#fed7aa', min: 0.05, max: 0.10 },
      { nivel: 'critico', label: 'Crítico', rango: 'NEPP > 0.10', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca', min: 0.10, max: null },
    ],
  },
  PFCC: {
    numero: '02',
    sigla: 'PFCC',
    nombre: 'Porcentaje de fallas al definir condiciones comerciales',
    descripcion: 'Mide el porcentaje de condiciones comerciales que fueron definidas de forma incorrecta o incompleta respecto al total de condiciones definidas en el periodo.',
    formula: 'PFCC = (TCCF ÷ TCCD) × 100',
    variables: [
      { clave: 'TCCF', nombre: 'Total de condiciones comerciales fallidas', desc: 'Condiciones con error o inconsistencia detectada' },
      { clave: 'TCCD', nombre: 'Total de condiciones comerciales definidas', desc: 'Total de condiciones registradas en el periodo' },
    ],
    umbrales: [
      { nivel: 'bueno', label: 'Bueno', rango: 'PFCC < 10%', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', min: null, max: 10 },
      { nivel: 'regular', label: 'Regular', rango: '10% – 25%', color: '#c2410c', bg: '#fff7ed', border: '#fed7aa', min: 10, max: 25 },
      { nivel: 'critico', label: 'Crítico', rango: 'PFCC > 25%', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca', min: 25, max: null },
    ],
  },
  NTDC: {
    numero: '03',
    sigla: 'NTDC',
    nombre: 'Nivel de toma de decisiones comerciales',
    descripcion: 'Mide la proporción de decisiones comerciales efectivas (correctas y oportunas) respecto al total de decisiones tomadas en el periodo por el asesor comercial.',
    formula: 'NTDC = (TDCE ÷ TDCT) × 100',
    variables: [
      { clave: 'TDCE', nombre: 'Total de decisiones comerciales efectivas', desc: 'Decisiones que derivaron en resultado positivo o correcto' },
      { clave: 'TDCT', nombre: 'Total de decisiones comerciales tomadas', desc: 'Total de decisiones registradas en el periodo' },
    ],
    umbrales: [
      { nivel: 'bueno', label: 'Bueno', rango: 'NTDC ≥ 75%', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', min: 75, max: null },
      { nivel: 'regular', label: 'Regular', rango: '50% – 74%', color: '#c2410c', bg: '#fff7ed', border: '#fed7aa', min: 50, max: 75 },
      { nivel: 'critico', label: 'Crítico', rango: 'NTDC < 50%', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca', min: null, max: 50 },
    ],
  },
};