import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, onSnapshot, orderBy, query } from 'firebase/firestore';

const PLATAFORMAS = ['Stripchat', 'Camsoda', 'Chaturbate', 'Streamate'];

const MONITORES = {
  'Daniela': ['Ashly Naibel Burgos Machado', 'Ana Sofia Ospina Ortega', 'Tatiana Andrea Rios Hurtado', 'Luz Magnolia Salazar Garcia', 'Vanessa Arroyave', 'Valentina Osorno Alvarez', 'Sara Arango Zuleta', 'Valentina Zapata Azcuntar'],
  'Ramon': ['Alejandra Rojas Vargas', 'Maye Catalina Insuasty Saldariaga', 'Juliana Ospina Jimenez', 'Liliana Castillo Salgado', 'Nicoll Pulgarin Nohava', 'Alison Daniela Zapata Estrada', 'Evelyn Tamayo Zapata'],
  'Santiago': ['Valentina Marquez Pino', 'Susana Pelaez', 'Ivonne Camila Zuluaga Prieto', 'Evelin Saday Ricardo Solis', 'Luisa Fernanda Osorio Jimenez'],
  'Monica': ['Natalia Hernandez Llano', 'Maria Camila Correa Munoz', 'Nataly Cardenas Moreno', 'Dayannis Tobon Acosta', 'Diana Luz Agamez Gonzalez', 'Asoryana Ramos Briseno', 'Yesmi Diaz Ruiz'],
  'Juan': ['Andrea Carolina Gomez Rodelo', 'Viviana Marcela Zambrano Mosquera', 'Sofia del Pilar Herrera Celis', 'Angie Marcela Villa Carmona', 'Isabela Gutierrez Rivera', 'Alexa Rivera Montoya'],
  'Cesar': ['Yeimy Viviana Osorio Rojas', 'Maria Jose Lopez Mejia', 'Sara Paulina Mejia Marin', 'Luisa Fernanda Rodriguez Calderon']
};

const TURNOS = { 'Daniela': 'Manana', 'Ramon': 'Manana', 'Santiago': 'Tarde', 'Monica': 'Tarde', 'Juan': 'Noche', 'Cesar': 'Noche' };

const nm = {
  form: { background: '#1a1a2e', borderRadius: 14, padding: 20, marginBottom: 20, boxShadow: '4px 4px 8px #0d0d1a, -4px -4px 8px #272742' },
  label: { color: '#555577', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8, display: 'block' },
  select: { width: '100%', background: '#1a1a2e', border: 'none', borderRadius: 10, boxShadow: 'inset 3px 3px 6px #0d0d1a, inset -3px -3px 6px #272742', color: '#C9A84C', padding: '12px 14px', fontSize: 13, outline: 'none' },
  modeloCard: { background: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: '4px 4px 8px #0d0d1a, -4px -4px 8px #272742' },
  modeloNombre: { color: '#C9A84C', fontSize: 13, fontWeight: 500, letterSpacing: 1, marginBottom: 14 },
  seccion: { color: '#555577', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8, marginTop: 12 },
  fila: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 },
  inputSmall: { background: '#1a1a2e', border: 'none', borderRadius: 10, boxShadow: 'inset 2px 2px 5px #0d0d1a, inset -2px -2px 5px #272742', color: '#888899', padding: '8px 10px', fontSize: 12, width: '100%', outline: 'none' },
  platLabel: { color: '#444466', fontSize: 11, letterSpacing: 1, marginBottom: 4 },
  btnEnviar: { background: '#1a1a2e', border: 'none', borderRadius: 12, boxShadow: '5px 5px 10px #0d0d1a, -5px -5px 10px #272742', color: '#C9A84C', padding: '14px 24px', fontSize: 13, fontWeight: 500, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer', width: '100%', marginTop: 8 },
  cierreCard: { background: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: '4px 4px 8px #0d0d1a, -4px -4px 8px #272742', borderLeft: '3px solid #C9A84C' },
  cierreTitulo: { color: '#C9A84C', fontSize: 14, fontWeight: 500, letterSpacing: 1, marginBottom: 4 },
  cierreMeta: { color: '#444466', fontSize: 11, letterSpacing: 1, marginBottom: 12 },
  modelaRow: { borderTop: '1px solid #1f1f35', paddingTop: 10, marginTop: 10 },
  modelaNombre: { color: '#888899', fontSize: 12, marginBottom: 4 },
  modelaHorario: { color: '#444466', fontSize: 11, marginBottom: 6 },
  platRow: { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#444466', padding: '3px 0' },
  vacia: { color: '#444466', textAlign: 'center', padding: 40, fontSize: 13, letterSpacing: 1 }
};

function FormModelo({ nombre, datos, onChange }) {
  return (
    <div style={nm.modeloCard}>
      <div style={nm.modeloNombre}>{nombre}</div>
      <div style={nm.seccion}>Horarios</div>
      <div style={nm.fila}>
        <div>
          <div style={nm.platLabel}>Inicio</div>
          <input style={nm.inputSmall} type="time" value={datos.inicio || ''} onChange={e => onChange('inicio', e.target.value)} />
        </div>
        <div>
          <div style={nm.platLabel}>Inicio break</div>
          <input style={nm.inputSmall} type="time" value={datos.inicioBreak || ''} onChange={e => onChange('inicioBreak', e.target.value)} />
        </div>
        <div>
          <div style={nm.platLabel}>Fin break</div>
          <input style={nm.inputSmall} type="time" value={datos.finBreak || ''} onChange={e => onChange('finBreak', e.target.value)} />
        </div>
        <div>
          <div style={nm.platLabel}>Fin transmision</div>
          <input style={nm.inputSmall} type="time" value={datos.fin || ''} onChange={e => onChange('fin', e.target.value)} />
        </div>
      </div>
      <div style={nm.seccion}>Tokens por plataforma</div>
      {PLATAFORMAS.map(plat => (
        <div key={plat} style={{ marginBottom: 10 }}>
          <div style={nm.platLabel}>{plat}</div>
          <div style={nm.fila}>
            <input style={nm.inputSmall} type="number" placeholder="Tokens" value={datos[plat + '_tokens'] || ''} onChange={e => onChange(plat + '_tokens', e.target.value)} />
            <input style={nm.inputSmall} type="number" placeholder="USD" value={datos[plat + '_usd'] || ''} onChange={e => onChange(plat + '_usd', e.target.value)} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CierreTurno({ rol }) {
  const [monitor, setMonitor] = useState('');
  const [datosModelos, setDatosModelos] = useState({});
  const [cierres, setCierres] = useState([]);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'cierres'), orderBy('fecha', 'desc'));
    const unsub = onSnapshot(q, snap => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      setCierres(data);
    });
    return unsub;
  }, []);

  const actualizarModelo = (nombre, campo, valor) => {
    setDatosModelos(prev => ({ ...prev, [nombre]: { ...prev[nombre], [campo]: valor } }));
  };

  const enviarCierre = async () => {
    if (!monitor) return;
    setEnviando(true);
    const resumen = MONITORES[monitor].map(m => ({ nombre: m, ...datosModelos[m] }));
    await addDoc(collection(db, 'cierres'), {
      monitor, turno: TURNOS[monitor], modelos: resumen,
      fecha: new Date().toISOString(),
      dia: new Date().toLocaleDateString('es-CO'),
      hora: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    });
    setMonitor('');
    setDatosModelos({});
    setEnviando(false);
  };

  if (rol === 'jefe') {
    return (
      <div>
        {cierres.length === 0 && <p style={nm.vacia}>No hay cierres registrados</p>}
        {cierres.map(c => (
          <div key={c.id} style={nm.cierreCard}>
            <div style={nm.cierreTitulo}>{c.monitor} — Turno {c.turno}</div>
            <div style={nm.cierreMeta}>{c.dia} · {c.hora}</div>
            {c.modelos && c.modelos.map(m => (
              <div key={m.nombre} style={nm.modelaRow}>
                <div style={nm.modelaNombre}>{m.nombre}</div>
                <div style={nm.modelaHorario}>
                  {m.inicio && `Inicio: ${m.inicio}`}{m.fin && ` · Fin: ${m.fin}`}
                </div>
                {PLATAFORMAS.map(p => (m[p + '_tokens'] || m[p + '_usd']) ? (
                  <div key={p} style={nm.platRow}>
                    <span>{p}</span>
                    <span>{m[p + '_tokens'] || 0} tokens · ${m[p + '_usd'] || 0} USD</span>
                  </div>
                ) : null)}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div style={nm.form}>
        <label style={nm.label}>Tu nombre</label>
        <select style={nm.select} value={monitor} onChange={e => { setMonitor(e.target.value); setDatosModelos({}); }}>
          <option value="">Seleccionar monitor</option>
          {Object.keys(MONITORES).map(m => <option key={m} value={m}>{m} ({TURNOS[m]})</option>)}
        </select>
      </div>
      {monitor && MONITORES[monitor].map(nombre => (
        <FormModelo key={nombre} nombre={nombre} datos={datosModelos[nombre] || {}}
          onChange={(campo, valor) => actualizarModelo(nombre, campo, valor)} />
      ))}
      {monitor && (
        <button style={nm.btnEnviar} onClick={enviarCierre} disabled={enviando}>
          {enviando ? 'Enviando...' : 'Cerrar turno'}
        </button>
      )}
    </div>
  );
}