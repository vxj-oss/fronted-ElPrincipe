import { useState, useEffect, useMemo, useRef, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from './ProductSearchSelect.module.css';

function normalizar(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

const nombreDe = (c) => c.nombre || c.razon_social || '';
const documentoDe = (c) => c.ruc || c.ruc_dni || c.documento || '';

export default function ClienteSearchSelect({
  clientes,
  clienteId,
  nombreExtra = '',
  onChange,
  disabled = false,
  id,
  placeholder = 'Buscar cliente por nombre o documento…',
  inputClassName = '',
  style,
}) {
  const seleccionado = useMemo(
    () => clientes.find((c) => String(c.id) === String(clienteId)) || null,
    [clientes, clienteId]
  );
  const textoActual = seleccionado ? nombreDe(seleccionado) : clienteId ? nombreExtra : '';

  const [texto, setTexto] = useState(textoActual);
  const [editando, setEditando] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(0);
  const [rect, setRect] = useState(null);

  const inputRef = useRef(null);
  const listaRef = useRef(null);

  useEffect(() => {
    if (!editando) setTexto(textoActual);
  }, [textoActual, editando]);

  const filtrados = useMemo(() => {
    const terminos = normalizar(editando ? texto : '')
      .split(/\s+/)
      .filter(Boolean);
    if (terminos.length === 0) return clientes;
    return clientes.filter((c) => {
      const base = normalizar(`${nombreDe(c)} ${documentoDe(c)}`);
      return terminos.every((t) => base.includes(t));
    });
  }, [clientes, texto, editando]);

  const actualizarPosicion = useCallback(() => {
    if (!inputRef.current) return;
    const r = inputRef.current.getBoundingClientRect();
    setRect({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, 240), bottom: r.top });
  }, []);

  useLayoutEffect(() => {
    if (abierto) actualizarPosicion();
  }, [abierto, actualizarPosicion]);

  useEffect(() => {
    if (!abierto) return undefined;
    const alDesplazar = (e) => {
      if (listaRef.current && listaRef.current.contains(e.target)) return;
      actualizarPosicion();
    };
    window.addEventListener('scroll', alDesplazar, true);
    window.addEventListener('resize', actualizarPosicion);
    return () => {
      window.removeEventListener('scroll', alDesplazar, true);
      window.removeEventListener('resize', actualizarPosicion);
    };
  }, [abierto, actualizarPosicion]);

  useEffect(() => {
    if (!abierto || !listaRef.current) return;
    const el = listaRef.current.querySelector('[data-activo="true"]');
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [activo, abierto]);

  const cerrar = () => {
    setAbierto(false);
    setEditando(false);
  };

  const elegir = (cliente) => {
    onChange(String(cliente.id));
    setTexto(nombreDe(cliente));
    cerrar();
  };

  const confirmarTexto = () => {
    if (editando) {
      if (!texto.trim()) onChange('');
      else setTexto(textoActual);
    }
    cerrar();
  };

  const alTeclear = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!abierto) setAbierto(true);
      setActivo((i) => Math.min(i + 1, Math.max(filtrados.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActivo((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (abierto) {
        e.preventDefault();
        if (filtrados[activo]) elegir(filtrados[activo]);
      }
    } else if (e.key === 'Escape') {
      if (abierto) {
        e.stopPropagation();
        setTexto(textoActual);
        cerrar();
      }
    }
  };

  const abrirLista = () => {
    if (disabled) return;
    setAbierto(true);
    setActivo(0);
  };

  const listaVisible = abierto && rect;
  const abreArriba = listaVisible && window.innerHeight - rect.top < 240 && rect.bottom > 240;

  return (
    <>
      <input
        ref={inputRef}
        id={id}
        type="text"
        role="combobox"
        aria-expanded={abierto}
        aria-autocomplete="list"
        autoComplete="off"
        disabled={disabled}
        value={texto}
        placeholder={placeholder}
        className={inputClassName}
        style={style}
        onFocus={(e) => {
          e.target.select();
          abrirLista();
        }}
        onClick={abrirLista}
        onChange={(e) => {
          setTexto(e.target.value);
          setEditando(true);
          setActivo(0);
          if (!abierto) setAbierto(true);
        }}
        onKeyDown={alTeclear}
        onBlur={confirmarTexto}
      />
      {listaVisible &&
        createPortal(
          <ul
            ref={listaRef}
            role="listbox"
            className={styles.lista}
            style={
              abreArriba
                ? { bottom: window.innerHeight - rect.bottom + 4, left: rect.left, width: rect.width }
                : { top: rect.top, left: rect.left, width: rect.width }
            }
            onMouseDown={(e) => e.preventDefault()}
          >
            {filtrados.length === 0 ? (
              <li className={styles.vacio}>No se encontró ningún cliente con ese nombre.</li>
            ) : (
              filtrados.map((c, i) => (
                <li
                  key={c.id}
                  role="option"
                  aria-selected={String(c.id) === String(clienteId)}
                  data-activo={i === activo}
                  className={`${styles.opcion} ${i === activo ? styles.opcionActiva : ''}`}
                  onMouseEnter={() => setActivo(i)}
                  onClick={() => elegir(c)}
                >
                  <span className={styles.nombre}>{nombreDe(c)}</span>
                  <span className={styles.stock}>{documentoDe(c)}</span>
                </li>
              ))
            )}
          </ul>,
          document.body
        )}
    </>
  );
}
