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

const s = {
  form: { background: 'var(--bg2)', borderRadius: 14, padding: 20, marginBottom: 14, border: '1px solid var(--border)' },
  label: { color: 'var(--text-sub)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6, display: 'block' },
  select: { width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--gold)', padding: '12px 14px', fontSize: 13, outline: 'none' },
  modeloCard: { background: 'var(--bg2)', borderRadius: 12, padding: 16, marginBottom: 10, border: '1px solid var(--border)' },
  modeloNombre: { color: 'var(--gold)', fontSize: 13, fontWeight: 500, marginBottom: 12 },
  seccion: { color: 'var(--text-dim)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8, marginTop: 12 },
  fila: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 },
  inputSmall: { background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', padding: '8px 10px', fontSize: 12, width: '100%', outline: 'none' },
  platLabel: { color: 'var(--text-dim)', fontSize: 11, letterSpacing: 1, marginBottom: 4 },
  btnEnviar: { background: 'var(--gold)', border: 'none', borderRadius: 10, color: '#141414', padding: '13px 24px', fontSize: 13, fontWeight: 500, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer', width: '100%', marginTop: 8 },
  cierreCard: { background: 'var(--bg2)', borderRadius: 12, padding: 16, marginBottom: 10, border: '1px solid var(--border)', borderLeft: '3px solid var(--gold)' },
  cierreTitulo: { color: 'var(--gold)', fontSize: 14, fontWeight: 500, marginBottom: 4 },
  cierreMeta: { color: 'var(--text-dim)', fontSize: 11, marginBottom: 12 },
  modelaRow: { borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 10 },
  modelaNombre: { color: 'var(--text)', fontSize: 12, marginBottom: 4 },
  modelaHorario: { color: 'var(--text-dim)', fontSize: 11, marginBottom: 6 },
  platRow: { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-sub)', padding: '3px 0' },
  vacia: { color: 'var(--text-dim)', textAlign: 'center', padding: 40, fontSize: 13 }
};

function FormModelo({ nombre, datos, onChange }) {
  return (
    <div style={s.modeloCard}>
      <div style={s.modeloNombre}>{nombre}</div>
      <div style={s.seccion}>Horarios</div>
      <div style={s.fila}>
        <div><div style={s.platLabel}>Inicio</div><input style={s.inputSmall} type="time" value={datos.inicio || ''} onChange={e => onChange('inicio', e.target.value)} /></div>
        <div><div style={s.platLabel}>Inicio break</div><input style={s.inputSmall} type="time" value={datos.inicioBreak || ''} onChange={e => onChange('inicioBreak', e.target.value)} /></div>
        <div><div style={s.platLabel}>Fin break</div><input style={s.inputSmall} type="time" value={datos.finBreak || ''} onChange={e => onChange('finBreak', e.target.value)} /></div>
        <div><div style={s.platLabel}>Fin transmision</div><input style={s.inputSmall} type="time" value={datos.fin || ''} onChange={e => onChange('fin', e.target.value)} /></div>
      </div>
      <div style={s.seccion}>Tokens por plataforma</div>
      {PLATAFORMAS.map(plat => (
        <div key={plat} style={{ marginBottom: 10 }}>
          <div style={s.platLabel}>{plat}</div>
          <div style={s.fila}>
            <input style={s.inputSmall} type="number" placeholder="Tokens" value={datos[plat + '_tokens'] || ''} onChange={e => onChange(plat + '_tokens', e.target.value)} />
            <input style={s.inputSmall} type="number" placeholder="USD" value={datos[plat + '_usd'] || ''} onChange={e => onChange(plat + '_usd', e.target.value)} />
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
        {cierres.length === 0 && <p style={s.vacia}>No hay cierres registrados</p>}
        {cierres.map(c => (
          <div key={c.id} style={s.cierreCard}>
            <div style={s.cierreTitulo}>{c.monitor} — Turno {c.turno}</div>
            <div style={s.cierreMeta}>{c.dia} · {c.hora}</div>
            {c.modelos && c.modelos.map(m => (
              <div key={m.nombre} style={s.modelaRow}>
                <div style={s.modelaNombre}>{m.nombre}</div>
                <div style={s.modelaHorario}>{m.inicio && `Inicio: ${m.inicio}`}{m.fin && ` · Fin: ${m.fin}`}</div>
                {PLATAFORMAS.map(p => (m[p + '_tokens'] || m[p + '_usd']) ? (
                  <div key={p} style={s.platRow}>
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
      <div style={s.form}>
        <label style={s.label}>Tu nombre</label>
        <select style={s.select} value={monitor} onChange={e => { setMonitor(e.target.value); setDatosModelos({}); }}>
          <option value="">Seleccionar monitor</option>
          {Object.keys(MONITORES).map(m => <option key={m} value={m}>{m} ({TURNOS[m]})</option>)}
        </select>
      </div>
      {monitor && MONITORES[monitor].map(nombre => (
        <FormModelo key={nombre} nombre={nombre} datos={datosModelos[nombre] || {}}
          onChange={(campo, valor) => actualizarModelo(nombre, campo, valor)} />
      ))}
      {monitor && (
        <button style={s.btnEnviar} onClick={enviarCierre} disabled={enviando}>
          {enviando ? 'Enviando...' : 'Cerrar turno'}
        </button>
      )}
    </div>
  );
}