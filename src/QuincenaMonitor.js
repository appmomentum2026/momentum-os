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

// Tabla de bonos del turno: facturación USD acumulada (todas las modelos del monitor,
// tokens/20) → bono en COP. Es la misma tabla para todos los monitores.
const TABLA_BONOS = [
  { facturacion: 7000, bono: 500000 },
  { facturacion: 8750, bono: 900000 },
  { facturacion: 10500, bono: 1200000 },
  { facturacion: 12250, bono: 1500000 },
  { facturacion: 14000, bono: 2000000 },
  { facturacion: 15750, bono: 2500000 },
  { facturacion: 17500, bono: 3000000 },
  { facturacion: 21000, bono: 3700000 },
  { facturacion: 24500, bono: 4500000 },
  { facturacion: 30000, bono: 5500000 },
  { facturacion: 35000, bono: 6500000 },
  { facturacion: 40000, bono: 8000000 },
  { facturacion: 50000, bono: 10000000 },
];

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
  const [metaCalcIdxManual, setMetaCalcIdxManual] = useState(null);
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

  // Bono del turno: facturación = tokens de TODAS las modelos del monitor / 20
  const facturacionUsd = totalTokensTurno / 20;
  const escalonesAlcanzados = TABLA_BONOS.filter(t => facturacionUsd >= t.facturacion);
  const escalonActual = escalonesAlcanzados.length > 0 ? escalonesAlcanzados[escalonesAlcanzados.length - 1] : null;
  const siguienteEscalon = TABLA_BONOS.find(t => facturacionUsd < t.facturacion) || null;
  const usdParaSiguiente = siguienteEscalon ? siguienteEscalon.facturacion - facturacionUsd : 0;
  const gananciaExtra = siguienteEscalon ? siguienteEscalon.bono - (escalonActual?.bono || 0) : 0;
  const baseSegmento = escalonActual ? escalonActual.facturacion : 0;
  const topeSegmento = siguienteEscalon ? siguienteEscalon.facturacion : baseSegmento;
  const pctSegmento = topeSegmento > baseSegmento
    ? Math.min(100, Math.max(0, Math.round(((facturacionUsd - baseSegmento) / (topeSegmento - baseSegmento)) * 100)))
    : 100;

  // Días restantes de la quincena (para la calculadora de meta)
  const finQuincena = new Date(quincena.fin + 'T23:59:59');
  const diasRestantes = Math.max(0, Math.ceil((finQuincena - new Date()) / (1000 * 60 * 60 * 24)));
  const diasParaCalculo = Math.max(1, diasRestantes);

  // Calculadora de meta: por defecto apunta al siguiente escalón no alcanzado
  const idxDefaultCalc = siguienteEscalon ? TABLA_BONOS.indexOf(siguienteEscalon) : TABLA_BONOS.length - 1;
  const metaCalcIdx = metaCalcIdxManual !== null ? metaCalcIdxManual : idxDefaultCalc;
  const metaCalc = TABLA_BONOS[metaCalcIdx];
  const metaCalcAlcanzada = facturacionUsd >= metaCalc.facturacion;
  const usdFaltanteCalc = Math.max(0, metaCalc.facturacion - facturacionUsd);
  const tokensFaltantesCalc = Math.round(usdFaltanteCalc * 20);
  const tokensDiariosCalc = Math.ceil(tokensFaltantesCalc / diasParaCalculo);

  if (modelosDB.length === 0) {
    return <div style={s.vacio}>No tienes modelos asignadas</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      <div className="nm-card-elevated">
        <div style={{ color: 'var(--gold)', fontSize: 20, fontWeight: 700 }}>{nombreMonitor}</div>
        <div style={{ color: 'var(--text-sub)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginTop: 3 }}>Turno {turno || '—'} · {quincena.label}</div>
      </div>

      {/* Mi Bono */}
      <div className="nm-card-elevated" style={{ border: '1px solid var(--gold-dim)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14, marginBottom: 16 }}>
          <div>
            <div style={s.label}>Facturación del turno esta quincena</div>
            <div style={{ color: 'var(--gold)', fontSize: 34, fontWeight: 800, lineHeight: 1.1 }}>
              ${facturacionUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span style={{ fontSize: 15, fontWeight: 400, color: 'var(--text-sub)' }}>USD</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={s.label}>Bono actual</div>
            {escalonActual ? (
              <div style={{ color: 'var(--green)', fontSize: 24, fontWeight: 800, lineHeight: 1.1 }}>
                ${escalonActual.bono.toLocaleString()} <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-sub)' }}>COP</span>
              </div>
            ) : (
              <div style={{ color: 'var(--text-sub)', fontSize: 13, fontWeight: 600, maxWidth: 220 }}>Aún no alcanzas el primer bono</div>
            )}
          </div>
        </div>

        {siguienteEscalon ? (
          <>
            <div style={s.barraWrap}>
              <div style={{ ...s.barraFill, width: `${pctSegmento}%`, background: 'linear-gradient(90deg, var(--gold-dim), var(--gold))' }} />
            </div>
            <div style={{ textAlign: 'center', color: 'var(--text-sub)', fontSize: 12, marginTop: 10 }}>
              Te faltan <b style={{ color: 'var(--gold)' }}>${usdParaSiguiente.toLocaleString(undefined, { maximumFractionDigits: 0 })} USD</b> para el siguiente bono de{' '}
              <b style={{ color: 'var(--green)' }}>${siguienteEscalon.bono.toLocaleString()} COP</b>
              {gananciaExtra > 0 && <> (+${gananciaExtra.toLocaleString()} COP más)</>}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--green)', fontSize: 15, fontWeight: 700, marginTop: 4 }}>🏆 ¡Alcanzaste el bono máximo de la tabla!</div>
        )}
      </div>

      {/* Calculadora de meta */}
      <div className="nm-card-elevated">
        <div style={s.label}>Calculadora de meta</div>
        <select
          style={{ width: '100%', background: 'var(--bg)', border: 'none', borderRadius: 10, boxShadow: 'var(--shadow-in)', color: 'var(--gold)', padding: '10px 12px', fontSize: 13, outline: 'none', marginBottom: 16, boxSizing: 'border-box' }}
          value={metaCalcIdx}
          onChange={e => setMetaCalcIdxManual(Number(e.target.value))}
        >
          {TABLA_BONOS.map((t, i) => (
            <option key={i} value={i}>${t.facturacion.toLocaleString()} USD → ${t.bono.toLocaleString()} COP</option>
          ))}
        </select>

        {metaCalcAlcanzada ? (
          <div style={{ textAlign: 'center', color: 'var(--green)', fontSize: 16, fontWeight: 700, padding: '14px 0' }}>¡Ya alcanzaste esta meta! 🎉</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }} className="nm-form-grid2">
            <div style={{ background: 'rgba(201,146,74,0.08)', border: '1px solid var(--border2)', borderRadius: 12, padding: 14, textAlign: 'center' }}>
              <div style={{ color: 'var(--text-sub)', fontSize: 11, marginBottom: 4 }}>Te falta</div>
              <div style={{ color: 'var(--gold)', fontSize: 20, fontWeight: 800 }}>${usdFaltanteCalc.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              <div style={{ color: 'var(--text-sub)', fontSize: 11, marginTop: 2 }}>USD</div>
            </div>
            <div style={{ background: 'rgba(201,146,74,0.08)', border: '1px solid var(--border2)', borderRadius: 12, padding: 14, textAlign: 'center' }}>
              <div style={{ color: 'var(--text-sub)', fontSize: 11, marginBottom: 4 }}>En tokens</div>
              <div style={{ color: 'var(--gold)', fontSize: 20, fontWeight: 800 }}>{tokensFaltantesCalc.toLocaleString()}</div>
              <div style={{ color: 'var(--text-sub)', fontSize: 11, marginTop: 2 }}>tokens</div>
            </div>
            <div style={{ background: 'rgba(201,146,74,0.08)', border: '1px solid var(--border2)', borderRadius: 12, padding: 14, textAlign: 'center' }}>
              <div style={{ color: 'var(--text-sub)', fontSize: 11, marginBottom: 4 }}>Por día (todo el turno)</div>
              <div style={{ color: 'var(--gold)', fontSize: 20, fontWeight: 800 }}>{tokensDiariosCalc.toLocaleString()}</div>
              <div style={{ color: 'var(--text-sub)', fontSize: 11, marginTop: 2 }}>tokens/día</div>
            </div>
            <div style={{ background: 'rgba(201,146,74,0.08)', border: '1px solid var(--border2)', borderRadius: 12, padding: 14, textAlign: 'center' }}>
              <div style={{ color: 'var(--text)', fontSize: 20, fontWeight: 800 }}>{diasRestantes}</div>
              <div style={{ color: 'var(--text-sub)', fontSize: 11, marginTop: 2 }}>días restantes de la quincena</div>
            </div>
          </div>
        )}
      </div>

      {/* Tabla de bonos completa */}
      <div className="nm-card-elevated">
        <div style={s.label}>Tabla de bonos del turno</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {TABLA_BONOS.map((t, i) => {
            const alcanzado = facturacionUsd >= t.facturacion;
            const esActual = escalonActual === t;
            return (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', borderRadius: 10,
                background: esActual ? 'rgba(201,146,74,0.14)' : alcanzado ? 'rgba(76,175,125,0.08)' : 'var(--bg)',
                border: esActual ? '1px solid var(--gold)' : alcanzado ? '1px solid rgba(76,175,125,0.3)' : '1px solid var(--border2)',
              }}>
                <span style={{ color: esActual ? 'var(--gold)' : alcanzado ? 'var(--green)' : 'var(--text-sub)', fontSize: 13, fontWeight: esActual ? 700 : 500 }}>
                  {esActual ? '★ ' : alcanzado ? '✓ ' : ''}${t.facturacion.toLocaleString()} USD
                </span>
                <span style={{ color: esActual ? 'var(--gold)' : alcanzado ? 'var(--green)' : 'var(--text)', fontSize: 13, fontWeight: 700 }}>
                  ${t.bono.toLocaleString()} COP
                </span>
              </div>
            );
          })}
        </div>
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
