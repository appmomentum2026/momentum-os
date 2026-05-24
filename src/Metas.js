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

const nm = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: { background: '#1a1a2e', borderRadius: 14, padding: 16, boxShadow: '4px 4px 8px #0d0d1a, -4px -4px 8px #272742' },
  fila: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  nombre: { color: '#888899', fontSize: 13, flex: 1 },
  input: { background: '#1a1a2e', border: 'none', borderRadius: 10, boxShadow: 'inset 2px 2px 5px #0d0d1a, inset -2px -2px 5px #272742', color: '#C9A84C', padding: '8px 12px', fontSize: 13, width: 120, outline: 'none', textAlign: 'right' },
  btnGuardar: { background: '#1a1a2e', border: 'none', borderRadius: 8, boxShadow: '3px 3px 6px #0d0d1a, -3px -3px 6px #272742', color: '#C9A84C', padding: '8px 14px', fontSize: 12, letterSpacing: 1, cursor: 'pointer' },
  label: { color: '#555577', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  metaActual: { color: '#444466', fontSize: 12 }
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
      <div style={nm.wrap}>
        {MODELOS_TODAS.map(modelo => (
          <div key={modelo} style={nm.card}>
            <div style={nm.fila}>
              <div style={nm.nombre}>{modelo}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  style={nm.input}
                  type="number"
                  placeholder={metas[modelo]?.tokens || 'Meta'}
                  value={editando[modelo] || ''}
                  onChange={e => setEditando(prev => ({ ...prev, [modelo]: e.target.value }))}
                />
                <button style={nm.btnGuardar} onClick={() => guardarMeta(modelo, editando[modelo])}>
                  OK
                </button>
              </div>
            </div>
            {metas[modelo] && (
              <div style={nm.metaActual}>Meta actual: {metas[modelo].tokens.toLocaleString()} tokens</div>
            )}
          </div>
        ))}
      </div>
    );
  }

  const meta = metas[nombreModelo]?.tokens || 0;
  return (
    <div style={nm.wrap}>
      <div style={nm.card}>
        <div style={nm.label}>Tu meta esta quincena</div>
        <div style={{ color: '#C9A84C', fontSize: 28, fontWeight: 500 }}>
          {meta > 0 ? meta.toLocaleString() + ' tokens' : 'Sin meta asignada'}
        </div>
      </div>
    </div>
  );
}