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
  card: {},
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
  rankingTit: { color: 'var(--gold)', fontSize: 15, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 },
  rankingRow: { display: 'flex', alignItems: 'center', gap: 14, padding: '13px 14px', borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border2)', marginBottom: 8 },
  rankingRowTop: { background: 'rgba(201,146,74,0.12)', border: '1px solid var(--gold)' },
  rankingPos: { width: 30, fontSize: 19, textAlign: 'center', flexShrink: 0, fontWeight: 700, color: 'var(--text-sub)' },
  rankingNombre: { color: 'var(--text)', fontSize: 14, fontWeight: 700 },
  rankingSub: { color: 'var(--text-sub)', fontSize: 11, marginTop: 2, letterSpacing: 0.5 },
  rankingStats: { display: 'flex', gap: 18, marginLeft: 'auto', flexShrink: 0 },
  rankingStatCol: { textAlign: 'right' },
  rankingStatVal: { color: 'var(--gold)', fontSize: 14, fontWeight: 700 },
  rankingStatLabel: { color: 'var(--text-sub)', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
};

const medalla = (i) => (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}°`);

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
  const [modelosDB, setModelosDB] = useState([]);
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
    const unsub3 = onSnapshot(collection(db, 'modelos'), snap => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      setModelosDB(data);
    });
    return () => { unsub1(); unsub2(); unsub3(); };
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
    const susModelos = modelosDB
      .filter(m => m.monitor === nombreMonitor && m.activa !== false)
      .map(m => m.nombreReal);
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

  // Ranking pro: monitores individuales y turnos completos, ordenados por facturación
  // (tokens totales de sus modelos) de mayor a menor.
  const monitoresRanking = Object.keys(MONITORES)
    .map(monitor => ({ monitor, turno: TURNOS[monitor], ...calcularMonitor(monitor) }))
    .sort((a, b) => b.totalTokens - a.totalTokens);

  const turnosRanking = TURNOS_LISTA
    .map(turno => {
      const monitoresTurno = monitoresRanking.filter(m => m.turno === turno);
      const totalTokens = monitoresTurno.reduce((acc, m) => acc + m.totalTokens, 0);
      const numModelos = monitoresTurno.reduce((acc, m) => acc + m.numModelos, 0);
      return { turno, totalTokens, totalUsd: (totalTokens / 20).toFixed(2), numModelos, numMonitores: monitoresTurno.length };
    })
    .filter(t => t.numMonitores > 0)
    .sort((a, b) => b.totalTokens - a.totalTokens);

  return (
    <div style={s.wrap}>
      {/* Ranking Pro */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 16, marginBottom: 32, alignItems: 'start' }} className="nm-dias-grid">
        <div className="nm-card-elevated">
          <div style={s.rankingTit}><span style={{ fontSize: 18 }}>🏆</span> Ranking de turnos</div>
          {turnosRanking.map((t, i) => (
            <div key={t.turno} style={{ ...s.rankingRow, ...(i === 0 ? s.rankingRowTop : {}) }}>
              <div style={s.rankingPos}>{medalla(i)}</div>
              <div style={{ minWidth: 0 }}>
                <div style={s.rankingNombre}>{TURNO_EMOJI[t.turno]} Turno {t.turno}</div>
                <div style={s.rankingSub}>{t.numMonitores} monitor{t.numMonitores !== 1 ? 'es' : ''} · {t.numModelos} modelos</div>
              </div>
              <div style={s.rankingStats}>
                <div style={s.rankingStatCol}>
                  <div style={s.rankingStatVal}>{t.totalTokens.toLocaleString()}</div>
                  <div style={s.rankingStatLabel}>Tokens</div>
                </div>
                <div style={s.rankingStatCol}>
                  <div style={{ ...s.rankingStatVal, color: 'var(--green)' }}>${t.totalUsd}</div>
                  <div style={s.rankingStatLabel}>USD</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="nm-card-elevated">
          <div style={s.rankingTit}><span style={{ fontSize: 18 }}>🏆</span> Ranking de monitores</div>
          {monitoresRanking.map((m, i) => (
            <div key={m.monitor} style={{ ...s.rankingRow, ...(i === 0 ? s.rankingRowTop : {}) }}>
              <div style={s.rankingPos}>{medalla(i)}</div>
              <div style={{ minWidth: 0 }}>
                <div style={s.rankingNombre}>{m.monitor}</div>
                <div style={s.rankingSub}>{TURNO_EMOJI[m.turno]} Turno {m.turno} · {m.numModelos} modelos</div>
              </div>
              <div style={s.rankingStats}>
                <div style={s.rankingStatCol}>
                  <div style={s.rankingStatVal}>{m.totalTokens.toLocaleString()}</div>
                  <div style={s.rankingStatLabel}>Tokens</div>
                </div>
                <div style={s.rankingStatCol}>
                  <div style={{ ...s.rankingStatVal, color: 'var(--green)' }}>${m.totalUsd}</div>
                  <div style={s.rankingStatLabel}>USD</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

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
                <div key={monitor} style={s.card} className="nm-card-elevated">
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
