import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, doc, setDoc, updateDoc, onSnapshot, orderBy, query } from 'firebase/firestore';

const PLATAFORMAS = ['Stripchat', 'Camsoda', 'Chaturbate', 'Streamate'];

const PLAT_DOMINIO = {
  'Stripchat': 'stripchat.com',
  'Camsoda': 'camsoda.com',
  'Chaturbate': 'chaturbate.com',
  'Streamate': 'streamate.com'
};
const favicon = (plat) => `https://www.google.com/s2/favicons?domain=${PLAT_DOMINIO[plat]}&sz=32`;

const TURNOS = { 'Daniela': 'Manana', 'Ramon': 'Manana', 'Santiago': 'Tarde', 'Monica': 'Tarde', 'Juan': 'Noche', 'Cesar': 'Noche' };

const ORDEN_TURNOS = ['Manana', 'Tarde', 'Noche'];

const fechaISOLocal = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const parseFechaLocal = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const s = {
  form: { background: 'var(--bg2)', borderRadius: 14, padding: 20, marginBottom: 14, border: '1px solid var(--border2)' },
  label: { color: 'var(--text-sub)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6, display: 'block' },
  select: { width: '100%', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--gold)', padding: '12px 14px', fontSize: 13, outline: 'none' },
  modeloCard: { background: 'var(--bg2)', borderRadius: 12, padding: 16, marginBottom: 10, border: '1px solid var(--border2)' },
  modeloNombre: { color: 'var(--gold)', fontSize: 13, fontWeight: 500, marginBottom: 12 },
  seccion: { color: 'var(--text-dim)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8, marginTop: 12 },
  fila: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 },
  inputSmall: { background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--text)', padding: '8px 10px', fontSize: 12, width: '100%', outline: 'none' },
  platLabel: { color: 'var(--text-dim)', fontSize: 11, letterSpacing: 1, marginBottom: 4 },
  btnEnviar: { background: 'var(--gold)', border: 'none', borderRadius: 10, color: '#141414', padding: '13px 24px', fontSize: 13, fontWeight: 500, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer', width: '100%', marginTop: 8 },
  vacia: { color: 'var(--text-dim)', textAlign: 'center', padding: 40, fontSize: 13 },
  banner: { background: 'var(--bg3)', borderRadius: 10, padding: '12px 16px', marginBottom: 14, border: '1px solid var(--border2)' },
  bannerNombre: { color: 'var(--gold)', fontSize: 22, fontWeight: 700 },
  bannerTurno: { color: 'var(--text-sub)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 },
  turnoCard: { background: 'var(--bg2)', borderRadius: 14, padding: 18, marginBottom: 14, border: '1px solid var(--border2)' },
  sheetRow: { display: 'flex', gap: 8, marginBottom: 12 },
  sheetBtn: { background: 'var(--bg)', border: 'none', borderRadius: 8, boxShadow: 'var(--shadow-out)', color: 'var(--text-sub)', padding: '7px 14px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 },
  sheetBtnActivo: { color: 'var(--gold)' },
  sheetCard: { background: 'var(--bg2)', borderRadius: 12, padding: '10px 14px', border: '1px solid var(--border2)', marginBottom: 14 },
  sheetTit: { color: 'var(--text-sub)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  sheetFila: { display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: 12 },
  fechaCard: { background: 'var(--bg2)', borderRadius: 14, padding: '14px 18px', marginBottom: 16, border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 },
  dateInput: { background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--gold)', padding: '10px 12px', fontSize: 13, outline: 'none', colorScheme: 'dark' },
  avisoExistente: { background: 'rgba(201,146,74,0.15)', color: 'var(--gold)', fontSize: 11, padding: '6px 12px', borderRadius: 20 },
  historial: { background: 'var(--bg2)', borderRadius: 14, padding: '16px 18px', marginTop: 16, border: '1px solid var(--border2)' },
  historialFila: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 12 },
  tabsJefe: { display: 'flex', gap: 4, marginBottom: 18, borderBottom: '1px solid var(--border)' },
  tabJefeBtn: { background: 'transparent', border: 'none', padding: '10px 18px', fontSize: 12, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-sub)', cursor: 'pointer', borderBottom: '2px solid transparent', marginBottom: -1, transition: 'color 0.15s, border-color 0.15s' },
  tabJefeBtnActivo: { color: 'var(--gold)', borderBottom: '2px solid var(--gold)' },
  quincenaBtn: { background: 'transparent', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontSize: 16, padding: '0 4px' },
  turnoLabel: { color: 'var(--gold)', fontSize: 16, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center' },
  reporteCard: { background: 'var(--bg2)', borderRadius: 12, padding: 16, border: '1px solid var(--border2)' },
  reporteFila: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12 },
  reporteLabel: { color: 'var(--text-sub)' },
  reporteValor: { color: 'var(--text)', fontWeight: 500 },
  reporteSecTit: { color: 'var(--text-dim)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginTop: 12, marginBottom: 6 },
  textarea: { width: '100%', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--text)', padding: '8px 10px', fontSize: 12, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' },
  btnGuardarReporte: { width: '100%', background: 'var(--bg)', border: 'none', borderRadius: 8, boxShadow: 'var(--shadow-out)', color: 'var(--gold)', padding: '9px', fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer', marginTop: 12 },
  turnoHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  turnoTitulo: { color: 'var(--gold)', fontSize: 16, fontWeight: 500 },
  turnoSubtotal: { textAlign: 'right' },
  turnoSubtotalTokens: { color: 'var(--text)', fontSize: 15, fontWeight: 500 },
  turnoSubtotalUsd: { color: 'var(--gold)', fontSize: 13 },
  turnoMeta: { color: 'var(--text-dim)', fontSize: 11, marginBottom: 12 },
  modelaRow: { borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 10 },
  modelaTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  modelaNombre: { color: 'var(--text)', fontSize: 13, fontWeight: 500 },
  modelaTotal: { color: 'var(--gold)', fontSize: 12 },
  platRow: { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-sub)', padding: '3px 0' },
};

function FormModelo({ nombre, datos, onChange, fotoURL }) {
  const totalTokens = PLATAFORMAS.reduce((acc, p) => acc + Number(datos[p + '_tokens'] || 0), 0);
  const totalUsd = (totalTokens / 20).toFixed(2);
  const completada = totalTokens > 0;

  return (
    <div style={s.modeloCard}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 38, height: 38, borderRadius: 19, background: 'var(--bg3)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', fontSize: 16, flexShrink: 0 }}>
          {fotoURL ? <img src={fotoURL} alt={nombre} style={{ width: 38, height: 38, borderRadius: 19, objectFit: 'cover' }} /> : '👤'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600 }}>{nombre}</div>
        </div>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: completada ? 'rgba(76,175,125,0.15)' : 'rgba(186,117,23,0.15)', color: completada ? '#4CAF7D' : '#BA7517', fontSize: 10, padding: '4px 10px', borderRadius: 20 }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: completada ? '#4CAF7D' : '#BA7517' }} />
          {completada ? 'Completada' : 'Pendiente'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-dim)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>
        <i className="ti ti-clock" /> Horarios
      </div>
      <div style={s.fila}>
        <div><div style={s.platLabel}>Inicio</div><input style={s.inputSmall} type="time" value={datos.inicio || ''} onChange={e => onChange('inicio', e.target.value)} /></div>
        <div><div style={s.platLabel}>Inicio break</div><input style={s.inputSmall} type="time" value={datos.inicioBreak || ''} onChange={e => onChange('inicioBreak', e.target.value)} /></div>
        <div><div style={s.platLabel}>Fin break</div><input style={s.inputSmall} type="time" value={datos.finBreak || ''} onChange={e => onChange('finBreak', e.target.value)} /></div>
        <div><div style={s.platLabel}>Fin transmision</div><input style={s.inputSmall} type="time" value={datos.fin || ''} onChange={e => onChange('fin', e.target.value)} /></div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-dim)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10, marginTop: 14 }}>
        <i className="ti ti-coin" /> Tokens por plataforma
      </div>
      {PLATAFORMAS.map(plat => {
        const tokens = Number(datos[plat + '_tokens'] || 0);
        const usd = (tokens / 20).toFixed(2);
        return (
          <div key={plat} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
              <img src={favicon(plat)} alt={plat} style={{ width: 16, height: 16, borderRadius: 3, flexShrink: 0 }} />
              <span style={{ color: 'var(--text)', fontSize: 12 }}>{plat}</span>
            </div>
            <div style={s.fila}>
              <input style={s.inputSmall} type="number" placeholder="Tokens" value={datos[plat + '_tokens'] || ''} onChange={e => onChange(plat + '_tokens', e.target.value)} />
              <input style={{ ...s.inputSmall, color: 'var(--gold)', background: 'var(--bg)' }} value={`$${usd}`} readOnly tabIndex={-1} />
            </div>
          </div>
        );
      })}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
        <span style={{ color: 'var(--text-sub)', fontSize: 12 }}>Total acumulado</span>
        <span style={{ color: 'var(--gold)', fontSize: 15, fontWeight: 600 }}>{totalTokens.toLocaleString()} tkns · ${totalUsd}</span>
      </div>
    </div>
  );
}

function VistaJefe({ cierres }) {
  const fechasDisponibles = [...new Set(cierres.map(c => c.dia).filter(Boolean))].sort((a, b) => b.localeCompare(a));
  const hoy = new Date().toLocaleDateString('es-CO');
  const [fechaSel, setFechaSel] = useState(fechasDisponibles.includes(hoy) ? hoy : (fechasDisponibles[0] || hoy));
  const [turnoDetalle, setTurnoDetalle] = useState(null);

  const cierresDia = cierres.filter(c => c.dia === fechaSel);

  const porTurno = { Manana: [], Tarde: [], Noche: [] };
  cierresDia.forEach(c => {
    const turno = c.turno || TURNOS[c.monitor] || '';
    if (!porTurno[turno]) return;
    (c.modelos || []).forEach(m => porTurno[turno].push({ ...m, monitor: c.monitor }));
  });

  const tokensModelo = (m) => PLATAFORMAS.reduce((acc, p) => acc + Number(m[p + '_tokens'] || 0), 0);
  const totalTokensDia = Object.values(porTurno).flat().reduce((acc, m) => acc + tokensModelo(m), 0);
  const totalModelosDia = Object.values(porTurno).flat().length;
  const promedioModelo = totalModelosDia > 0 ? Math.round(totalTokensDia / totalModelosDia) : 0;

  const TURNO_INFO = { Manana: { icono: '🌅', label: 'Turno Mañana' }, Tarde: { icono: '☀️', label: 'Turno Tarde' }, Noche: { icono: '🌙', label: 'Turno Noche' } };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      

      {/* KPIs + selector fecha */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {/* Selector fecha */}
        <div style={{ background: 'var(--bg2)', borderRadius: 14, padding: '16px 18px', border: '1px solid var(--border2)' }}>
          <div style={{ color: 'var(--text-sub)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Ver cierre del día</div>
          <select style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--gold)', padding: '10px 12px', fontSize: 13, outline: 'none' }}
            value={fechaSel} onChange={e => setFechaSel(e.target.value)}>
            {fechasDisponibles.length === 0 && <option value={hoy}>{hoy} (hoy)</option>}
            {fechasDisponibles.map(f => <option key={f} value={f}>{f}{f === hoy ? ' (hoy)' : ''}</option>)}
          </select>
        </div>

        {/* Total tokens */}
        <div style={{ background: 'var(--bg2)', borderRadius: 14, padding: '16px 18px', border: '1px solid var(--border2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 18 }}>🪙</span>
            <span style={{ color: 'var(--text-sub)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' }}>Total tokens</span>
          </div>
          <div style={{ color: 'var(--text)', fontSize: 24, fontWeight: 700 }}>{totalTokensDia.toLocaleString()}</div>
          <div style={{ color: 'var(--text-sub)', fontSize: 12, marginTop: 2 }}>${(totalTokensDia / 20).toFixed(2)} USD</div>
        </div>

        {/* Total modelos */}
        <div style={{ background: 'var(--bg2)', borderRadius: 14, padding: '16px 18px', border: '1px solid var(--border2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 18 }}>👥</span>
            <span style={{ color: 'var(--text-sub)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' }}>Total modelos</span>
          </div>
          <div style={{ color: 'var(--text)', fontSize: 24, fontWeight: 700 }}>{totalModelosDia}</div>
          <div style={{ color: 'var(--text-sub)', fontSize: 12, marginTop: 2 }}>Activos en el día</div>
        </div>

        {/* Promedio por modelo */}
        <div className="nm-hide-mobile" style={{ background: 'var(--bg2)', borderRadius: 14, padding: '16px 18px', border: '1px solid var(--border2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 18 }}>📊</span>
            <span style={{ color: 'var(--text-sub)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' }}>Promedio por modelo</span>
          </div>
          <div style={{ color: 'var(--gold)', fontSize: 24, fontWeight: 700 }}>{promedioModelo.toLocaleString()}</div>
          <div style={{ color: 'var(--text-sub)', fontSize: 12, marginTop: 2 }}>tokens</div>
        </div>
      </div>

      {cierresDia.length === 0 && <p style={{ color: 'var(--text-dim)', textAlign: 'center', padding: 40, fontSize: 13 }}>No hay cierres registrados este día</p>}

      {/* Tarjetas por turno */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }} className="nm-cierres-grid">
        {ORDEN_TURNOS.map(turno => {
          const modelos = porTurno[turno];
          if (!modelos || modelos.length === 0) return null;
          const info = TURNO_INFO[turno];
          const subtotalTokens = modelos.reduce((acc, m) => acc + tokensModelo(m), 0);
          const subtotalUsd = (subtotalTokens / 20).toFixed(2);
          const abierto = turnoDetalle === turno;

          return (
            <div key={turno} style={{ background: 'var(--bg2)', borderRadius: 16, border: '1px solid var(--border2)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {/* Header turno */}
              <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{info.icono}</span>
                    <span style={{ color: 'var(--gold)', fontSize: 15, fontWeight: 700, textTransform: 'uppercase' }}>{info.label}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--text)', fontSize: 14, fontWeight: 600 }}>{subtotalTokens.toLocaleString()} tokens</div>
                    <div style={{ color: 'var(--gold)', fontSize: 12 }}>${subtotalUsd} USD</div>
                  </div>
                </div>
                <div style={{ color: 'var(--text-sub)', fontSize: 11, marginTop: 6 }}>{modelos.length} modelos · {fechaSel}</div>
              </div>

              {/* Lista modelos */}
              <div style={{ flex: 1, padding: '8px 0' }}>
                {modelos.map((m, i) => {
                  const tot = tokensModelo(m);
                  const platsActivas = PLATAFORMAS.filter(p => m[p + '_tokens'] || m[p + '_usd']);
                  return (
                    <div key={m.nombre + i} style={{ padding: '10px 18px', borderBottom: i < modelos.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: platsActivas.length > 0 ? 6 : 0 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 16, background: 'var(--bg3)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>👤</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: 'var(--text)', fontSize: 12, fontWeight: 500 }}>{m.nombre}</div>
                          {platsActivas.length > 0 && <div style={{ color: 'var(--text-sub)', fontSize: 10 }}>{platsActivas[0]}</div>}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ color: 'var(--gold)', fontSize: 12, fontWeight: 600 }}>{tot.toLocaleString()} tkns</div>
                          <div style={{ color: 'var(--text-sub)', fontSize: 11 }}>${(tot / 20).toFixed(2)}</div>
                        </div>
                      </div>
                      {platsActivas.length > 1 && platsActivas.slice(1).map(p => (
                        <div key={p} style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 42, fontSize: 11, color: 'var(--text-sub)', marginTop: 3 }}>
                          <span>{p}</span>
                          <span style={{ color: 'var(--gold)' }}>{Number(m[p + '_tokens'] || 0).toLocaleString()} tkns</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>

              {/* Ver detalle */}
              <button style={{ background: 'var(--bg3)', border: 'none', borderTop: '1px solid var(--border)', color: 'var(--text)', padding: '14px 18px', fontSize: 12, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}
                onClick={() => setTurnoDetalle(abierto ? null : turno)}>
                <span>{abierto ? 'Ocultar detalle' : 'Ver detalle del turno'}</span>
                <span style={{ color: 'var(--gold)' }}>{abierto ? '↑' : '→'}</span>
              </button>

              {/* Detalle expandible */}
              {abierto && (
                <div style={{ background: 'var(--bg3)', padding: '14px 18px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ color: 'var(--text-sub)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Detalle del turno</div>
                  {modelos.map((m, i) => {
                    const tot = tokensModelo(m);
                    return (
                      <div key={m.nombre + i} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: i < modelos.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ color: 'var(--text)', fontSize: 12, fontWeight: 600 }}>{m.nombre}</span>
                          <span style={{ color: 'var(--gold)', fontSize: 12, fontWeight: 600 }}>{tot.toLocaleString()} tkns · ${(tot / 20).toFixed(2)}</span>
                        </div>
                        {m.inicio && <div style={{ color: 'var(--text-sub)', fontSize: 11, marginBottom: 4 }}>⏰ {m.inicio} — {m.fin}{m.inicioBreak ? ` · Break: ${m.inicioBreak}-${m.finBreak}` : ''}</div>}
                        {PLATAFORMAS.map(p => (m[p + '_tokens'] || m[p + '_usd']) ? (
                          <div key={p} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-sub)', padding: '2px 0' }}>
                            <span>{p}</span>
                            <span>{Number(m[p + '_tokens'] || 0).toLocaleString()} tokens · ${m[p + '_usd'] || 0} USD</span>
                          </div>
                        ) : null)}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getQuincenaReporte(offset = 0) {
  const hoy = new Date();
  let dia = hoy.getDate();
  let mes = hoy.getMonth();
  let anio = hoy.getFullYear();
  let esPrimera = dia <= 15;
  let totalQ = (esPrimera ? 0 : 1) + offset;
  while (totalQ < 0) { mes -= 1; if (mes < 0) { mes = 11; anio -= 1; } totalQ += 2; }
  while (totalQ > 1) { mes += 1; if (mes > 11) { mes = 0; anio += 1; } totalQ -= 2; }
  const mesNombre = new Date(anio, mes, 1).toLocaleString('es-CO', { month: 'long' });
  const anioMes = `${anio}-${String(mes + 1).padStart(2, '0')}`;
  if (totalQ === 0) {
    return {
      inicio: new Date(anio, mes, 1).toISOString().split('T')[0],
      fin: new Date(anio, mes, 15).toISOString().split('T')[0],
      label: `1 - 15 de ${mesNombre}`,
      dias: 15,
      idQuincena: `${anioMes}-Q1`
    };
  }
  const ultimoDia = new Date(anio, mes + 1, 0).getDate();
  return {
    inicio: new Date(anio, mes, 16).toISOString().split('T')[0],
    fin: new Date(anio, mes, ultimoDia).toISOString().split('T')[0],
    label: `16 - ${ultimoDia} de ${mesNombre}`,
    dias: ultimoDia - 15,
    idQuincena: `${anioMes}-Q2`
  };
}

const PORCENTAJES_OPCIONES = [50, 60, 65, 70];
const TURNO_INFO_REPORTE = { Manana: { icono: '🌅', label: 'Turno Mañana' }, Tarde: { icono: '☀️', label: 'Turno Tarde' }, Noche: { icono: '🌙', label: 'Turno Noche' } };

function VistaReporteQuincenal({ cierres }) {
  const [modelosDB, setModelosDB] = useState([]);
  const [asistenciaDB, setAsistenciaDB] = useState({});
  const [reportesDB, setReportesDB] = useState({});
  const [edits, setEdits] = useState({});
  const [guardando, setGuardando] = useState({});
  const [quincenaOffset, setQuincenaOffset] = useState(0);

  const quincena = getQuincenaReporte(quincenaOffset);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'modelos'), snap => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      setModelosDB(data.filter(m => m.activa !== false));
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'asistencia'), snap => {
      const data = {};
      snap.forEach(d => { data[d.id] = d.data(); });
      setAsistenciaDB(data);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'reportesQuincenales'), snap => {
      const data = {};
      snap.forEach(d => { data[d.id] = d.data(); });
      setReportesDB(data);
    });
    return unsub;
  }, []);

  const valorCampo = (id, campo) => {
    if (edits[id] && edits[id][campo] !== undefined) return edits[id][campo];
    return reportesDB[id]?.[campo] || '';
  };

  const actualizarCampo = (id, campo, valor) => {
    setEdits(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [campo]: valor } }));
  };

  const guardarReporte = async (nombre) => {
    const id = `${quincena.idQuincena}_${nombre}`;
    setGuardando(prev => ({ ...prev, [id]: true }));
    await setDoc(doc(db, 'reportesQuincenales', id), {
      idQuincena: quincena.idQuincena,
      nombreModelo: nombre,
      porcentaje: valorCampo(id, 'porcentaje'),
      observaciones: valorCampo(id, 'observaciones'),
      justificacion: valorCampo(id, 'justificacion'),
      actualizadoEn: new Date().toISOString()
    });
    setGuardando(prev => ({ ...prev, [id]: false }));
  };

  const calcularModelo = (nombre) => {
    let horasTrabajadas = 0;
    cierres.forEach(cierre => {
      if (cierre.fecha < quincena.inicio || cierre.fecha > quincena.fin + 'Z') return;
      const modeloData = (cierre.modelos || []).find(m => m.nombre === nombre);
      if (!modeloData || !modeloData.inicio || !modeloData.fin) return;
      const [hi, mi] = modeloData.inicio.split(':').map(Number);
      const [hf, mf] = modeloData.fin.split(':').map(Number);
      let mins = (hf * 60 + mf) - (hi * 60 + mi);
      if (modeloData.inicioBreak && modeloData.finBreak) {
        const [hbi, mbi] = modeloData.inicioBreak.split(':').map(Number);
        const [hbf, mbf] = modeloData.finBreak.split(':').map(Number);
        mins -= (hbf * 60 + mbf) - (hbi * 60 + mbi);
      }
      horasTrabajadas += Math.max(0, mins / 60);
    });

    const registrosAsistencia = Object.values(asistenciaDB).filter(a => a.modelo === nombre && a.fecha >= quincena.inicio && a.fecha <= quincena.fin);
    const diasTrabajados = registrosAsistencia.filter(a => a.presente === true).length;
    const inasistencias = registrosAsistencia.filter(a => a.presente === false);

    return { horasTrabajadas: horasTrabajadas.toFixed(1), diasTrabajados, inasistencias };
  };

  const modelosPorTurno = { Manana: [], Tarde: [], Noche: [] };
  modelosDB.forEach(m => {
    if (modelosPorTurno[m.turno]) modelosPorTurno[m.turno].push(m);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 10, padding: '8px 14px' }}>
          <span style={{ color: 'var(--text-sub)', fontSize: 12 }}>📅</span>
          <span style={{ color: 'var(--text)', fontSize: 12 }}>{quincena.label}</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button style={s.quincenaBtn} onClick={() => setQuincenaOffset(o => o - 1)}>‹</button>
            {quincenaOffset < 0 && <button style={s.quincenaBtn} onClick={() => setQuincenaOffset(o => o + 1)}>›</button>}
          </div>
        </div>
      </div>

      {ORDEN_TURNOS.map(turno => {
        const modelos = modelosPorTurno[turno];
        if (!modelos || modelos.length === 0) return null;
        const info = TURNO_INFO_REPORTE[turno];
        return (
          <div key={turno}>
            <div style={s.turnoLabel}>
              <span style={{ fontSize: 18, marginRight: 8 }}>{info.icono}</span>{info.label}
            </div>
            <div className="nm-grid-cards">
              {modelos.map(m => {
                const nombre = m.nombreReal;
                const id = `${quincena.idQuincena}_${nombre}`;
                const { horasTrabajadas, diasTrabajados, inasistencias } = calcularModelo(nombre);
                return (
                  <div key={m.id} style={s.reporteCard}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 18, background: 'var(--bg3)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', fontSize: 16, flexShrink: 0, overflow: 'hidden' }}>
                        {m.fotoURL ? <img src={m.fotoURL} alt={nombre} style={{ width: 36, height: 36, objectFit: 'cover' }} /> : '👤'}
                      </div>
                      <div style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600 }}>{nombre}</div>
                    </div>

                    <div style={s.reporteFila}>
                      <span style={s.reporteLabel}>Horas trabajadas</span>
                      <span style={s.reporteValor}>{horasTrabajadas} hrs</span>
                    </div>
                    <div style={s.reporteFila}>
                      <span style={s.reporteLabel}>Días trabajados</span>
                      <span style={s.reporteValor}>{diasTrabajados} / {quincena.dias}</span>
                    </div>
                    <div style={{ ...s.reporteFila, borderBottom: inasistencias.length > 0 ? '1px solid var(--border)' : 'none' }}>
                      <span style={s.reporteLabel}>Días que faltó</span>
                      <span style={s.reporteValor}>{inasistencias.length}</span>
                    </div>
                    {inasistencias.length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        {inasistencias.map((a, i) => (
                          <div key={i} style={{ color: 'var(--text-sub)', fontSize: 11, padding: '3px 0' }}>
                            {a.fecha}{a.motivo ? ` — ${a.motivo}` : ' — sin motivo'}
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={s.reporteSecTit}>Porcentaje asignado</div>
                    <select style={s.select} value={valorCampo(id, 'porcentaje')} onChange={e => actualizarCampo(id, 'porcentaje', e.target.value)}>
                      <option value="">Sin asignar</option>
                      {PORCENTAJES_OPCIONES.map(p => <option key={p} value={p}>{p}%</option>)}
                    </select>

                    <div style={s.reporteSecTit}>Justificación del porcentaje</div>
                    <textarea style={s.textarea} rows={2} placeholder="Motivo del porcentaje asignado..." value={valorCampo(id, 'justificacion')} onChange={e => actualizarCampo(id, 'justificacion', e.target.value)} />

                    <div style={s.reporteSecTit}>Observaciones del monitor</div>
                    <textarea style={s.textarea} rows={2} placeholder="Observaciones..." value={valorCampo(id, 'observaciones')} onChange={e => actualizarCampo(id, 'observaciones', e.target.value)} />

                    <button style={s.btnGuardarReporte} onClick={() => guardarReporte(nombre)} disabled={guardando[id]}>
                      {guardando[id] ? 'Guardando...' : 'Guardar reporte'}
                    </button>
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

function VistaJefeTabs({ cierres }) {
  const [tab, setTab] = useState('diarios');
  return (
    <div>
      <div style={s.tabsJefe}>
        <button type="button" style={{ ...s.tabJefeBtn, ...(tab === 'diarios' ? s.tabJefeBtnActivo : {}) }} onClick={() => setTab('diarios')}>Cierres Diarios</button>
        <button type="button" style={{ ...s.tabJefeBtn, ...(tab === 'quincenal' ? s.tabJefeBtnActivo : {}) }} onClick={() => setTab('quincenal')}>Reporte Quincenal</button>
      </div>
      {tab === 'diarios' ? <VistaJefe cierres={cierres} /> : <VistaReporteQuincenal cierres={cierres} />}
    </div>
  );
}


      export default function CierreTurno({ rol, nombreMonitor, modelasMonitor }) {
  const [datosModelos, setDatosModelos] = useState({});
  const [cierres, setCierres] = useState([]);
  const [cierresLoaded, setCierresLoaded] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [modelosDB, setModelosDB] = useState([]);
  const [fechaCierre, setFechaCierre] = useState(() => fechaISOLocal(new Date()));

  useEffect(() => {
    const q = query(collection(db, 'cierres'), orderBy('fecha', 'desc'));
    const unsub = onSnapshot(q, snap => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      setCierres(data);
      setCierresLoaded(true);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'modelos'), snap => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      setModelosDB(data);
    });
    return unsub;
  }, []);

  const actualizarModelo = (nombre, campo, valor) => {
    setDatosModelos(prev => ({ ...prev, [nombre]: { ...prev[nombre], [campo]: valor } }));
  };

  const misModelos = (nombreMonitor) ? modelosDB.filter(m => m.activa !== false && m.monitor === nombreMonitor).map(m => m.nombreReal) : [];

  const diaSeleccionado = parseFechaLocal(fechaCierre).toLocaleDateString('es-CO');
  const cierreExistente = cierres.find(c => c.monitor === nombreMonitor && c.dia === diaSeleccionado);

  // Al cambiar la fecha (o cargar los cierres por primera vez), precargar los datos ya guardados de ese día
  useEffect(() => {
    if (!cierresLoaded) return;
    if (cierreExistente) {
      const datos = {};
      (cierreExistente.modelos || []).forEach(m => { datos[m.nombre] = { ...m }; });
      setDatosModelos(datos);
    } else {
      setDatosModelos({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaCierre, cierresLoaded]);

  const enviarCierre = async () => {
    if (!nombreMonitor) return;
    setEnviando(true);
    const resumen = misModelos.map(m => ({ nombre: m, ...datosModelos[m] }));
    const ahora = new Date();
    const fechaConHora = parseFechaLocal(fechaCierre);
    fechaConHora.setHours(ahora.getHours(), ahora.getMinutes(), ahora.getSeconds(), ahora.getMilliseconds());
    const datosCierre = {
      monitor: nombreMonitor,
      turno: TURNOS[nombreMonitor] || '',
      modelos: resumen,
      fecha: fechaConHora.toISOString(),
      dia: diaSeleccionado,
      hora: ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    };
    if (cierreExistente) {
      await updateDoc(doc(db, 'cierres', cierreExistente.id), datosCierre);
    } else {
      await addDoc(collection(db, 'cierres'), datosCierre);
    }
    setEnviando(false);
  };

  if (rol === 'jefe') {
    return <VistaJefeTabs cierres={cierres} />;
  }

    

  // Vista monitor
  if (misModelos.length === 0) {
    return <div style={s.vacia}>No tienes modelos asignadas</div>;
  }

  return (
    <div>
      <div style={{ background: 'var(--bg2)', borderRadius: 16, padding: '18px 20px', marginBottom: 16, position: 'relative', overflow: 'hidden', border: '1px solid var(--border2)', borderLeft: '4px solid var(--gold)', boxShadow: '0 4px 20px rgba(201,146,74,0.12)' }}>
        <div style={{ color: 'var(--gold)', fontSize: 20, fontWeight: 700 }}>{nombreMonitor}</div>
        <div style={{ color: 'var(--text-sub)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginTop: 3 }}>Turno {TURNOS[nombreMonitor] || ''} · {misModelos.length} modelos</div>
        {(() => {
          const completadas = misModelos.filter(m => PLATAFORMAS.reduce((acc, p) => acc + Number(datosModelos[m]?.[p + '_tokens'] || 0), 0) > 0).length;
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
              <span style={{ color: 'var(--text-sub)', fontSize: 11 }}>{completadas} de {misModelos.length} completadas</span>
              <div style={{ flex: 1, maxWidth: 200, height: 6, background: 'var(--bg3)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(completadas / misModelos.length) * 100}%`, background: 'var(--gold)', borderRadius: 10, transition: 'width 0.3s' }} />
              </div>
            </div>
          );
        })()}
      </div>

      <div style={s.fechaCard}>
        <div>
          <div style={{ color: 'var(--text-sub)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Fecha del cierre</div>
          <input type="date" style={s.dateInput} value={fechaCierre} onChange={e => setFechaCierre(e.target.value)} />
        </div>
        {cierreExistente && (
          <span style={s.avisoExistente}>Ya existe un cierre guardado para este día — puedes editarlo</span>
        )}
      </div>

      <div className="nm-grid-cards">
        {misModelos.map(nombre => (
          <FormModelo key={nombre} nombre={nombre} datos={datosModelos[nombre] || {}}
            onChange={(campo, valor) => actualizarModelo(nombre, campo, valor)}
            fotoURL={modelosDB.find(m => m.nombreReal === nombre)?.fotoURL || ''} />
        ))}
      </div>
      <button style={s.btnEnviar} onClick={enviarCierre} disabled={enviando}>
        {enviando ? 'Enviando...' : (cierreExistente ? 'Actualizar cierre' : 'Cerrar turno')}
      </button>

      <div style={s.historial}>
        <div style={{ color: 'var(--text-sub)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Historial (últimos 7 días)</div>
        {(() => {
          const historial = cierres
            .filter(c => c.monitor === nombreMonitor)
            .sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''))
            .slice(0, 7);
          if (historial.length === 0) {
            return <div style={{ color: 'var(--text-dim)', fontSize: 12 }}>Aún no has registrado cierres</div>;
          }
          return historial.map(c => (
            <div key={c.id} style={s.historialFila}>
              <span style={{ color: c.dia === diaSeleccionado ? 'var(--gold)' : 'var(--text)' }}>
                {c.dia}{c.dia === diaSeleccionado ? ' (seleccionado)' : ''}
              </span>
              <span style={{ color: 'var(--text-sub)' }}>{c.hora || '—'}</span>
            </div>
          ));
        })()}
      </div>
    </div>
  );
}