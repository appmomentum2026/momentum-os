import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, doc, setDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

const s = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: { background: 'var(--bg)', borderRadius: 14, padding: 16, boxShadow: 'var(--shadow-out)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  producto: { color: 'var(--gold)', fontSize: 13, fontWeight: 500 },
  modelo: { color: 'var(--text-sub)', fontSize: 12, marginBottom: 4 },
  precio: { color: 'var(--gold)', fontSize: 13, fontWeight: 500 },
  fila: { display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)' },
  filaLabel: { color: 'var(--text-sub)', fontSize: 12 },
  filaValor: { color: 'var(--text)', fontSize: 12 },
  badge: { padding: '3px 10px', borderRadius: 20, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 500 },
  btnRow: { display: 'flex', gap: 8, marginTop: 10 },
  btn: { background: 'var(--bg)', border: 'none', borderRadius: 8, boxShadow: 'var(--shadow-out)', padding: '7px 14px', fontSize: 12, letterSpacing: 1, cursor: 'pointer' },
  vacio: { color: 'var(--text-dim)', textAlign: 'center', padding: 40, fontSize: 13 },
  filtros: { display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  filtroBtn: { background: 'var(--bg)', border: 'none', borderRadius: 10, boxShadow: 'var(--shadow-out)', color: 'var(--text-sub)', padding: '7px 14px', fontSize: 12, letterSpacing: 1, cursor: 'pointer' },
  filtroActivo: { boxShadow: 'var(--shadow-in)', color: 'var(--gold)' }
};

const ESTADOS_COLOR = {
  pendiente: { bg: '#C9A84C22', color: '#C9A84C' },
  entregado: { bg: '#1d9e7522', color: '#1d9e75' },
  cancelado: { bg: '#d85a3022', color: '#d85a30' }
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

  const pedidosFiltrados = filtro === 'todos' ? pedidos : pedidos.filter(p => p.estado === filtro);

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
        const estadoColor = ESTADOS_COLOR[p.estado] || ESTADOS_COLOR.pendiente;
        return (
          <div key={p.id} style={s.card}>
            <div style={s.cardHeader}>
              <div style={s.producto}>{p.producto}</div>
              <div style={{ ...s.badge, background: estadoColor.bg, color: estadoColor.color }}>{p.estado}</div>
            </div>
            <div style={s.fila}>
              <div style={s.filaLabel}>Modelo</div>
              <div style={s.filaValor}>{p.modelo}</div>
            </div>
            <div style={s.fila}>
              <div style={s.filaLabel}>Precio</div>
              <div style={s.filaValor}>${p.precio?.toLocaleString()}</div>
            </div>
            {p.cuotas > 1 && (
              <div style={s.fila}>
                <div style={s.filaLabel}>Pago en cuotas</div>
                <div style={s.filaValor}>2 cuotas de ${Math.ceil(p.precio / 2).toLocaleString()}</div>
              </div>
            )}
            <div style={{ ...s.fila, borderBottom: 'none' }}>
              <div style={s.filaLabel}>Hora</div>
              <div style={s.filaValor}>{p.hora}</div>
            </div>
            {p.estado === 'pendiente' && (
              <div style={s.btnRow}>
                <button style={{ ...s.btn, color: '#1d9e75' }} onClick={() => cambiarEstado(p, 'entregado')}>
                  Entregado
                </button>
                <button style={{ ...s.btn, color: '#d85a30' }} onClick={() => cambiarEstado(p, 'cancelado')}>
                  Cancelar
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}