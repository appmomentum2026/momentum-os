import React, { useState, useEffect } from 'react';
import { db, functions } from './firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

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
const TURNOS_LISTA = ['Manana', 'Tarde', 'Noche'];

const ICONO_TURNO = { 'Manana': 'sun', 'Tarde': 'sunset', 'Noche': 'moon' };
const TURNO_EMOJI = { 'Manana': '🌅', 'Tarde': '☀️', 'Noche': '🌙' };

const s = {
  wrap: { display: 'block' },
  card: { background: 'var(--bg2)', borderRadius: 14, padding: 18, border: '1px solid var(--border2)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  nombreRow: { display: 'flex', alignItems: 'center', gap: 10 },
  icono: { width: 38, height: 38, borderRadius: '50%', background: 'var(--gold-dim)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', fontSize: 18 },
  nombre: { color: 'var(--text)', fontSize: 15, fontWeight: 600 },
  turno: { color: 'var(--text-sub)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 },
  statsRow: { display: 'flex', gap: 10, marginTop: 4 },
  statBox: { flex: 1, background: 'var(--bg3)', borderRadius: 10, padding: 12, textAlign: 'center' },
  statLabel: { color: 'var(--text-sub)', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  statVal: { color: 'var(--text)', fontSize: 17, fontWeight: 500 },
  statValGold: { color: 'var(--gold)', fontSize: 17, fontWeight: 500 },
  turnoLabel: { color: 'var(--gold)', fontSize: 18, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12, marginTop: 10, paddingBottom: 8, borderBottom: '1px solid var(--border)' },
  label: { color: 'var(--text-sub)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6, display: 'block' },
  input: { width: '100%', background: 'var(--bg)', border: 'none', borderRadius: 10, boxShadow: 'var(--shadow-in)', color: 'var(--gold)', padding: '10px 12px', fontSize: 13, outline: 'none', marginBottom: 14, boxSizing: 'border-box' },
  select: { width: '100%', background: 'var(--bg)', border: 'none', borderRadius: 10, boxShadow: 'var(--shadow-in)', color: 'var(--gold)', padding: '10px 12px', fontSize: 13, outline: 'none', marginBottom: 14, boxSizing: 'border-box' },
  btnRow: { display: 'flex', gap: 10 },
  btnGuardar: { flex: 1, background: 'var(--bg)', border: 'none', borderRadius: 10, boxShadow: 'var(--shadow-out)', color: 'var(--gold)', padding: '10px', fontSize: 13, letterSpacing: 1, cursor: 'pointer' },
  btnCancelar: { background: 'transparent', border: 'none', color: 'var(--text-sub)', padding: '10px', fontSize: 13, cursor: 'pointer' },
};

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

export default function ResumenMonitores() {
  const [cierres, setCierres] = useState([]);
  const [monitoresDB, setMonitoresDB] = useState([]);
  const [editando, setEditando] = useState(null);
  const [formEdit, setFormEdit] = useState({ nombre: '', turno: '', clave: '' });
  const [guardando, setGuardando] = useState(false);
  const quincena = getQuincena();

  useEffect(() => {
    const unsub1 = onSnapshot(collection(db, 'cierres'), snap => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      setCierres(data);
    });
    const unsub2 = onSnapshot(collection(db, 'monitores'), snap => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      setMonitoresDB(data);
    });
    return () => { unsub1(); unsub2(); };
  }, []);

  const iniciarEdicion = (nombreMonitor) => {
    const monitorDB = monitoresDB.find(m => m.nombre === nombreMonitor);
    setEditando(nombreMonitor);
    setFormEdit({
      nombre: monitorDB?.nombre || nombreMonitor,
      turno: monitorDB?.turno || TURNOS[nombreMonitor] || '',
      clave: ''
    });
  };

  const guardarEdicion = async () => {
    if (!formEdit.nombre || !formEdit.turno) return;
    const monitorDB = monitoresDB.find(m => m.nombre === editando);
    if (!monitorDB) return;
    setGuardando(true);
    try {
      const guardarUsuario = httpsCallable(functions, 'guardarUsuario');
      await guardarUsuario({
        coleccion: 'monitores',
        id: monitorDB.id,
        clave: formEdit.clave || '',
        datos: {
          nombre: formEdit.nombre,
          turno: formEdit.turno,
          modelas: monitorDB.modelas || []
        }
      });
      setEditando(null);
      setFormEdit({ nombre: '', turno: '', clave: '' });
    } catch (err) {
      console.error('Error guardando monitor:', err);
    }
    setGuardando(false);
  };

  const calcularMonitor = (nombreMonitor) => {
    const susModelos = MONITORES[nombreMonitor] || [];
    let totalTokens = 0;

    cierres.forEach(cierre => {
      const fecha = cierre.fecha?.split('T')[0] || '';
      if (fecha < quincena.inicio || fecha > quincena.fin) return;
      if (!cierre.modelos) return;
      cierre.modelos.forEach(m => {
        if (susModelos.includes(m.nombre)) {
          PLATAFORMAS.forEach(p => {
            totalTokens += Number(m[p + '_tokens'] || 0);
          });
        }
      });
    });

    const totalUsd = (totalTokens / 20).toFixed(2);
    return { numModelos: susModelos.length, totalTokens, totalUsd };
  };

  return (
    <div style={s.wrap}>
      {TURNOS_LISTA.map(turnoActual => {
        const monitoresTurno = Object.keys(MONITORES).filter(m => TURNOS[m] === turnoActual);
        if (monitoresTurno.length === 0) return null;
        return (
          <div key={turnoActual} style={{ marginBottom: 8 }}>
            <div style={{ ...s.turnoLabel, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>{TURNO_EMOJI[turnoActual]}</span>
              <span>Turno {turnoActual}</span>
            </div>
            <div className="nm-grid-cards">
            {monitoresTurno.map(monitor => {
              const datos = calcularMonitor(monitor);
              const turno = TURNOS[monitor];
              return (
                <div key={monitor} style={s.card}>
                  {editando === monitor ? (
                    <div className="nm-form-inline">
                      <label style={s.label}>Nombre del monitor</label>
                      <input style={s.input} placeholder="Nombre" value={formEdit.nombre} onChange={e => setFormEdit(prev => ({ ...prev, nombre: e.target.value }))} />
                      <label style={s.label}>Turno</label>
                      <select style={s.select} value={formEdit.turno} onChange={e => setFormEdit(prev => ({ ...prev, turno: e.target.value }))}>
                        <option value="">Seleccionar turno</option>
                        {TURNOS_LISTA.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <label style={s.label}>Clave de acceso (dejar vacío para no cambiar)</label>
                      <input style={s.input} placeholder="Clave" type="password" value={formEdit.clave} onChange={e => setFormEdit(prev => ({ ...prev, clave: e.target.value }))} />
                      <div style={s.btnRow}>
                        <button style={s.btnGuardar} onClick={guardarEdicion} disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar'}</button>
                        <button style={s.btnCancelar} onClick={() => setEditando(null)}>Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={s.header}>
                        <div style={s.nombreRow}>
                          <div style={s.icono}><i className={`ti ti-${ICONO_TURNO[turno] || 'user'}`} aria-hidden="true"></i></div>
                          <div>
                            <div style={s.nombre}>{monitor}</div>
                            <div style={s.turno}>Turno {turno}</div>
                          </div>
                        </div>
                      </div>
                      <div style={s.statsRow}>
                        <div style={s.statBox}>
                          <div style={s.statLabel}>Modelos</div>
                          <div style={s.statVal}>{datos.numModelos}</div>
                        </div>
                        <div style={s.statBox}>
                          <div style={s.statLabel}>Tokens</div>
                          <div style={s.statVal}>{datos.totalTokens.toLocaleString()}</div>
                        </div>
                        <div style={s.statBox}>
                          <div style={s.statLabel}>Facturación</div>
                          <div style={s.statValGold}>${datos.totalUsd}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                        <button style={{ flex: 1, background: 'var(--bg)', border: 'none', borderRadius: 8, boxShadow: 'var(--shadow-out)', color: 'var(--gold)', padding: '7px 14px', fontSize: 12, cursor: 'pointer', letterSpacing: 1 }}
                          onClick={() => iniciarEdicion(monitor)}>
                          Editar
                        </button>
                        <button style={{ background: 'var(--bg)', border: 'none', borderRadius: 8, boxShadow: 'var(--shadow-out)', color: '#d85a30', padding: '7px 14px', fontSize: 12, cursor: 'pointer' }}
                          onClick={() => document.dispatchEvent(new CustomEvent('eliminarMonitor', { detail: monitor }))}>
                          Eliminar
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
