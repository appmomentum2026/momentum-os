import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';



const s = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 12 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  fila: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  nombre: { color: 'var(--text)', fontSize: 13, flex: 1 },
  input: { background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--gold)', padding: '8px 12px', fontSize: 13, width: 120, outline: 'none', textAlign: 'right' },
  btnGuardar: { background: 'var(--gold)', border: 'none', borderRadius: 8, color: '#141414', padding: '8px 14px', fontSize: 12, letterSpacing: 1, cursor: 'pointer', fontWeight: 500 },
  metaActual: { color: 'var(--text-dim)', fontSize: 12, marginTop: 6 },
  bigCard: {},
  label: { color: 'var(--text-sub)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
  bigVal: { color: 'var(--gold)', fontSize: 32, fontWeight: 500, marginBottom: 4 },
  titulo: { color: 'var(--gold)', fontSize: 14, fontWeight: 500, marginBottom: 14 },
  statFila: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' },
  statLabel: { color: 'var(--text-sub)', fontSize: 13 },
  statVal: { color: 'var(--text)', fontSize: 13 },
  barraWrap: { background: 'var(--bg)', boxShadow: 'var(--shadow-in)', borderRadius: 20, height: 8, marginTop: 12, overflow: 'hidden' },
  barraFill: { height: '100%', borderRadius: 20, transition: 'width 0.5s' },
  badge: { padding: '4px 12px', borderRadius: 20, fontSize: 12, letterSpacing: 1 },
  motivacion: { background: 'rgba(76,175,125,0.1)', border: '1px solid rgba(76,175,125,0.2)', borderRadius: 12, padding: 14, color: '#4CAF7D', fontSize: 13, lineHeight: 1.5 },
  turnoLabel: { color: 'var(--gold)', fontSize: 15, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, marginTop: 8, paddingBottom: 6, borderBottom: '1px solid var(--border)' },
  compRow: { display: 'flex', gap: 10 },
  compBox: { flex: 1, background: 'var(--bg3)', borderRadius: 10, padding: 14, textAlign: 'center' },
  compLabel: { color: 'var(--text-sub)', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  compVal: { color: 'var(--text)', fontSize: 18, fontWeight: 500 },
  proyeccionBox: { background: 'rgba(201,146,74,0.08)', border: '1px solid rgba(201,146,74,0.2)', borderRadius: 12, padding: 16, textAlign: 'center' },
};

function getQuincena(offset = 0) {
  // offset 0 = quincena actual, -1 = quincena anterior
  const hoy = new Date();
  let dia = hoy.getDate();
  let mes = hoy.getMonth();
  let anio = hoy.getFullYear();

  // Determinar si estamos en primera (1-15) o segunda (16-fin) quincena
  let esPrimera = dia <= 15;

  // Aplicar offset
  let totalQuincenas = (esPrimera ? 0 : 1) + offset;
  while (totalQuincenas < 0) {
    mes -= 1;
    if (mes < 0) { mes = 11; anio -= 1; }
    totalQuincenas += 2;
  }
  while (totalQuincenas > 1) {
    mes += 1;
    if (mes > 11) { mes = 0; anio += 1; }
    totalQuincenas -= 2;
  }

  if (totalQuincenas === 0) {
    return {
      inicio: new Date(anio, mes, 1).toISOString().split('T')[0],
      fin: new Date(anio, mes, 15).toISOString().split('T')[0],
    };
  } else {
    const ultimoDia = new Date(anio, mes + 1, 0).getDate();
    return {
      inicio: new Date(anio, mes, 16).toISOString().split('T')[0],
      fin: new Date(anio, mes, ultimoDia).toISOString().split('T')[0],
    };
  }
}

function tokensEnRango(cierres, nombreModelo, inicio, fin) {
  let total = 0;
  const porDia = {};
  cierres.forEach(cierre => {
    const fechaCierre = cierre.fecha?.split('T')[0] || '';
    if (fechaCierre < inicio || fechaCierre > fin) return;
    if (!cierre.modelos) return;
    const modelaData = cierre.modelos.find(m => m.nombre === nombreModelo);
    if (!modelaData) return;
    let tokensDelDia = 0;
    ['Stripchat', 'Camsoda', 'Chaturbate', 'Streamate'].forEach(p => {
      tokensDelDia += Number(modelaData[p + '_tokens'] || 0);
    });
    total += tokensDelDia;
    porDia[fechaCierre] = (porDia[fechaCierre] || 0) + tokensDelDia;
  });
  return { total, porDia };
}

// La meta se guarda como { usd: N }. Si el doc es de antes del cambio a USD, trae { tokens: N } —
// se reinterpreta como usd = tokens/20 para no perder metas ya asignadas.
function obtenerMetaUsd(metaDoc) {
  if (!metaDoc) return 0;
  if (metaDoc.usd !== undefined) return Number(metaDoc.usd) || 0;
  if (metaDoc.tokens !== undefined) return (Number(metaDoc.tokens) || 0) / 20;
  return 0;
}

// Color de la barra de progreso segun avance vs. tiempo transcurrido de la quincena
function colorProgreso(pct, quincena) {
  if (pct >= 100) return 'var(--green)';
  const inicio = new Date(quincena.inicio);
  const fin = new Date(quincena.fin);
  const totalMs = fin - inicio;
  const fraccionTranscurrida = totalMs > 0 ? Math.min(1, Math.max(0, (new Date() - inicio) / totalMs)) : 0;
  if (fraccionTranscurrida < 0.5 && pct > 50) return 'var(--green)';
  if (fraccionTranscurrida > 0.5 && pct < 30) return 'var(--red)';
  return 'var(--gold)';
}

function ProyeccionModelo({ nombreModelo, metaUsd }) {
  const [cierres, setCierres] = useState([]);
  const [asistencia, setAsistencia] = useState({});
  const quincena = getQuincena(0);
  const quincenaAnterior = getQuincena(-1);
  const metaTokens = metaUsd * 20;

  useEffect(() => {
    const unsub1 = onSnapshot(collection(db, 'cierres'), snap => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      setCierres(data);
    });
    const unsub2 = onSnapshot(collection(db, 'asistencia'), snap => {
      const data = {};
      snap.forEach(d => { data[d.id] = d.data(); });
      setAsistencia(data);
    });
    return () => { unsub1(); unsub2(); };
  }, []);

  const actual = tokensEnRango(cierres, nombreModelo, quincena.inicio, quincena.fin);
  const anterior = tokensEnRango(cierres, nombreModelo, quincenaAnterior.inicio, quincenaAnterior.fin);

  const totalTokens = actual.total;
  const tokensPorDia = actual.porDia;

  let mejorDia = { fecha: '', tokens: 0 };
  Object.entries(tokensPorDia).forEach(([fecha, tokens]) => {
    if (tokens > mejorDia.tokens) mejorDia = { fecha, tokens };
  });

  const diasTrabajados = Object.values(asistencia).filter(a =>
    a.modelo === nombreModelo && a.presente === true &&
    a.fecha >= quincena.inicio && a.fecha <= quincena.fin
  ).length;

  const hoy = new Date();
  const finQuincena = new Date(quincena.fin);
  const diasRestantes = Math.max(1, Math.ceil((finQuincena - hoy) / (1000 * 60 * 60 * 24)));
  const cumplimiento = metaTokens > 0 ? Math.min(100, Math.round((totalTokens / metaTokens) * 100)) : 0;
  const colorBarra = colorProgreso(cumplimiento, quincena);
  const tokensNecesarios = Math.max(0, metaTokens - totalTokens);
  const porDia = diasRestantes > 0 ? Math.ceil(tokensNecesarios / diasRestantes) : 0;
  const promedioDiario = diasTrabajados > 0 ? Math.round(totalTokens / diasTrabajados) : 0;
  const diasOrdenados = Object.entries(tokensPorDia).sort(([a], [b]) => a.localeCompare(b)).slice(-10);
  const maxTokens = Math.max(...diasOrdenados.map(([, v]) => v), 1);

  // Proyección: al ritmo actual, cuánto terminará haciendo
  const diasTranscurridos = Object.keys(tokensPorDia).length;
  const totalDiasQuincena = 15;
  const proyeccionFinal = diasTranscurridos > 0
    ? Math.round((totalTokens / diasTranscurridos) * totalDiasQuincena)
    : 0;

  // Comparación con quincena anterior
  
  const porcentajeCambio = anterior.total > 0
    ? Math.round(((totalTokens - anterior.total) / anterior.total) * 100)
    : null;

  const getMensaje = () => {
    if (cumplimiento >= 100) return 'Meta cumplida! Excelente quincena.';
    if (cumplimiento >= 75) return 'Vas muy bien, sigue asi!';
    if (cumplimiento >= 50) return 'Vas a mitad de camino, puedes lograrlo!';
    if (cumplimiento >= 25) return 'Aun hay tiempo, enfocate!';
    return 'Arranca fuerte, cada token cuenta!';
  };

  return (
    <div style={s.wrap}>

      <div style={s.grid2}>
        <div className="nm-card-elevated">
          <div style={s.label}>Meta esta quincena</div>
          <div style={s.bigVal}>{metaUsd > 0 ? `$${metaUsd.toLocaleString()} USD` : '—'}</div>
          {metaTokens > 0 && <div style={{ color: 'var(--text-dim)', fontSize: 12, marginTop: -2, marginBottom: 6 }}>({metaTokens.toLocaleString()} tokens)</div>}
          <div style={{ ...s.statFila, borderBottom: 'none', marginTop: 4 }}>
            <div style={{ color: 'var(--text-sub)', fontSize: 13 }}>{totalTokens.toLocaleString()} / {metaTokens > 0 ? metaTokens.toLocaleString() : '—'} tokens</div>
            <div style={{ ...s.badge, background: cumplimiento >= 100 ? 'rgba(76,175,125,0.15)' : 'rgba(201,146,74,0.15)', color: colorBarra }}>{cumplimiento}%</div>
          </div>
          <div style={s.barraWrap}>
            <div style={{ ...s.barraFill, width: `${cumplimiento}%`, background: colorBarra }}></div>
          </div>
          <div style={{ ...s.motivacion, marginTop: 12 }}>{getMensaje()}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {metaTokens > 0 && (
            <div style={s.proyeccionBox}>
              <div style={s.compLabel}>Proyección al ritmo actual</div>
              <div style={{ color: 'var(--gold)', fontSize: 26, fontWeight: 500, marginBottom: 4 }}>
                {proyeccionFinal.toLocaleString()} tokens
              </div>
              <div style={{ color: 'var(--text-sub)', fontSize: 12 }}>
                {proyeccionFinal >= metaTokens
                  ? 'Vas camino a superar tu meta!'
                  : `Te faltarían ${(metaTokens - proyeccionFinal).toLocaleString()} para la meta`}
              </div>
            </div>
          )}

          <div className="nm-card-elevated">
            <div style={s.titulo}>Mis estadisticas</div>
            <div style={s.statFila}><div style={s.statLabel}>Dias trabajados</div><div style={s.statVal}>{diasTrabajados} dias</div></div>
            <div style={s.statFila}><div style={s.statLabel}>Promedio diario</div><div style={s.statVal}>{promedioDiario.toLocaleString()} tokens</div></div>
            <div style={s.statFila}><div style={s.statLabel}>Mejor dia</div><div style={s.statVal}>{mejorDia.tokens > 0 ? mejorDia.tokens.toLocaleString() + ' tokens' : '—'}</div></div>
            <div style={s.statFila}><div style={s.statLabel}>Dias restantes</div><div style={s.statVal}>{diasRestantes} dias</div></div>
            <div style={{ ...s.statFila, borderBottom: 'none' }}>
              <div style={s.statLabel}>Necesitas por dia</div>
              <div style={{ color: tokensNecesarios <= 0 ? '#4CAF7D' : 'var(--gold)', fontSize: 16, fontWeight: 500 }}>
                {tokensNecesarios <= 0 ? 'Meta cumplida!' : porDia.toLocaleString() + ' tokens'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={s.grid2}>
        <div className="nm-card-elevated">
          <div style={s.titulo}>Comparación quincenas</div>
          <div style={s.compRow}>
            <div style={s.compBox}>
              <div style={s.compLabel}>Quincena anterior</div>
              <div style={s.compVal}>{anterior.total.toLocaleString()}</div>
            </div>
            <div style={s.compBox}>
              <div style={s.compLabel}>Esta quincena</div>
              <div style={s.compVal}>{totalTokens.toLocaleString()}</div>
            </div>
          </div>
          {porcentajeCambio !== null && (
            <div style={{ textAlign: 'center', marginTop: 12, fontSize: 14, fontWeight: 500, color: porcentajeCambio >= 0 ? '#4CAF7D' : '#C0614A' }}>
              {porcentajeCambio >= 0 ? '▲' : '▼'} {Math.abs(porcentajeCambio)}% {porcentajeCambio >= 0 ? 'más' : 'menos'} que la quincena pasada
            </div>
          )}
          {porcentajeCambio === null && (
            <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: 'var(--text-dim)' }}>
              Sin datos de la quincena anterior para comparar
            </div>
          )}
        </div>

        {diasOrdenados.length > 0 && (
          <div className="nm-card-elevated">
            <div style={s.titulo}>Tokens por dia</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 100, padding: '0 4px' }}>
              {diasOrdenados.map(([fecha, tokens]) => (
                <div key={fecha} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>{tokens.toLocaleString()}</div>
                  <div style={{
                    width: '100%',
                    height: `${Math.round((tokens / maxTokens) * 60)}px`,
                    background: tokens === mejorDia.tokens ? '#4CAF7D' : 'var(--gold)',
                    borderRadius: '4px 4px 0 0',
                    opacity: 0.85,
                    minHeight: 4
                  }}></div>
                  <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>{fecha.split('-')[2]}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

export default function Metas({ rol, nombreModelo }) {
  const [metas, setMetas] = useState({});
  const [editando, setEditando] = useState({});
  const [modelosDB, setModelosDB] = useState([]);
  const [monitoresDB, setMonitoresDB] = useState([]);
  const [filtroMonitor, setFiltroMonitor] = useState({});
  const [vistaGrid, setVistaGrid] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'metas'), snap => {
      const data = {};
      snap.forEach(d => { data[d.id] = d.data(); });
      setMetas(data);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'modelos'), snap => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      data.sort((a, b) => a.nombreReal.localeCompare(b.nombreReal));
      setModelosDB(data.filter(m => m.activa !== false));
    });
    return unsub;
  }, []);

  const [cierres, setCierres] = useState([]);
  const quincena = getQuincena(0);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'cierres'), snap => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      setCierres(data);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'monitores'), snap => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      setMonitoresDB(data);
    });
    return unsub;
  }, []);

  const guardarMeta = async (modelo, valor) => {
    if (!valor) return;
    await setDoc(doc(db, 'metas', modelo), { usd: Number(valor), actualizado: new Date().toISOString() });
    setEditando(prev => { const n = { ...prev }; delete n[modelo]; return n; });
  };

  if (rol === 'jefe') {
    const TURNO_INFO = {
      'Manana': { hora: '8am - 2pm', icono: '🌅' },
      'Tarde':  { hora: '2pm - 8pm', icono: '☀️' },
      'Noche':  { hora: '8pm - 2am', icono: '🌙' },
    };

    const renderModelo = (m) => {
      const modelo = m.nombreReal;
      const { total } = tokensEnRango(cierres, modelo, quincena.inicio, quincena.fin);
      const metaUsd = obtenerMetaUsd(metas[modelo]);
      const metaTokens = metaUsd * 20;
      const pct = metaTokens > 0 ? Math.min(100, Math.round((total / metaTokens) * 100)) : 0;
      const colorBarra = colorProgreso(pct, quincena);
      return (
        <div key={modelo} className="nm-card-elevated" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 48, height: 48, borderRadius: 24, background: 'var(--bg3)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', fontSize: 18, flexShrink: 0, overflow: 'hidden' }}>
              {m.fotoURL ? <img src={m.fotoURL} alt={modelo} style={{ width: 48, height: 48, objectFit: 'cover' }} /> : '👤'}
            </div>
            <div style={{ flex: 1, color: 'var(--text)', fontSize: 12, fontWeight: 500 }}>{modelo}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input style={{ ...s.input, width: 90, marginBottom: 0, fontSize: 12, padding: '6px 10px' }} type="number"
              placeholder={metaUsd || 'Meta USD'}
              value={editando[modelo] || ''}
              onChange={e => setEditando(prev => ({ ...prev, [modelo]: e.target.value }))} />
            <button style={{ ...s.btnGuardar, padding: '6px 12px', fontSize: 12, width: 'auto', flex: 'none' }} onClick={() => guardarMeta(modelo, editando[modelo])}>OK</button>
          </div>
          {metaTokens > 0 && (
            <>
              <div style={{ color: 'var(--text-dim)', fontSize: 10 }}>Meta: ${metaUsd.toLocaleString()} USD ({metaTokens.toLocaleString()} tokens)</div>
              <div style={s.barraWrap}>
                <div style={{ ...s.barraFill, width: `${pct}%`, background: colorBarra }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-sub)', fontSize: 11 }}>{total.toLocaleString()} / {metaTokens.toLocaleString()} tokens</span>
                {pct >= 100
                  ? <span style={{ background: 'rgba(76,175,125,0.15)', color: 'var(--green)', fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>● Completada</span>
                  : <span style={{ color: colorBarra, fontSize: 11, fontWeight: 600 }}>{pct}%</span>
                }
              </div>
            </>
          )}
        </div>
      );
    };

    const turnoData = { 'Manana': [], 'Tarde': [], 'Noche': [] };
    modelosDB.forEach(m => { if (turnoData[m.turno]) turnoData[m.turno].push(m); });
    Object.values(turnoData).forEach(lista => lista.sort((a, b) => (parseInt(a.habitacion) || 99) - (parseInt(b.habitacion) || 99)));

    return (
      <div style={s.wrap}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 8, padding: 3 }}>
            <button style={{ background: vistaGrid ? 'var(--bg3)' : 'transparent', border: 'none', borderRadius: 6, color: vistaGrid ? 'var(--gold)' : 'var(--text-sub)', padding: '6px 10px', cursor: 'pointer', fontSize: 16 }} onClick={() => setVistaGrid(true)}>⊞</button>
            <button style={{ background: !vistaGrid ? 'var(--bg3)' : 'transparent', border: 'none', borderRadius: 6, color: !vistaGrid ? 'var(--gold)' : 'var(--text-sub)', padding: '6px 10px', cursor: 'pointer', fontSize: 16 }} onClick={() => setVistaGrid(false)}>☰</button>
          </div>
        </div>
        {['Manana', 'Tarde', 'Noche'].map(turno => {
          const modelosTurno = turnoData[turno];
          if (modelosTurno.length === 0) return null;
          const monitoresTurno = monitoresDB.filter(mon => mon.turno === turno);
          const modelosFiltrados = filtroMonitor[turno]
            ? modelosTurno.filter(m => m.monitor === filtroMonitor[turno])
            : modelosTurno;
          const info = TURNO_INFO[turno] || {};
          const totalTokensTurno = modelosFiltrados.reduce((acc, m) => acc + (tokensEnRango(cierres, m.nombreReal, quincena.inicio, quincena.fin).total), 0);
          const totalMetaTurno = modelosFiltrados.reduce((acc, m) => acc + (obtenerMetaUsd(metas[m.nombreReal]) * 20), 0);
          return (
            <div key={turno} style={{ marginBottom: 20 }}>
              <div className="nm-card-elevated" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 18 }}>{info.icono}</span>
                <div style={{ color: 'var(--gold)', fontSize: 14, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Turno {turno}</div>
                <div style={{ color: 'var(--text-sub)', fontSize: 11 }}>({info.hora})</div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ color: 'var(--text-sub)', fontSize: 11 }}>👥 {modelosFiltrados.length} modelos</span>
                  <span style={{ color: 'var(--gold)', fontSize: 11, fontWeight: 500 }}>🪙 {totalTokensTurno.toLocaleString()}{totalMetaTurno > 0 ? ` / ${totalMetaTurno.toLocaleString()}` : ''} tokens</span>
                </div>
              </div>
              {monitoresTurno.length > 0 && (
                <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                  <button
                    style={{ background: !filtroMonitor[turno] ? 'var(--gold)' : 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 20, color: !filtroMonitor[turno] ? '#141414' : 'var(--text-sub)', fontSize: 11, padding: '5px 14px', cursor: 'pointer', fontWeight: !filtroMonitor[turno] ? 700 : 400 }}
                    onClick={() => setFiltroMonitor(prev => ({ ...prev, [turno]: null }))}>
                    Todos los monitores
                  </button>
                  {monitoresTurno.map(mon => (
                    <button key={mon.nombre}
                      style={{ background: filtroMonitor[turno] === mon.nombre ? 'var(--gold)' : 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 20, color: filtroMonitor[turno] === mon.nombre ? '#141414' : 'var(--text-sub)', fontSize: 11, padding: '5px 14px', cursor: 'pointer', fontWeight: filtroMonitor[turno] === mon.nombre ? 700 : 400 }}
                      onClick={() => setFiltroMonitor(prev => ({ ...prev, [turno]: mon.nombre }))}>
                      {mon.nombre}
                    </button>
                  ))}
                </div>
              )}
              <div className={vistaGrid ? 'nm-grid-cards' : ''} style={!vistaGrid ? { display: 'flex', flexDirection: 'column', gap: 8 } : {}}>
                {modelosFiltrados.map(m => renderModelo(m))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const metaUsd = obtenerMetaUsd(metas[nombreModelo]);
  return <ProyeccionModelo nombreModelo={nombreModelo} metaUsd={metaUsd} />;
}