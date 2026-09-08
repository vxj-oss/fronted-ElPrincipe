import React from 'react';
import {
  Plus,
  Search,
  Pencil,
  AlertCircle,
  CheckCircle,
  FileText,
  X,
  Tag,
  ShieldCheck,
} from 'lucide-react';
import { useCommercialTerms } from './useCommercialTerms';
import { EMPRESA } from '../../constants/appConstants';
import { formatearFecha } from './commercialTermsService';
import { usePagination } from '../../hooks/usePagination';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import Pagination from '../../components/ui/Pagination';
import styles from './commercialTerms.module.css';

const OPCIONES_PLAZO = [
  { valor: '0', label: 'Contado (0 días)' },
  { valor: '15', label: 'Crédito 15d (15 días)' },
  { valor: '30', label: 'Crédito 30d (30 días)' },
];

const CONFIG_TIPO = {
  Plazo_Credito: { clase: styles.pillVolumen, label: 'Plazo Crédito' },
  Descuento_Volumen: { clase: styles.pillPromocional, label: 'Desc. Volumen' },
  Limite_Credito: { clase: styles.pillInstitucional, label: 'Límite Crédito' },
  Forma_Pago: { clase: styles.pillEspecial, label: 'Forma de Pago' },
};

function PillTipo({ tipo }) {
  const cfg = CONFIG_TIPO[tipo] ?? { clase: styles.pillVolumen, label: tipo };
  return <span className={`${styles.pill} ${cfg.clase}`}>{cfg.label}</span>;
}

function KPICard({ label, value, note, color }) {
  return (
    <div className={styles.kpiCard}>
      <p className={styles.kpiLabel}>{label}</p>
      <p className={styles.kpiValue} style={color ? { color } : {}}>{value}</p>
      <p className={styles.kpiNote}>{note}</p>
    </div>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  const esError = toast.tipo === 'error';
  return (
    <div
      className={`${styles.toast} ${esError ? styles.toastError : styles.toastSuccess}`}
      role="status"
    >
      {esError ? <AlertCircle size={14} aria-hidden="true" /> : <CheckCircle size={14} aria-hidden="true" />}
      {toast.texto}
    </div>
  );
}

function DetallePanel({ condicion, onCerrar, onEditar }) {
  if (!condicion) return null;

  return (
    <>
    <div className="rt-backdrop" onClick={onCerrar} aria-hidden="true" />
    <aside className={`${styles.detallePanel} rt-drawer`} aria-label="Detalle de condición comercial">
      <div className={styles.detallePanelHeader}>
        <h2 className={styles.detalleTitulo}>Política Comercial</h2>
        <button onClick={onCerrar} className={styles.btnIcono} aria-label="Cerrar">
          <X size={14} aria-hidden="true" />
        </button>
      </div>

      <div className={styles.detalleTop}>
        <div className={styles.detalleIconWrap}>
          <Tag size={18} style={{ color: '#1E3A8A' }} aria-hidden="true" />
        </div>
        <div>
          <p className={styles.detalleNombre}>{(CONFIG_TIPO[condicion.tipo] ?? { label: condicion.tipo.replace('_', ' ') }).label}</p>
          <p className={styles.detalleCliente}>{condicion.cliente}</p>
        </div>
      </div>

      <div className={styles.detalleBadges}>
        <PillTipo tipo={condicion.tipo} />
        <span className={`${styles.pill} ${styles.pillActivo}`}>
          Política Activa
        </span>
      </div>

      <dl className={styles.detalleGrid}>
        <div className={styles.detalleItem}>
          <dt>Descuento pactado</dt>
          <dd style={{ color: condicion.descuento > 0 ? '#15803d' : '#94a3b8', fontWeight: 600, fontSize: '1.25rem' }}>
            {condicion.descuento > 0 ? `${condicion.descuento}%` : '0.00%'}
          </dd>
        </div>
        <div className={styles.detalleItem}>
          <dt>Plazo pactado</dt>
          <dd>{condicion.diasPlazo > 0 ? `${condicion.diasPlazo} días` : 'Contado'}</dd>
        </div>
        <div className={styles.detalleItem}>
          <dt>Límite de crédito</dt>
          <dd>{condicion.limiteCredito > 0 ? `${EMPRESA.MONEDA_SIMBOLO} ${condicion.limiteCredito.toLocaleString('es-PE', { minimumFractionDigits: 2 })}` : 'No asignado'}</dd>
        </div>
        <div className={styles.detalleItem}>
          <dt>Fecha de pacto</dt>
          <dd>{formatearFecha(condicion.fechaRegistro)}</dd>
        </div>

        <div className={`${styles.detalleItem} ${styles.detalleItemFull}`} style={{
          background: '#f0fdf4',
          padding: '12px',
          borderRadius: '6px',
          border: '1px solid #bbf7d0'
        }}>
          <dt style={{
            color: '#15803d',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 600,
            fontSize: '12px'
          }}>
            <ShieldCheck size={15} />
            <span>Condición comercial autorizada</span>
          </dt>
          <dd style={{ color: '#166534', marginTop: '6px', fontSize: '12px', lineHeight: '1.4' }}>
            Los pedidos emitidos para este cliente serán auditados automáticamente contra este límite y plazo acordado.
          </dd>
        </div>
      </dl>

      <div className={styles.detallePanelFooter}>
        <button
          onClick={() => onEditar(condicion)}
          className={styles.btnPrimary}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <Pencil size={13} aria-hidden="true" /> Modificar política
        </button>
      </div>
    </aside>
    </>
  );
}

function CondicionModal({
  abierto,
  editandoId,
  form,
  formErrors,
  guardando,
  preview,
  clientes,
  tiposCondicion,
  onClose,
  onChange,
  onGuardar,
}) {
  if (!abierto) return null;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={editandoId ? 'Editar condición' : 'Nueva condición comercial'}
    >
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {editandoId ? 'Editar política comercial' : 'Pactar condición para Cliente'}
          </h2>
          <button onClick={onClose} className={styles.modalClose} aria-label="Cerrar">×</button>
        </div>

        <div className={styles.modalBody}>
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label htmlFor="f-cliente" className={styles.fieldLabel}>Cliente</label>
            <select
              id="f-cliente"
              name="cliente_id"
              value={form.cliente_id}
              onChange={onChange}
              className={`${styles.fieldInput} ${formErrors.cliente_id ? styles.fieldInputError : ''}`}
            >
              <option value="">Seleccionar cliente...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre || c.razon_social} {c.ruc ? `(${c.ruc})` : ''}
                </option>
              ))}
            </select>
            {formErrors.cliente_id && <p className={styles.fieldError} role="alert">{formErrors.cliente_id}</p>}
          </div>

          <div className={styles.field}>
            <label htmlFor="f-tipo" className={styles.fieldLabel}>Tipo de condición</label>
            <select
              id="f-tipo"
              name="tipo"
              value={form.tipo}
              onChange={onChange}
              className={`${styles.fieldInput} ${formErrors.tipo ? styles.fieldInputError : ''}`}
            >
              {tiposCondicion.map((t) => (
                <option key={t} value={t}>{t.replace('_', ' ')}</option>
              ))}
            </select>
            {formErrors.tipo && <p className={styles.fieldError} role="alert">{formErrors.tipo}</p>}
          </div>

          <div className={styles.field}>
            <label htmlFor="f-dias" className={styles.fieldLabel}>Días de plazo pactados</label>
            <select
              id="f-dias"
              name="diasPlazo"
              value={form.diasPlazo}
              onChange={onChange}
              className={`${styles.fieldInput} ${formErrors.diasPlazo ? styles.fieldInputError : ''}`}
            >
              {OPCIONES_PLAZO.map((op) => (
                <option key={op.valor} value={op.valor}>{op.label}</option>
              ))}
            </select>
            {formErrors.diasPlazo && <p className={styles.fieldError} role="alert">{formErrors.diasPlazo}</p>}
          </div>

          <div className={styles.field}>
            <label htmlFor="f-descuento" className={styles.fieldLabel}>Porcentaje descuento (%)</label>
            <input
              id="f-descuento"
              name="descuento"
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={form.descuento}
              onChange={onChange}
              className={`${styles.fieldInput} ${formErrors.descuento ? styles.fieldInputError : ''}`}
            />
            {formErrors.descuento && <p className={styles.fieldError} role="alert">{formErrors.descuento}</p>}
          </div>

          <div className={styles.field}>
            <label htmlFor="f-limite" className={styles.fieldLabel}>Límite crédito ({EMPRESA.MONEDA_SIMBOLO})</label>
            <input
              id="f-limite"
              name="limiteCredito"
              type="number"
              min="0"
              value={form.limiteCredito}
              onChange={onChange}
              className={styles.fieldInput}
            />
          </div>

          <div className={`${styles.field} ${styles.fieldFull}`}>
            <div className={styles.previewBox}>
              <p className={styles.previewTitulo}>Resumen de la política acordada</p>
              <div className={styles.previewFila}>
                <span>Descuento autorizado</span>
                <span className={styles.previewVal}>{preview.descuento}%</span>
              </div>
              <div className={styles.previewFila}>
                <span>Plazo de crédito</span>
                <span className={styles.previewVal}>{preview.diasPlazo > 0 ? `${preview.diasPlazo} días` : 'Contado'}</span>
              </div>
              <div className={styles.previewFila}>
                <span>Límite de crédito asignado</span>
                <span className={styles.previewVal}>{EMPRESA.MONEDA_SIMBOLO} {preview.limiteCredito.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.btnSecondary}>Cancelar</button>
          <button onClick={onGuardar} disabled={guardando} className={styles.btnPrimary}>
            {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Pactar condición'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CommercialTermsPage() {
  const {
    condicionesFiltradas,
    kpis,
    preview,
    clientes,
    cargando,
    guardando,
    error,
    toastMsg,
    busqueda,
    filtroTipo,
    setBusqueda,
    setFiltroTipo,
    modalAbierto,
    editandoId,
    form,
    formErrors,
    condicionDetalle,
    TIPOS_CONDICION,
    abrirCrear,
    abrirEditar,
    cerrarModal,
    handleFormChange,
    handleGuardar,
    verDetalle,
    cerrarDetalle,
  } = useCommercialTerms();

  const esMovilVertical = useMediaQuery('(max-width: 768px)');

  const {
    itemsPagina: condicionesPagina,
    pagina,
    totalPaginas,
    totalItems,
    porPagina,
    irAPagina,
    paginaAnterior,
    paginaSiguiente,
  } = usePagination(condicionesFiltradas, esMovilVertical ? 2 : 7);

  if (cargando) {
    return (
      <div className={styles.estadoCentro}>
        <div className={styles.spinner} aria-label="Cargando condiciones..." />
        <p className={styles.estadoTexto}>Cargando políticas comerciales...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.estadoCentro}>
        <AlertCircle size={32} className={styles.errorIcon} aria-hidden="true" />
        <p className={styles.estadoTexto}>{error}</p>
      </div>
    );
  }

  return (
    <div className={`${styles.page} ${condicionDetalle ? styles.pageConDetalle : ''}`}>
      <Toast toast={toastMsg} />

      <div className={styles.mainArea}>
        <header className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Condiciones Comerciales</h1>
            <p className={styles.pageSub}>Catálogo de plazos, descuentos y límites autorizados por cliente — {EMPRESA.NOMBRE}</p>
          </div>
          <button onClick={abrirCrear} className={styles.btnPrimary}>
            <Plus size={15} aria-hidden="true" /> Nueva condición
          </button>
        </header>

        <section className={styles.kpiGrid} aria-label="Resumen de condiciones">
          <KPICard label="Total condiciones" value={kpis.total} note="políticas vigentes" />
          <KPICard label="Con crédito" value={kpis.conCredito} note="15 o 30 días" color="#1E3A8A" />
          <KPICard label="A contado" value={kpis.aContado} note="estricto 0 días" color="#15803d" />
          <KPICard label="Descuento máximo" value={`${kpis.maxDesc}%`} note="en catálogo" color="#854f0b" />
        </section>

        <div className={styles.toolbar} role="search">
          <div className={styles.searchWrap}>
            <Search size={14} className={styles.searchIcon} aria-hidden="true" />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por cliente o tipo..."
              className={styles.searchInput}
              aria-label="Buscar condiciones"
            />
          </div>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className={styles.filterSelect}
            aria-label="Filtrar por tipo"
          >
            <option value="">Todos los tipos</option>
            {TIPOS_CONDICION.map((t) => (
              <option key={t} value={t}>{t.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        <section className={`${styles.tableCard} rt-flat`} aria-label="Lista de condiciones comerciales">
          {condicionesFiltradas.length === 0 ? (
            <div className={styles.emptyState}>
              <FileText size={36} className={styles.emptyIcon} aria-hidden="true" />
              <p className={styles.emptyTitle}>Sin condiciones registradas</p>
              <p className={styles.emptySub}>No se encontraron condiciones comerciales bajo los criterios actuales.</p>
              <button onClick={abrirCrear} className={styles.btnPrimary}>
                <Plus size={14} aria-hidden="true" /> Registrar primera condición
              </button>
            </div>
          ) : (
            <table className={`${styles.table} responsive-table`}>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Tipo de Condición</th>
                  <th>Plazo Pactado</th>
                  <th>Descuento</th>
                  <th>Límite Crédito</th>
                  <th>Fecha de Registro</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {condicionesPagina.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => verDetalle(c)}
                    data-rownav=""
                    className={condicionDetalle?.id === c.id ? styles.rowActiva : ''}
                    style={{ cursor: 'pointer' }}
                  >
                    <td data-label="Cliente" data-primary>
                      <span className={styles.condNombre}>{c.cliente}</span>
                    </td>
                    <td data-label="Tipo de Condición"><PillTipo tipo={c.tipo} /></td>
                    <td data-label="Plazo Pactado">{c.plazo}</td>
                    <td data-label="Descuento" style={{ fontWeight: 600, color: c.descuento > 0 ? '#15803d' : '#94a3b8' }}>
                      {c.descuento > 0 ? `${c.descuento}%` : '0%'}
                    </td>
                    <td data-label="Límite Crédito" className={styles.tdSecundario}>
                      {c.limiteCredito > 0 ? `${EMPRESA.MONEDA_SIMBOLO} ${c.limiteCredito.toLocaleString('es-PE', { minimumFractionDigits: 2 })}` : '—'}
                    </td>
                    <td data-label="Fecha de Registro" className={styles.tdSecundario}>{formatearFecha(c.fechaRegistro)}</td>
                    <td data-label="Acciones" onClick={(e) => e.stopPropagation()}>
                      <div className={styles.acciones}>
                        <button
                          onClick={() => abrirEditar(c)}
                          className={styles.btnIcono}
                          aria-label={`Editar condición de ${c.cliente}`}
                          title="Editar"
                        >
                          <Pencil size={13} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <Pagination
            pagina={pagina}
            totalPaginas={totalPaginas}
            totalItems={totalItems}
            porPagina={porPagina}
            onIrA={irAPagina}
            onAnterior={paginaAnterior}
            onSiguiente={paginaSiguiente}
            etiqueta="condiciones"
          />
        </section>
      </div>

      <DetallePanel
        condicion={condicionDetalle}
        onCerrar={cerrarDetalle}
        onEditar={abrirEditar}
      />

      <CondicionModal
        abierto={modalAbierto}
        editandoId={editandoId}
        form={form}
        formErrors={formErrors}
        guardando={guardando}
        preview={preview}
        clientes={clientes}
        tiposCondicion={TIPOS_CONDICION}
        onClose={cerrarModal}
        onChange={handleFormChange}
        onGuardar={handleGuardar}
      />
    </div>
  );
}