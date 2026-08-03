import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot } from 'firebase/firestore';

function getQuincena() {
  const hoy = new Date();
  const dia = hoy.getDate();
  const mes = hoy.getMonth();
  const anio = hoy.getFullYear();
  const mesNombre = hoy.toLocaleString('es-CO', { month: 'long' });
  if (dia <= 15) {
    return { inicio: new Date(anio, mes, 1).toISOString().split('T')[0], fin: new Date(anio, mes, 15).toISOString().split('T')[0], label: `1 - 15 de ${mesNombre}` };
  }
  const ultimoDia = new Date(anio, mes + 1, 0).getDate();
  return { inicio: new Date(anio, mes, 16).toISOString().split('T')[0], fin: new Date(anio, mes, ultimoDia).toISOString().split('T')[0], label: `16 - ${ultimoDia} de ${mesNombre}` };
}

function tokensEnRango(cierres, nombreModelo, inicio, fin) {
  let total = 0;
  cierres.forEach(cierre => {
    const fechaCierre = cierre.fecha?.split('T')[0] || '';
    if (fechaCierre < inicio || fechaCierre > fin) return;
    if (!cierre.modelos) return;
    const modelaData = cierre.modelos.find(m => m.nombre === nombreModelo);
    if (!modelaData) return;
    ['Stripchat', 'Camsoda', 'Chaturbate', 'Streamate'].forEach(p => {
      total += Number(modelaData[p + '_tokens'] || 0);
    });
  });
  return total;
}

function obtenerMetaUsd(metaDoc) {
  if (!metaDoc) return 0;
  if (metaDoc.usd !== undefined) return Number(metaDoc.usd) || 0;
  if (metaDoc.tokens !== undefined) return (Number(metaDoc.tokens) || 0) / 20;
  return 0;
}

// Igual criterio que Metas.js: verde si va bien, rojo si va atrasada, dorado si va normal
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

const s = {
  label: { color: 'var(--text-sub)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  kpiVal: { color: 'var(--text)', fontSize: 26, fontWeight: 700 },
  modeloCardLayout: { display: 'flex', flexDirection: 'column', gap: 8 },
  barraWrap: { background: 'var(--bg)', boxShadow: 'var(--shadow-in)', borderRadius: 20, height: 8, overflow: 'hidden' },
  barraFill: { height: '100%', borderRadius: 20, transition: 'width 0.4s' },
  vacio: { color: 'var(--text-dim)', textAlign: 'center', padding: 40, fontSize: 13 },
};

export default function QuincenaMonitor({ nombreMonitor, turno }) {
  const [modelosDB, setModelosDB] = useState([]);
  const [cierres, setCierres] = useState([]);
  const [metas, setMetas] = useState({});
  const quincena = getQuincena();

  useEffect(() => {
    const unsub1 = onSnapshot(collection(db, 'modelos'), snap => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      data.sort((a, b) => (parseInt(a.habitacion) || 99) - (parseInt(b.habitacion) || 99));
      setModelosDB(data.filter(m => m.activa !== false && m.monitor === nombreMonitor));
    });
    const unsub2 = onSnapshot(collection(db, 'cierres'), snap => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      setCierres(data);
    });
    const unsub3 = onSnapshot(collection(db, 'metas'), snap => {
      const data = {};
      snap.forEach(d => { data[d.id] = d.data(); });
      setMetas(data);
    });
    return () => { unsub1(); unsub2(); unsub3(); };
  }, [nombreMonitor]);

  const modelosConDatos = modelosDB.map(m => {
    const total = tokensEnRango(cierres, m.nombreReal, quincena.inicio, quincena.fin);
    const metaUsd = obtenerMetaUsd(metas[m.nombreReal]);
    const metaTokens = metaUsd * 20;
    const pct = metaTokens > 0 ? Math.min(100, Math.round((total / metaTokens) * 100)) : 0;
    return { ...m, total, metaUsd, metaTokens, pct };
  });

  const totalTokensTurno = modelosConDatos.reduce((acc, m) => acc + m.total, 0);
  const conMeta = modelosConDatos.filter(m => m.metaTokens > 0);
  const cumplieron = conMeta.filter(m => m.total >= m.metaTokens).length;
  const atrasadas = conMeta.filter(m => m.total < m.metaTokens && colorProgreso(m.pct, quincena) === 'var(--red)').length;
  const enProgreso = conMeta.length - cumplieron - atrasadas;

  if (modelosDB.length === 0) {
    return <div style={s.vacio}>No tienes modelos asignadas</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      <div className="nm-card-elevated">
        <div style={{ color: 'var(--gold)', fontSize: 20, fontWeight: 700 }}>{nombreMonitor}</div>
        <div style={{ color: 'var(--text-sub)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginTop: 3 }}>Turno {turno || '—'} · {quincena.label}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }} className="nm-grid-cards">
        <div className="nm-card-elevated">
          <div style={s.label}>Modelos asignadas</div>
          <div style={s.kpiVal}>{modelosDB.length}</div>
        </div>
        <div className="nm-card-elevated">
          <div style={s.label}>Tokens del turno</div>
          <div style={s.kpiVal}>{totalTokensTurno.toLocaleString()}</div>
          <div style={{ color: 'var(--text-sub)', fontSize: 12, marginTop: 2 }}>${(totalTokensTurno / 20).toFixed(2)} USD</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }} className="nm-grid-cards">
        <div className="nm-card-elevated">
          <div style={s.label}>Cumplieron meta</div>
          <div style={{ ...s.kpiVal, color: 'var(--green)' }}>{cumplieron}/{modelosDB.length}</div>
        </div>
        <div className="nm-card-elevated">
          <div style={s.label}>En progreso</div>
          <div style={{ ...s.kpiVal, color: 'var(--gold)' }}>{enProgreso}</div>
        </div>
        <div className="nm-card-elevated">
          <div style={s.label}>Atrasadas</div>
          <div style={{ ...s.kpiVal, color: 'var(--red)' }}>{atrasadas}</div>
        </div>
      </div>

      <div>
        <div style={{ color: 'var(--gold)', fontSize: 14, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Mis modelos</div>
        <div className="nm-grid-cards">
          {modelosConDatos.map(m => {
            const color = colorProgreso(m.pct, quincena);
            return (
              <div key={m.id} className="nm-card-elevated" style={s.modeloCardLayout}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 20, background: 'var(--bg3)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', fontSize: 16, flexShrink: 0, overflow: 'hidden' }}>
                    {m.fotoURL ? <img src={m.fotoURL} alt={m.nombreReal} style={{ width: 40, height: 40, objectFit: 'cover' }} /> : '👤'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600 }}>{m.nombreReal}</div>
                    <div style={{ color: 'var(--text-sub)', fontSize: 11, marginTop: 2 }}>
                      {m.metaTokens > 0 ? `${m.total.toLocaleString()} / ${m.metaTokens.toLocaleString()} tokens` : `${m.total.toLocaleString()} tokens · sin meta`}
                    </div>
                  </div>
                  {m.metaTokens > 0 && <span style={{ color, fontSize: 12, fontWeight: 700 }}>{m.pct}%</span>}
                </div>
                <div style={s.barraWrap}>
                  <div style={{ ...s.barraFill, width: `${m.metaTokens > 0 ? m.pct : 0}%`, background: color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
