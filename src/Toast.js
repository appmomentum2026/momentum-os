import React, { useEffect } from 'react';

const ICONOS = { pedido: '🛍️', novedad: '⚠️' };

export default function Toast({ notificacion, onClose }) {
  useEffect(() => {
    if (!notificacion) return;
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [notificacion, onClose]);

  if (!notificacion) return null;

  return (
    <div className="nm-toast" role="status">
      <span style={{ fontSize: 20, flexShrink: 0 }}>{ICONOS[notificacion.tipo] || '🔔'}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 700, marginBottom: 2 }}>Nueva notificación</div>
        <div style={{ color: 'var(--text)', fontSize: 13, lineHeight: 1.4 }}>{notificacion.mensaje}</div>
      </div>
      <button type="button" className="nm-toast-cerrar" onClick={onClose} aria-label="Cerrar">
        <i className="ti ti-x" aria-hidden="true"></i>
      </button>
    </div>
  );
}
