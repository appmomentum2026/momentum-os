import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, doc, setDoc, onSnapshot, orderBy, query } from 'firebase/firestore';

const CATEGORIAS = ['Daño', 'Reemplazo', 'Falta', 'Problema tecnico'];

const COLORES = {
  'Daño': '#C0614A',
  'Reemplazo': '#C9924A',
  'Falta': '#8B7355',
  'Problema tecnico': '#6A8AAA'
};

const s = {
  form: { background: 'var(--bg2)', borderRadius: 14, padding: 20, marginBottom: 24, border: '1px solid var(--border2)' },
  label: { color: 'var(--text-sub)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8, display: 'block' },
  select: { width: '100%', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--gold)', padding: '12px 14px', fontSize: 13, marginBottom: 16, outline: 'none' },
  textarea: { width: '100%', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--text)', padding: '12px 14px', fontSize: 13, marginBottom: 16, minHeight: 80, resize: 'vertical', outline: 'none' },
  btnEnviar: { background: 'var(--gold)', border: 'none', borderRadius: 8, color: '#141414', padding: '12px 24px', fontSize: 13, fontWeight: 500, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer', width: '100%' },
  lista: { display: 'flex', flexDirection: 'column', gap: 10 },
  card: { borderRadius: 12, padding: 16, background: 'var(--bg3)', border: '1px solid var(--border2)', borderLeft: '3px solid', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' },
  categoria: { fontSize: 11, fontWeight: 500, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
  texto: { color: 'var(--text)', fontSize: 14, marginBottom: 8, lineHeight: 1.5 },
  meta: { color: 'var(--text-dim)', fontSize: 11, letterSpacing: 1 },
  vacia: { color: 'var(--text-dim)', textAlign: 'center', padding: 40, fontSize: 13 },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)' },
  btnResolver: { background: 'rgba(76,175,125,0.12)', border: '1px solid rgba(76,175,125,0.3)', borderRadius: 8, color: '#4CAF7D', padding: '6px 14px', fontSize: 12, letterSpacing: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 },
  tabs: { display: 'flex', gap: 8, marginBottom: 16 },
  tab: { background: 'transparent', border: '1px solid var(--border2)', borderRadius: 20, color: 'var(--text-sub)', padding: '7px 16px', fontSize: 12, letterSpacing: 1, cursor: 'pointer' },
  tabActiva: { background: 'var(--gold)', borderColor: 'var(--gold)', color: '#141414', fontWeight: 500 }
};

export default function Novedades({ rol }) {
  const [novedades, setNovedades] = useState([]);
  const [categoria, setCategoria] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [vista, setVista] = useState('activas');

  useEffect(() => {
    const q = query(collection(db, 'novedades'), orderBy('fecha', 'desc'));
    const unsub = onSnapshot(q, snap => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      setNovedades(data);
    });
    return unsub;
  }, []);

  const enviar = async () => {
    if (!categoria || !descripcion.trim()) return;
    setEnviando(true);
    await addDoc(collection(db, 'novedades'), {
      categoria, descripcion: descripcion.trim(),
      fecha: new Date().toISOString(),
      hora: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      dia: new Date().toLocaleDateString('es-CO'),
      resuelta: false
    });
    setCategoria('');
    setDescripcion('');
    setEnviando(false);
  };

  const resolver = async (novedad) => {
    await setDoc(doc(db, 'novedades', novedad.id), { ...novedad, resuelta: true });
  };

  const novedadesFiltradas = novedades.filter(n =>
    vista === 'activas' ? !n.resuelta : n.resuelta
  );

  return (
    <div>
      {rol === 'monitor' && (
        <div style={s.form}>
          <label style={s.label}>Categoria</label>
          <select style={s.select} value={categoria} onChange={e => setCategoria(e.target.value)}>
            <option value="">Seleccionar</option>
            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <label style={s.label}>Descripcion</label>
          <textarea style={s.textarea} placeholder="Describe la novedad..." value={descripcion} onChange={e => setDescripcion(e.target.value)} />
          <button style={s.btnEnviar} onClick={enviar} disabled={enviando}>
            {enviando ? 'Enviando...' : 'Registrar novedad'}
          </button>
        </div>
      )}

      <div style={s.tabs}>
        <button style={{ ...s.tab, ...(vista === 'activas' ? s.tabActiva : {}) }} onClick={() => setVista('activas')}>
          Activas
        </button>
        <button style={{ ...s.tab, ...(vista === 'resueltas' ? s.tabActiva : {}) }} onClick={() => setVista('resueltas')}>
          Resueltas
        </button>
      </div>

      <div style={s.lista}>
        {novedadesFiltradas.length === 0 && (
          <p style={s.vacia}>{vista === 'activas' ? 'No hay novedades activas' : 'No hay novedades resueltas'}</p>
        )}
        {novedadesFiltradas.map(n => (
          <div key={n.id} style={{ ...s.card, borderLeftColor: COLORES[n.categoria] || 'var(--gold)', opacity: n.resuelta ? 0.6 : 1 }}>
            <div style={{ ...s.categoria, color: COLORES[n.categoria] || 'var(--gold)' }}>{n.categoria}</div>
            <div style={s.texto}>{n.descripcion}</div>
            <div style={s.meta}>{n.dia} · {n.hora}</div>
            {!n.resuelta && (
              <div style={s.cardFooter}>
                <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>¿Ya se resolvió?</span>
                <button style={s.btnResolver} onClick={() => resolver(n)}>
                  <i className="ti ti-check" aria-hidden="true"></i> Marcar resuelta
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}