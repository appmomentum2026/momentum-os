import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, doc, getDoc, updateDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { crearNotificacion } from './Notificaciones';

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

// Id de quincena en formato YYYY-MM-Q1/Q2, usado para rastrear cuotas de pedidos
function quincenaIdActual() {
  const hoy = new Date();
  const anioMes = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  return hoy.getDate() <= 15 ? `${anioMes}-Q1` : `${anioMes}-Q2`;
}
function quincenaIdANumero(id) {
  const [anio, mes, q] = id.split('-');
  return parseInt(anio) * 24 + (parseInt(mes) - 1) * 2 + (q === 'Q1' ? 0 : 1);
}
// Cuantas cuotas van pagadas de un pedido segun cuantas quincenas pasaron desde que se hizo
function estadoCuotas(pedido) {
  const total = pedido.cuotasTotales || pedido.cuotas || 1;
  if (!pedido.quincenaInicio) return { cuotaActual: total, total, pagado: false };
  const quincenasTranscurridas = quincenaIdANumero(quincenaIdActual()) - quincenaIdANumero(pedido.quincenaInicio) + 1;
  return {
    cuotaActual: Math.min(total, Math.max(1, quincenasTranscurridas)),
    total,
    pagado: quincenasTranscurridas > total
  };
}

const s = {
  wrap: { display: 'block' },
  card: {},
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  producto: { color: 'var(--gold)', fontSize: 13, fontWeight: 500 },
  fila: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' },
  filaLabel: { color: 'var(--text-sub)', fontSize: 12 },
  filaValor: { color: 'var(--text)', fontSize: 12 },
  btnRow: { display: 'flex', gap: 8, marginTop: 10 },
  btn: { background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, padding: '7px 14px', fontSize: 12, letterSpacing: 1, cursor: 'pointer' },
  vacio: { color: 'var(--text-dim)', textAlign: 'center', padding: 40, fontSize: 13 },
  toggleVista: { display: 'flex', gap: 4, background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 8, padding: 3 },
  toggleBtn: { background: 'transparent', border: 'none', borderRadius: 6, color: 'var(--text-sub)', padding: '6px 10px', cursor: 'pointer', fontSize: 16 },
  toggleBtnActivo: { background: 'var(--bg3)', color: 'var(--gold)' },
  // Badges de estado: pendiente dorado, entregado azul, aprobado verde, rechazado rojo
  badgePendiente: { background: 'rgba(201,146,74,0.15)', color: '#C9924A', padding: '3px 10px', borderRadius: 20, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 },
  badgeEntregado: { background: 'rgba(106,138,170,0.15)', color: '#6A8AAA', padding: '3px 10px', borderRadius: 20, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 },
  badgeAprobado: { background: 'rgba(76,175,125,0.15)', color: 'var(--green)', padding: '3px 10px', borderRadius: 20, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 },
  badgeRechazado: { background: 'rgba(192,97,74,0.15)', color: 'var(--red)', padding: '3px 10px', borderRadius: 20, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 },
  // Acciones
  btnEntregar: { background: 'var(--bg)', border: 'none', borderRadius: 8, boxShadow: 'var(--shadow-out)', color: '#6A8AAA', padding: '7px 14px', fontSize: 12, letterSpacing: 1, cursor: 'pointer', fontWeight: 600 },
  btnAprobar: { background: 'var(--bg)', border: 'none', borderRadius: 8, boxShadow: 'var(--shadow-out)', color: 'var(--green)', padding: '7px 14px', fontSize: 12, letterSpacing: 1, cursor: 'pointer', fontWeight: 600 },
  btnRechazar: { background: 'var(--bg)', border: 'none', borderRadius: 8, boxShadow: 'var(--shadow-out)', color: 'var(--red)', padding: '7px 14px', fontSize: 12, letterSpacing: 1, cursor: 'pointer', fontWeight: 600 },
  motivoBox: { marginTop: 10, background: 'var(--bg)', borderRadius: 10, padding: 12, boxShadow: 'var(--shadow-in)' },
  motivoInput: { width: '100%', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--text)', padding: '8px 10px', fontSize: 12, outline: 'none', marginBottom: 10, boxSizing: 'border-box' },
  motivoTexto: { color: 'var(--text-sub)', fontSize: 11, marginTop: 6 },
  // Tabs
  tabsFila: { display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--border)' },
  tabBtn: { background: 'transparent', border: 'none', padding: '10px 18px', fontSize: 12, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-sub)', cursor: 'pointer', borderBottom: '2px solid transparent', marginBottom: -1, transition: 'color 0.15s, border-color 0.15s' },
  tabBtnActivo: { color: 'var(--gold)', borderBottom: '2px solid var(--gold)' },
};

// 'cancelado' es un estado legado (de antes de existir 'rechazado') que se sigue mostrando igual
const esAprobado = (estado) => estado === 'aprobado';
const esRechazado = (estado) => estado === 'rechazado' || estado === 'cancelado';
const esResuelto = (estado) => esAprobado(estado) || esRechazado(estado);

export default function Pedidos({ rol, nombreModelo, nombreMonitor, modelasMonitor, nombreAprobador }) {
  const [pedidos, setPedidos] = useState([]);
  const [vistaGrid, setVistaGrid] = useState(true);
  const [tabJefe, setTabJefe] = useState('porAprobar');
  const [tabMonitor, setTabMonitor] = useState('pendientes');
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

  // MONITOR: marca el pedido como entregado físicamente. No toca inventario.
  const marcarEntregado = async (pedido) => {
    await updateDoc(doc(db, 'pedidos', pedido.id), {
      estado: 'entregado',
      entregadoPor: nombreMonitor || '',
      fechaEntrega: new Date().toISOString()
    });
    await crearNotificacion({
      tipo: 'pedido',
      mensaje: `${nombreMonitor || 'Un monitor'} entregó ${pedido.producto} a ${pedido.modelo}, pendiente aprobar`,
      destinatarios: ['jefe']
    });
  };

  // JEFE: aprueba un pedido ya entregado. Aquí sí se descuenta inventario.
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
    await crearNotificacion({
      tipo: 'pedido',
      mensaje: `Pedido de ${pedido.producto} aprobado`,
      destinatarios: [pedido.entregadoPor, pedido.modelo]
    });
  };

  // JEFE: rechaza un pedido ya entregado, con motivo.
  const confirmarRechazo = async (pedido) => {
    const motivo = motivoInput[pedido.id] || '';
    await updateDoc(doc(db, 'pedidos', pedido.id), {
      estado: 'rechazado',
      motivoRechazo: motivo,
      aprobadoPor: nombreAprobador || 'jefe',
      fechaAprobacion: new Date().toISOString()
    });
    await crearNotificacion({
      tipo: 'pedido',
      mensaje: `Pedido de ${pedido.producto} rechazado${motivo ? `: ${motivo}` : ''}`,
      destinatarios: [pedido.entregadoPor, pedido.modelo]
    });
    setRechazando(null);
    setMotivoInput(prev => ({ ...prev, [pedido.id]: '' }));
  };

  const quincena = getQuincena();
  const pedidosQuincena = pedidos.filter(p => {
    const fechaPedido = p.fecha?.split('T')[0] || '';
    return fechaPedido >= quincena.inicio && fechaPedido <= quincena.fin;
  });

  const renderBadge = (p) => {
    if (esAprobado(p.estado)) return <span style={s.badgeAprobado}>Aprobado ✓</span>;
    if (esRechazado(p.estado)) return <span style={s.badgeRechazado}>Rechazado ✕</span>;
    if (p.estado === 'entregado') return <span style={s.badgeEntregado}>Entregado</span>;
    return <span style={s.badgePendiente}>Pendiente</span>;
  };

  // accion: 'monitor' (puede marcar entregado) | 'jefe' (puede aprobar/rechazar) | null (solo lectura)
  const renderCardPedido = (p, accion) => (
    <div key={p.id} style={s.card} className="nm-card-elevated">
      <div style={s.cardHeader}>
        <div style={s.producto}>{p.producto}</div>
        {renderBadge(p)}
      </div>
      <div style={s.fila}><div style={s.filaLabel}>Modelo</div><div style={s.filaValor}>{p.modelo}</div></div>
      <div style={s.fila}><div style={s.filaLabel}>Precio</div><div style={s.filaValor}>${p.precio?.toLocaleString()}</div></div>
      {(() => {
        const info = estadoCuotas(p);
        if (info.total <= 1) return null;
        return (
          <div style={s.fila}><div style={s.filaLabel}>Pago en cuotas</div><div style={s.filaValor}>Cuota {info.cuotaActual}/{info.total} · ${Math.ceil(p.precio / info.total).toLocaleString()} c/u</div></div>
        );
      })()}
      {p.entregadoPor && (
        <div style={s.fila}><div style={s.filaLabel}>Entregado por</div><div style={s.filaValor}>{p.entregadoPor}</div></div>
      )}
      <div style={{ ...s.fila, borderBottom: 'none' }}><div style={s.filaLabel}>Hora</div><div style={s.filaValor}>{p.hora}</div></div>

      {esRechazado(p.estado) && p.motivoRechazo && (
        <div style={s.motivoTexto}>Motivo: {p.motivoRechazo}</div>
      )}

      {accion === 'monitor' && p.estado === 'pendiente' && (
        <div style={s.btnRow}>
          <button style={s.btnEntregar} onClick={() => marcarEntregado(p)}>Marcar como entregado</button>
        </div>
      )}

      {accion === 'jefe' && p.estado === 'entregado' && (
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

  const vistaToggle = (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
      <div style={s.toggleVista}>
        <button style={{ ...s.toggleBtn, ...(vistaGrid ? s.toggleBtnActivo : {}) }} onClick={() => setVistaGrid(true)}>⊞</button>
        <button style={{ ...s.toggleBtn, ...(!vistaGrid ? s.toggleBtnActivo : {}) }} onClick={() => setVistaGrid(false)}>☰</button>
      </div>
    </div>
  );

  // ── VISTA JEFE: "Por aprobar" (entregados) / "Historial" (aprobados + rechazados) ──
  if (rol === 'jefe') {
    const porAprobar = pedidosQuincena.filter(p => p.estado === 'entregado');
    const historial = pedidosQuincena.filter(p => esResuelto(p.estado));
    const listado = tabJefe === 'porAprobar' ? porAprobar : historial;

    return (
      <div style={s.wrap}>
        <div style={s.tabsFila}>
          <button type="button" style={{ ...s.tabBtn, ...(tabJefe === 'porAprobar' ? s.tabBtnActivo : {}) }} onClick={() => setTabJefe('porAprobar')}>
            Por aprobar{porAprobar.length > 0 ? ` (${porAprobar.length})` : ''}
          </button>
          <button type="button" style={{ ...s.tabBtn, ...(tabJefe === 'historial' ? s.tabBtnActivo : {}) }} onClick={() => setTabJefe('historial')}>
            Historial
          </button>
        </div>

        {vistaToggle}

        {listado.length === 0 && <p style={s.vacio}>{tabJefe === 'porAprobar' ? 'No hay pedidos entregados esperando aprobación' : 'No hay historial de pedidos'}</p>}

        {gridWrap(listado.map(p => renderCardPedido(p, 'jefe')))}
      </div>
    );
  }

  // ── VISTA MONITOR: "Pendientes" / "Entregados" / "Historial" — solo de sus modelos ──
  if (rol === 'monitor') {
    const misModelos = modelasMonitor || [];
    const misPedidos = pedidosQuincena.filter(p => misModelos.includes(p.modelo));
    const pendientes = misPedidos.filter(p => p.estado === 'pendiente');
    const entregados = misPedidos.filter(p => p.estado === 'entregado');
    const historial = misPedidos.filter(p => esResuelto(p.estado));
    const listado = tabMonitor === 'pendientes' ? pendientes : tabMonitor === 'entregados' ? entregados : historial;

    return (
      <div style={s.wrap}>
        <div style={s.tabsFila}>
          <button type="button" style={{ ...s.tabBtn, ...(tabMonitor === 'pendientes' ? s.tabBtnActivo : {}) }} onClick={() => setTabMonitor('pendientes')}>
            Pendientes{pendientes.length > 0 ? ` (${pendientes.length})` : ''}
          </button>
          <button type="button" style={{ ...s.tabBtn, ...(tabMonitor === 'entregados' ? s.tabBtnActivo : {}) }} onClick={() => setTabMonitor('entregados')}>
            Entregados{entregados.length > 0 ? ` (${entregados.length})` : ''}
          </button>
          <button type="button" style={{ ...s.tabBtn, ...(tabMonitor === 'historial' ? s.tabBtnActivo : {}) }} onClick={() => setTabMonitor('historial')}>
            Historial
          </button>
        </div>

        {vistaToggle}

        {listado.length === 0 && <p style={s.vacio}>No hay pedidos en esta sección</p>}

        {gridWrap(listado.map(p => renderCardPedido(p, tabMonitor === 'pendientes' ? 'monitor' : null)))}
      </div>
    );
  }

  // ── VISTA MODELO (tienda) ───────────────────────────────────────────────
  // Nunca los ya pagados; de los demas, solo pendientes (cualquier fecha) o los de esta quincena
  const misPedidos = pedidos.filter(p => {
    if (nombreModelo && p.modelo !== nombreModelo) return false;
    if (estadoCuotas(p).pagado) return false;
    if (p.estado === 'pendiente') return true;
    const fechaPedido = p.fecha?.split('T')[0] || '';
    return fechaPedido >= quincena.inicio && fechaPedido <= quincena.fin;
  });
  return (
    <div style={s.wrap}>
      {misPedidos.length === 0 && <p style={s.vacio}>Aún no has hecho pedidos</p>}
      <div className="nm-grid-cards">
        {misPedidos.map(p => renderCardPedido(p, null))}
      </div>
    </div>
  );
}
