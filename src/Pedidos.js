import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, doc, getDoc, updateDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

function getQuincena() {
  const hoy = new Date();
  const dia = hoy.getDate();
  const mes = hoy.getMonth();
  const anio = hoy.getFullYear();
  if (dia <= 15) {
    return { inicio: new Date(anio, mes, 1).toISOString().split('T')[0], fin: new Date(anio, mes, 15).toISOString().split('T')[0] };
  } else {
    const ultimoDia = new Date(anio, mes + 1, 0).getDate();
    return { inicio: new Date(anio, mes, 16).toISOString().split('T')[0], fin: new Date(anio, mes, ultimoDia).toISOString().split('T')[0] };
  }
}
const s = {
  wrap: { display: 'block' },
  card: { background: 'var(--bg2)', borderRadius: 12, padding: 16, border: '1px solid var(--border2)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  producto: { color: 'var(--gold)', fontSize: 13, fontWeight: 500 },
  fila: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' },
  filaLabel: { color: 'var(--text-sub)', fontSize: 12 },
  filaValor: { color: 'var(--text)', fontSize: 12 },
  badge: { padding: '3px 10px', borderRadius: 20, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 500 },
  btnRow: { display: 'flex', gap: 8, marginTop: 10 },
  btn: { background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, padding: '7px 14px', fontSize: 12, letterSpacing: 1, cursor: 'pointer' },
  vacio: { color: 'var(--text-dim)', textAlign: 'center', padding: 40, fontSize: 13 },
  toggleVista: { display: 'flex', gap: 4, background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 8, padding: 3 },
  toggleBtn: { background: 'transparent', border: 'none', borderRadius: 6, color: 'var(--text-sub)', padding: '6px 10px', cursor: 'pointer', fontSize: 16 },
  toggleBtnActivo: { background: 'var(--bg3)', color: 'var(--gold)' },
  // Aprobar / Rechazar
  badgeAprobado: { background: 'rgba(76,175,125,0.15)', color: 'var(--green)', padding: '3px 10px', borderRadius: 20, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 },
  badgeRechazado: { background: 'rgba(192,97,74,0.15)', color: 'var(--red)', padding: '3px 10px', borderRadius: 20, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 },
  btnAprobar: { background: 'var(--bg)', border: 'none', borderRadius: 8, boxShadow: 'var(--shadow-out)', color: 'var(--green)', padding: '7px 14px', fontSize: 12, letterSpacing: 1, cursor: 'pointer', fontWeight: 600 },
  btnRechazar: { background: 'var(--bg)', border: 'none', borderRadius: 8, boxShadow: 'var(--shadow-out)', color: 'var(--red)', padding: '7px 14px', fontSize: 12, letterSpacing: 1, cursor: 'pointer', fontWeight: 600 },
  motivoBox: { marginTop: 10, background: 'var(--bg)', borderRadius: 10, padding: 12, boxShadow: 'var(--shadow-in)' },
  motivoInput: { width: '100%', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--text)', padding: '8px 10px', fontSize: 12, outline: 'none', marginBottom: 10, boxSizing: 'border-box' },
  motivoTexto: { color: 'var(--text-sub)', fontSize: 11, marginTop: 6 },
  // Tabs jefe
  tabsJefe: { display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--border)' },
  tabJefeBtn: { background: 'transparent', border: 'none', padding: '10px 18px', fontSize: 12, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-sub)', cursor: 'pointer', borderBottom: '2px solid transparent', marginBottom: -1, transition: 'color 0.15s, border-color 0.15s' },
  tabJefeBtnActivo: { color: 'var(--gold)', borderBottom: '2px solid var(--gold)' },
  // Historial colapsable (monitor)
  historialToggle: { background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 10, color: 'var(--text-sub)', padding: '10px 14px', fontSize: 12, cursor: 'pointer', width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
};

const ESTADOS_STYLE = {
  pendiente: { background: 'rgba(201,146,74,0.15)', color: '#C9924A' },
  aprobado: { background: 'rgba(76,175,125,0.15)', color: 'var(--green)' },
  rechazado: { background: 'rgba(192,97,74,0.15)', color: 'var(--red)' },
  entregado: { background: 'rgba(76,175,125,0.15)', color: 'var(--green)' },
  cancelado: { background: 'rgba(192,97,74,0.15)', color: 'var(--red)' }
};

// 'entregado'/'cancelado' son estados legados (antes de existir aprobado/rechazado) que se siguen mostrando igual
const esAprobado = (estado) => estado === 'aprobado' || estado === 'entregado';
const esRechazado = (estado) => estado === 'rechazado' || estado === 'cancelado';
const esResuelto = (estado) => esAprobado(estado) || esRechazado(estado);

export default function Pedidos({ rol, nombreModelo, nombreAprobador }) {
  const [pedidos, setPedidos] = useState([]);
  const [vistaGrid, setVistaGrid] = useState(true);
  const [tabJefe, setTabJefe] = useState('pendientes');
  const [historialAbierto, setHistorialAbierto] = useState(false);
  const [rechazando, setRechazando] = useState(null);
  const [motivoInput, setMotivoInput] = useState({});

  useEffect(() => {
    const q = query(collection(db, 'pedidos'), orderBy('fecha', 'desc'));
    const unsub = onSnapshot(q, snap => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      setPedidos(data);
    });
    return unsub;
  }, []);

  const aprobarPedido = async (pedido) => {
    await updateDoc(doc(db, 'pedidos', pedido.id), {
      estado: 'aprobado',
      aprobadoPor: nombreAprobador || 'jefe',
      fechaAprobacion: new Date().toISOString()
    });
    if (pedido.productoId) {
      const prodRef = doc(db, 'inventario', pedido.productoId);
      const prodSnap = await getDoc(prodRef);
      if (prodSnap.exists()) {
        const stockActual = prodSnap.data().stock || 0;
        await updateDoc(prodRef, { stock: Math.max(0, stockActual - (pedido.cantidad || 1)) });
      }
    }
  };

  const confirmarRechazo = async (pedido) => {
    await updateDoc(doc(db, 'pedidos', pedido.id), {
      estado: 'rechazado',
      motivoRechazo: motivoInput[pedido.id] || '',
      aprobadoPor: nombreAprobador || 'jefe',
      fechaAprobacion: new Date().toISOString()
    });
    setRechazando(null);
    setMotivoInput(prev => ({ ...prev, [pedido.id]: '' }));
  };

  const quincena = getQuincena();
  const pedidosQuincena = pedidos.filter(p => {
    const fechaPedido = p.fecha?.split('T')[0] || '';
    return fechaPedido >= quincena.inicio && fechaPedido <= quincena.fin;
  });

  const esReciente = (p) => {
    const t = new Date(p.fechaAprobacion || p.fecha).getTime();
    if (isNaN(t)) return true;
    return Date.now() - t < 24 * 60 * 60 * 1000;
  };

  const renderBadge = (p) => {
    if (esAprobado(p.estado)) return <span style={s.badgeAprobado}>Aprobado ✓</span>;
    if (esRechazado(p.estado)) return <span style={s.badgeRechazado}>Rechazado ✕</span>;
    return <span style={{ ...s.badge, ...ESTADOS_STYLE.pendiente }}>{p.estado}</span>;
  };

  const renderCardPedido = (p, permitirAccion) => (
    <div key={p.id} style={s.card}>
      <div style={s.cardHeader}>
        <div style={s.producto}>{p.producto}</div>
        {renderBadge(p)}
      </div>
      <div style={s.fila}><div style={s.filaLabel}>Modelo</div><div style={s.filaValor}>{p.modelo}</div></div>
      <div style={s.fila}><div style={s.filaLabel}>Precio</div><div style={s.filaValor}>${p.precio?.toLocaleString()}</div></div>
      {p.cuotas > 1 && (
        <div style={s.fila}><div style={s.filaLabel}>Pago en cuotas</div><div style={s.filaValor}>2 cuotas de ${Math.ceil(p.precio / 2).toLocaleString()}</div></div>
      )}
      <div style={{ ...s.fila, borderBottom: 'none' }}><div style={s.filaLabel}>Hora</div><div style={s.filaValor}>{p.hora}</div></div>

      {esRechazado(p.estado) && p.motivoRechazo && (
        <div style={s.motivoTexto}>Motivo: {p.motivoRechazo}</div>
      )}

      {permitirAccion && p.estado === 'pendiente' && (
        <>
          <div style={s.btnRow}>
            <button style={s.btnAprobar} onClick={() => aprobarPedido(p)}>Aprobar</button>
            <button style={s.btnRechazar} onClick={() => setRechazando(rechazando === p.id ? null : p.id)}>Rechazar</button>
          </div>
          {rechazando === p.id && (
            <div style={s.motivoBox}>
              <input style={s.motivoInput} placeholder="Motivo del rechazo..." value={motivoInput[p.id] || ''} onChange={e => setMotivoInput(prev => ({ ...prev, [p.id]: e.target.value }))} />
              <div style={s.btnRow}>
                <button style={s.btnRechazar} onClick={() => confirmarRechazo(p)}>Confirmar rechazo</button>
                <button style={s.btn} onClick={() => setRechazando(null)}>Cancelar</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  const gridWrap = (items, extraStyle = {}) => (
    <div className={vistaGrid ? 'nm-grid-cards' : ''} style={{ ...(!vistaGrid ? { display: 'flex', flexDirection: 'column', gap: 10 } : {}), ...extraStyle }}>
      {items}
    </div>
  );

  // ── VISTA JEFE ──────────────────────────────────────────────────────────
  if (rol === 'jefe') {
    const pendientes = pedidosQuincena.filter(p => p.estado === 'pendiente');
    const historial = pedidosQuincena.filter(p => esResuelto(p.estado));
    const listado = tabJefe === 'pendientes' ? pendientes : historial;

    return (
      <div style={s.wrap}>
        <div style={s.tabsJefe}>
          <button type="button" style={{ ...s.tabJefeBtn, ...(tabJefe === 'pendientes' ? s.tabJefeBtnActivo : {}) }} onClick={() => setTabJefe('pendientes')}>
            Pendientes{pendientes.length > 0 ? ` (${pendientes.length})` : ''}
          </button>
          <button type="button" style={{ ...s.tabJefeBtn, ...(tabJefe === 'historial' ? s.tabJefeBtnActivo : {}) }} onClick={() => setTabJefe('historial')}>
            Historial
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
          <div style={s.toggleVista}>
            <button style={{ ...s.toggleBtn, ...(vistaGrid ? s.toggleBtnActivo : {}) }} onClick={() => setVistaGrid(true)}>⊞</button>
            <button style={{ ...s.toggleBtn, ...(!vistaGrid ? s.toggleBtnActivo : {}) }} onClick={() => setVistaGrid(false)}>☰</button>
          </div>
        </div>

        {listado.length === 0 && <p style={s.vacio}>{tabJefe === 'pendientes' ? 'No hay pedidos pendientes' : 'No hay historial de pedidos'}</p>}

        {gridWrap(listado.map(p => renderCardPedido(p, true)))}
      </div>
    );
  }

  // ── VISTA MONITOR ───────────────────────────────────────────────────────
  if (rol === 'monitor') {
    const principal = pedidosQuincena.filter(p => p.estado === 'pendiente' || (esResuelto(p.estado) && esReciente(p)));
    const historial = pedidosQuincena.filter(p => esResuelto(p.estado) && !esReciente(p));

    return (
      <div style={s.wrap}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
          <div style={s.toggleVista}>
            <button style={{ ...s.toggleBtn, ...(vistaGrid ? s.toggleBtnActivo : {}) }} onClick={() => setVistaGrid(true)}>⊞</button>
            <button style={{ ...s.toggleBtn, ...(!vistaGrid ? s.toggleBtnActivo : {}) }} onClick={() => setVistaGrid(false)}>☰</button>
          </div>
        </div>

        {principal.length === 0 && <p style={s.vacio}>No hay pedidos</p>}
        {gridWrap(principal.map(p => renderCardPedido(p, false)))}

        {historial.length > 0 && (
          <>
            <button style={s.historialToggle} onClick={() => setHistorialAbierto(v => !v)}>
              <span>Historial ({historial.length})</span>
              <span>{historialAbierto ? '↑ Ocultar' : '↓ Ver'}</span>
            </button>
            {historialAbierto && gridWrap(historial.map(p => renderCardPedido(p, false)), { marginTop: 10 })}
          </>
        )}
      </div>
    );
  }

  // ── VISTA MODELO (tienda) ───────────────────────────────────────────────
  const misPedidos = nombreModelo ? pedidosQuincena.filter(p => p.modelo === nombreModelo) : pedidosQuincena;
  return (
    <div style={s.wrap}>
      {misPedidos.length === 0 && <p style={s.vacio}>Aún no has hecho pedidos</p>}
      <div className="nm-grid-cards">
        {misPedidos.map(p => renderCardPedido(p, false))}
      </div>
    </div>
  );
}
