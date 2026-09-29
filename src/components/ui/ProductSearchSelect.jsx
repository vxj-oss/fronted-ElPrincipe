import { useState, useEffect, useMemo, useRef, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from './ProductSearchSelect.module.css';

function normalizar(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export default function ProductSearchSelect({
  productos,
  productoId,
  nombre,
  onChange,
  placeholder = 'Buscar producto por nombre...',
  inputClassName = '',
}) {
  const seleccionado = useMemo(
    () => productos.find((p) => p.id === productoId) || null,
    [productos, productoId]
  );
  const textoActual = seleccionado ? seleccionado.nombre : nombre || '';

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
    if (terminos.length === 0) return productos;
    return productos.filter((p) => {
      const nombreNorm = normalizar(p.nombre);
      return terminos.every((t) => nombreNorm.includes(t));
    });
  }, [productos, texto, editando]);

  const actualizarPosicion = useCallback(() => {
    if (!inputRef.current) return;
    const r = inputRef.current.getBoundingClientRect();
    setRect({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, 280), bottom: r.top });
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

  const elegir = (producto) => {
    onChange(String(producto.id));
    setTexto(producto.nombre);
    cerrar();
  };

  const confirmarTexto = () => {
    const limpio = texto.trim();
    if (!editando) {
      cerrar();
      return;
    }
    if (!limpio) {
      onChange('');
      cerrar();
      return;
    }
    const exacto = productos.find((p) => normalizar(p.nombre) === normalizar(limpio));
    if (exacto) {
      onChange(String(exacto.id));
      setTexto(exacto.nombre);
    } else {
      onChange(limpio);
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
        if (editando && filtrados[activo]) elegir(filtrados[activo]);
        else confirmarTexto();
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
    setAbierto(true);
    setActivo(0);
  };

  const listaVisible = abierto && rect;
  const abreArriba = listaVisible && window.innerHeight - rect.top < 240 && rect.bottom > 240;

  return (
    <>
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={abierto}
        aria-autocomplete="list"
        autoComplete="off"
        value={texto}
        placeholder={placeholder}
        className={inputClassName}
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
              <li className={styles.vacio}>
                Sin coincidencias. Se registrará como producto escrito a mano.
              </li>
            ) : (
              filtrados.map((p, i) => (
                <li
                  key={p.id}
                  role="option"
                  aria-selected={p.id === productoId}
                  data-activo={i === activo}
                  className={`${styles.opcion} ${i === activo ? styles.opcionActiva : ''}`}
                  onMouseEnter={() => setActivo(i)}
                  onClick={() => elegir(p)}
                >
                  <span className={styles.nombre}>{p.nombre}</span>
                  <span className={styles.stock}>Stock: {p.stock ?? 0}</span>
                </li>
              ))
            )}
          </ul>,
          document.body
        )}
    </>
  );
}
