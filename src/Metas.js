import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';

const MODELOS_TODAS = [
  'Ashly Naibel Burgos Machado', 'Ana Sofia Ospina Ortega', 'Tatiana Andrea Rios Hurtado',
  'Luz Magnolia Salazar Garcia', 'Vanessa Arroyave', 'Valentina Osorno Alvarez',
  'Sara Arango Zuleta', 'Valentina Zapata Azcuntar', 'Alejandra Rojas Vargas',
  'Maye Catalina Insuasty Saldariaga', 'Juliana Ospina Jimenez', 'Liliana Castillo Salgado',
  'Nicoll Pulgarin Nohava', 'Alison Daniela Zapata Estrada', 'Evelyn Tamayo Zapata',
  'Valentina Marquez Pino', 'Susana Pelaez', 'Ivonne Camila Zuluaga Prieto',
  'Evelin Saday Ricardo Solis', 'Luisa Fernanda Osorio Jimenez',
  'Natalia Hernandez Llano', 'Maria Camila Correa Munoz', 'Nataly Cardenas Moreno',
  'Dayannis Tobon Acosta', 'Diana Luz Agamez Gonzalez', 'Asoryana Ramos Briseno', 'Yesmi Diaz Ruiz',
  'Andrea Carolina Gomez Rodelo', 'Viviana Marcela Zambrano Mosquera', 'Sofia del Pilar Herrera Celis',
  'Angie Marcela Villa Carmona', 'Isabela Gutierrez Rivera', 'Alexa Rivera Montoya',
  'Yeimy Viviana Osorio Rojas', 'Maria Jose Lopez Mejia', 'Sara Paulina Mejia Marin',
  'Luisa Fernanda Rodriguez Calderon'
];

const s = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 10 },
  card: { background: 'var(--bg2)', borderRadius: 12, padding: 14, border: '1px solid var(--border)' },
  fila: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  nombre: { color: 'var(--text)', fontSize: 13, flex: 1 },
  input: { background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--gold)', padding: '8px 12px', fontSize: 13, width: 120, outline: 'none', textAlign: 'right' },
  btnGuardar: { background: 'var(--gold)', border: 'none', borderRadius: 8, color: '#141414', padding: '8px 14px', fontSize: 12, letterSpacing: 1, cursor: 'pointer', fontWeight: 500 },
  label: { color: 'var(--text-sub)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  metaActual: { color: 'var(--text-dim)', fontSize: 12, marginTop: 6 },
  cardModelo: { background: 'var(--bg2)', borderRadius: 14, padding: 20, border: '1px solid var(--border)' },
  tituloModelo: { color: 'var(--text-sub)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
  valorModelo: { color: 'var(--gold)', fontSize: 28, fontWeight: 500 }
};

export default function Metas({ rol, nombreModelo }) {
  const [metas, setMetas] = useState({});
  const [editando, setEditando] = useState({});

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'metas'), snap => {
      const data = {};
      snap.forEach(d => { data[d.id] = d.data(); });
      setMetas(data);
    });
    return unsub;
  }, []);

  const guardarMeta = async (modelo, valor) => {
    if (!valor) return;
    await setDoc(doc(db, 'metas', modelo), { tokens: Number(valor), actualizado: new Date().toISOString() });
    setEditando(prev => { const n = { ...prev }; delete n[modelo]; return n; });
  };

  if (rol === 'jefe') {
    return (
      <div style={s.wrap}>
        {MODELOS_TODAS.map(modelo => (
          <div key={modelo} style={s.card}>
            <div style={s.fila}>
              <div style={s.nombre}>{modelo}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input style={s.input} type="number" placeholder={metas[modelo]?.tokens || 'Meta'}
                  value={editando[modelo] || ''}
                  onChange={e => setEditando(prev => ({ ...prev, [modelo]: e.target.value }))} />
                <button style={s.btnGuardar} onClick={() => guardarMeta(modelo, editando[modelo])}>OK</button>
              </div>
            </div>
            {metas[modelo] && <div style={s.metaActual}>Meta actual: {metas[modelo].tokens.toLocaleString()} tokens</div>}
          </div>
        ))}
      </div>
    );
  }

  const meta = metas[nombreModelo]?.tokens || 0;
  return (
    <div style={s.wrap}>
      <div style={s.cardModelo}>
        <div style={s.tituloModelo}>Tu meta esta quincena</div>
        <div style={s.valorModelo}>
          {meta > 0 ? meta.toLocaleString() + ' tokens' : 'Sin meta asignada'}
        </div>
      </div>
    </div>
  );
}