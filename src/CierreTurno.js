import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, onSnapshot, orderBy, query } from 'firebase/firestore';

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

function FormModelo({ nombre, datos, onChange }) {
  const totalTokens = PLATAFORMAS.reduce((acc, p) => acc + Number(datos[p + '_tokens'] || 0), 0);
  const totalUsd = (totalTokens / 20).toFixed(2);
  const completada = totalTokens > 0;

  return (
    <div style={s.modeloCard}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 38, height: 38, borderRadius: 19, background: 'var(--bg3)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', fontSize: 16, flexShrink: 0 }}>
          {datos.fotoURL ? <img src={datos.fotoURL} alt={nombre} style={{ width: 38, height: 38, borderRadius: 19, objectFit: 'cover' }} /> : '👤'}
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
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: 12 }}>
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
        <div style={{ background: 'var(--bg2)', borderRadius: 14, padding: '16px 18px', border: '1px solid var(--border2)' }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
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

  
      export default function CierreTurno({ rol, nombreMonitor, modelasMonitor }) {
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

  const misModelos = modelasMonitor && modelasMonitor.length > 0 ? modelasMonitor : [];

  

  const enviarCierre = async () => {
    if (!nombreMonitor) return;
    setEnviando(true);
    const resumen = misModelos.map(m => ({ nombre: m, ...datosModelos[m] }));
    await addDoc(collection(db, 'cierres'), {
      monitor: nombreMonitor,
      turno: TURNOS[nombreMonitor] || '',
      modelos: resumen,
      fecha: new Date().toISOString(),
      dia: new Date().toLocaleDateString('es-CO'),
      hora: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    });
    setDatosModelos({});
    setEnviando(false);
  };

  if (rol === 'jefe') {
    return <VistaJefe cierres={cierres} />;
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
      
      
      <div className="nm-grid-cards">
        {misModelos.map(nombre => (
          <FormModelo key={nombre} nombre={nombre} datos={datosModelos[nombre] || {}}
            onChange={(campo, valor) => actualizarModelo(nombre, campo, valor)} />
        ))}
      </div>
      <button style={s.btnEnviar} onClick={enviarCierre} disabled={enviando}>
        {enviando ? 'Enviando...' : 'Cerrar turno'}
      </button>
    </div>
  );
}