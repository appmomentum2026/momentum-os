import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, onSnapshot, orderBy, query } from 'firebase/firestore';

const CATEGORIAS = ['Daño', 'Reemplazo', 'Falta', 'Problema tecnico'];

const COLORES = {
  'Daño': '#d85a30',
  'Reemplazo': '#C9A84C',
  'Falta': '#855577',
  'Problema tecnico': '#4466AA'
};

const nm = {
  form: { background: '#1a1a2e', borderRadius: 14, padding: 20, marginBottom: 24, boxShadow: '4px 4px 8px #0d0d1a, -4px -4px 8px #272742' },
  label: { color: '#555577', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8, display: 'block' },
  select: { width: '100%', background: '#1a1a2e', border: 'none', borderRadius: 10, boxShadow: 'inset 3px 3px 6px #0d0d1a, inset -3px -3px 6px #272742', color: '#C9A84C', padding: '12px 14px', fontSize: 13, marginBottom: 16, outline: 'none' },
  textarea: { width: '100%', background: '#1a1a2e', border: 'none', borderRadius: 10, boxShadow: 'inset 3px 3px 6px #0d0d1a, inset -3px -3px 6px #272742', color: '#888899', padding: '12px 14px', fontSize: 13, marginBottom: 16, minHeight: 80, resize: 'vertical', outline: 'none' },
  btnEnviar: { background: '#1a1a2e', border: 'none', borderRadius: 12, boxShadow: '4px 4px 8px #0d0d1a, -4px -4px 8px #272742', color: '#C9A84C', padding: '12px 24px', fontSize: 13, fontWeight: 500, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer', width: '100%' },
  lista: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: { borderRadius: 14, padding: 16, background: '#1a1a2e', boxShadow: '4px 4px 8px #0d0d1a, -4px -4px 8px #272742', borderLeft: '3px solid' },
  categoria: { fontSize: 11, fontWeight: 500, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
  texto: { color: '#888899', fontSize: 13, marginBottom: 8, lineHeight: 1.5 },
  meta: { color: '#444466', fontSize: 11, letterSpacing: 1 },
  vacia: { color: '#444466', textAlign: 'center', padding: 40, fontSize: 13, letterSpacing: 1 }
};

export default function Novedades({ rol }) {
  const [novedades, setNovedades] = useState([]);
  const [categoria, setCategoria] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [enviando, setEnviando] = useState(false);

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
      dia: new Date().toLocaleDateString('es-CO')
    });
    setCategoria('');
    setDescripcion('');
    setEnviando(false);
  };

  return (
    <div>
      {rol === 'monitor' && (
        <div style={nm.form}>
          <label style={nm.label}>Categoria</label>
          <select style={nm.select} value={categoria} onChange={e => setCategoria(e.target.value)}>
            <option value="">Seleccionar</option>
            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <label style={nm.label}>Descripcion</label>
          <textarea style={nm.textarea} placeholder="Describe la novedad..." value={descripcion} onChange={e => setDescripcion(e.target.value)} />
          <button style={nm.btnEnviar} onClick={enviar} disabled={enviando}>
            {enviando ? 'Enviando...' : 'Registrar novedad'}
          </button>
        </div>
      )}
      <div style={nm.lista}>
        {novedades.length === 0 && <p style={nm.vacia}>No hay novedades registradas</p>}
        {novedades.map(n => (
          <div key={n.id} style={{ ...nm.card, borderLeftColor: COLORES[n.categoria] || '#555577' }}>
            <div style={{ ...nm.categoria, color: COLORES[n.categoria] || '#555577' }}>{n.categoria}</div>
            <div style={nm.texto}>{n.descripcion}</div>
            <div style={nm.meta}>{n.dia} · {n.hora}</div>
          </div>
        ))}
      </div>
    </div>
  );
}