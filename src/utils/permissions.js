const CAPACIDADES_POR_ROL = {
  administrador: ['*'],
  asesor_comercial: [
    'dashboard.ver',
    'agente.usar',
    'productos.ver',
    'clientes.ver',
    'clientes.escribir',
    'solicitudes.ver',
    'solicitudes.escribir',
    'pedidos.ver',
    'pedidos.escribir',
    'condiciones.ver',
    'condiciones.escribir',
    'indicadores.ver',
    'reportes.ver',
    'perfil.ver',
    'configuracion.ver',
  ],
};

export function puede(rol, capacidad) {
  const caps = CAPACIDADES_POR_ROL[rol] || [];
  return caps.includes('*') || caps.includes(capacidad);
}

export function esAdministrador(rol) {
  return rol === 'administrador';
}
