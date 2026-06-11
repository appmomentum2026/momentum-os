import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, doc, setDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

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
  wrap: { display: 'flex', flexDirection: 'column', gap: 10 },
  card: { background: 'var(--bg2)', borderRadius: 12, padding: 16, border: '1px solid var(--border)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  producto: { color: 'var(--gold)', fontSize: 13, fontWeight: 500 },
  fila: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' },
  filaLabel: { color: 'var(--text-sub)', fontSize: 12 },
  filaValor: { color: 'var(--text)', fontSize: 12 },
  badge: { padding: '3px 10px', borderRadius: 20, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 500 },
  btnRow: { display: 'flex', gap: 8, marginTop: 10 },
  btn: { background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 14px', fontSize: 12, letterSpacing: 1, cursor: 'pointer' },
  vacio: { color: 'var(--text-dim)', textAlign: 'center', padding: 40, fontSize: 13 },
  filtros: { display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  filtroBtn: { background: 'transparent', border: '1px solid var(--border)', borderRadius: 20, color: 'var(--text-sub)', padding: '7px 14px', fontSize: 12, letterSpacing: 1, cursor: 'pointer' },
  filtroActivo: { background: 'var(--gold)', borderColor: 'var(--gold)', color: '#141414', fontWeight: 500 }
};

const ESTADOS_STYLE = {
  pendiente: { background: 'rgba(201,146,74,0.15)', color: '#C9924A' },
  entregado: { background: 'rgba(76,175,125,0.15)', color: '#4CAF7D' },
  cancelado: { background: 'rgba(192,97,74,0.15)', color: '#C0614A' }
};

export default function Pedidos({ rol }) {
  const [pedidos, setPedidos] = useState([]);
  const [filtro, setFiltro] = useState('todos');

  useEffect(() => {
    const q = query(collection(db, 'pedidos'), orderBy('fecha', 'desc'));
    const unsub = onSnapshot(q, snap => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      setPedidos(data);
    });
    return unsub;
  }, []);

  const cambiarEstado = async (pedido, nuevoEstado) => {
    await setDoc(doc(db, 'pedidos', pedido.id), { ...pedido, estado: nuevoEstado });
  };

  const quincena = getQuincena();
  const pedidosQuincena = pedidos.filter(p => {
    const fechaPedido = p.fecha?.split('T')[0] || '';
    return fechaPedido >= quincena.inicio && fechaPedido <= quincena.fin;
  });
  const pedidosFiltrados = filtro === 'todos' ? pedidosQuincena : pedidosQuincena.filter(p => p.estado === filtro);

  return (
    <div style={s.wrap}>
      <div style={s.filtros}>
        {['todos', 'pendiente', 'entregado', 'cancelado'].map(f => (
          <button key={f} style={{ ...s.filtroBtn, ...(filtro === f ? s.filtroActivo : {}) }} onClick={() => setFiltro(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {pedidosFiltrados.length === 0 && <p style={s.vacio}>No hay pedidos</p>}

      {pedidosFiltrados.map(p => {
        const estadoStyle = ESTADOS_STYLE[p.estado] || ESTADOS_STYLE.pendiente;
        return (
          <div key={p.id} style={s.card}>
            <div style={s.cardHeader}>
              <div style={s.producto}>{p.producto}</div>
              <div style={{ ...s.badge, ...estadoStyle }}>{p.estado}</div>
            </div>
            <div style={s.fila}><div style={s.filaLabel}>Modelo</div><div style={s.filaValor}>{p.modelo}</div></div>
            <div style={s.fila}><div style={s.filaLabel}>Precio</div><div style={s.filaValor}>${p.precio?.toLocaleString()}</div></div>
            {p.cuotas > 1 && (
              <div style={s.fila}><div style={s.filaLabel}>Pago en cuotas</div><div style={s.filaValor}>2 cuotas de ${Math.ceil(p.precio / 2).toLocaleString()}</div></div>
            )}
            <div style={{ ...s.fila, borderBottom: 'none' }}><div style={s.filaLabel}>Hora</div><div style={s.filaValor}>{p.hora}</div></div>
            {p.estado === 'pendiente' && (
              <div style={s.btnRow}>
                <button style={{ ...s.btn, color: '#4CAF7D' }} onClick={() => cambiarEstado(p, 'entregado')}>Entregado</button>
                <button style={{ ...s.btn, color: '#C0614A' }} onClick={() => cambiarEstado(p, 'cancelado')}>Cancelar</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}