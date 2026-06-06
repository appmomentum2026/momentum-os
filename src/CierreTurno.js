import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, onSnapshot, orderBy, query } from 'firebase/firestore';

const PLATAFORMAS = ['Stripchat', 'Camsoda', 'Chaturbate', 'Streamate'];

const TURNOS = { 'Daniela': 'Manana', 'Ramon': 'Manana', 'Santiago': 'Tarde', 'Monica': 'Tarde', 'Juan': 'Noche', 'Cesar': 'Noche' };

const ORDEN_TURNOS = ['Manana', 'Tarde', 'Noche'];

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
  vacia: { color: 'var(--text-dim)', textAlign: 'center', padding: 40, fontSize: 13 },
  banner: { background: 'var(--bg3)', borderRadius: 10, padding: '12px 16px', marginBottom: 14, border: '1px solid var(--border)' },
  bannerNombre: { color: 'var(--gold)', fontSize: 14, fontWeight: 500 },
  bannerTurno: { color: 'var(--text-sub)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 },
  turnoCard: { background: 'var(--bg2)', borderRadius: 14, padding: 18, marginBottom: 14, border: '1px solid var(--border)' },
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

function VistaJefe({ cierres }) {
  const fechasDisponibles = [...new Set(cierres.map(c => c.dia).filter(Boolean))];
  const hoy = new Date().toLocaleDateString('es-CO');
  const [fechaSel, setFechaSel] = useState(fechasDisponibles.includes(hoy) ? hoy : (fechasDisponibles[0] || hoy));

  const cierresDia = cierres.filter(c => c.dia === fechaSel);

  const porTurno = { Manana: [], Tarde: [], Noche: [] };
  cierresDia.forEach(c => {
    const turno = c.turno || TURNOS[c.monitor] || '';
    if (!porTurno[turno]) return;
    (c.modelos || []).forEach(m => {
      porTurno[turno].push({ ...m, monitor: c.monitor });
    });
  });

  const tokensModelo = (m) => PLATAFORMAS.reduce((acc, p) => acc + Number(m[p + '_tokens'] || 0), 0);

  return (
    <div>
      <div style={s.form}>
        <label style={s.label}>Ver cierre del día</label>
        <select style={s.select} value={fechaSel} onChange={e => setFechaSel(e.target.value)}>
          {fechasDisponibles.length === 0 && <option value={hoy}>{hoy}</option>}
          {fechasDisponibles.map(f => <option key={f} value={f}>{f}{f === hoy ? ' (hoy)' : ''}</option>)}
        </select>
      </div>

      {cierresDia.length === 0 && <p style={s.vacia}>No hay cierres registrados este día</p>}

      {ORDEN_TURNOS.map(turno => {
        const modelos = porTurno[turno];
        if (!modelos || modelos.length === 0) return null;

        const subtotalTokens = modelos.reduce((acc, m) => acc + tokensModelo(m), 0);
        const subtotalUsd = (subtotalTokens / 20).toFixed(2);

        return (
          <div key={turno} style={s.turnoCard}>
            <div style={s.turnoHeader}>
              <div style={s.turnoTitulo}>Turno {turno}</div>
              <div style={s.turnoSubtotal}>
                <div style={s.turnoSubtotalTokens}>{subtotalTokens.toLocaleString()} tokens</div>
                <div style={s.turnoSubtotalUsd}>${subtotalUsd} USD</div>
              </div>
            </div>
            <div style={s.turnoMeta}>{modelos.length} modelos · {fechaSel}</div>

            {modelos.map((m, i) => {
              const tot = tokensModelo(m);
              return (
                <div key={m.nombre + i} style={s.modelaRow}>
                  <div style={s.modelaTop}>
                    <span style={s.modelaNombre}>{m.nombre}</span>
                    <span style={s.modelaTotal}>{tot.toLocaleString()} tkns · ${(tot / 20).toFixed(2)}</span>
                  </div>
                  {PLATAFORMAS.map(p => (m[p + '_tokens'] || m[p + '_usd']) ? (
                    <div key={p} style={s.platRow}>
                      <span>{p}</span>
                      <span>{Number(m[p + '_tokens'] || 0).toLocaleString()} tokens · ${m[p + '_usd'] || 0} USD</span>
                    </div>
                  ) : null)}
                </div>
              );
            })}
          </div>
        );
      })}
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
      <div style={s.banner}>
        <div style={s.bannerNombre}>{nombreMonitor}</div>
        <div style={s.bannerTurno}>Turno {TURNOS[nombreMonitor] || ''} · {misModelos.length} modelos</div>
      </div>
      {misModelos.map(nombre => (
        <FormModelo key={nombre} nombre={nombre} datos={datosModelos[nombre] || {}}
          onChange={(campo, valor) => actualizarModelo(nombre, campo, valor)} />
      ))}
      <button style={s.btnEnviar} onClick={enviarCierre} disabled={enviando}>
        {enviando ? 'Enviando...' : 'Cerrar turno'}
      </button>
    </div>
  );
}