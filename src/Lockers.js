import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot } from 'firebase/firestore';

const TOTAL_LOCKERS = 20;

// Compatibilidad: modelos viejas guardaban un solo "locker"; las nuevas guardan
// "lockers" (array), permitiendo que una modelo ocupe varios.
function lockersDeModelo(modelo) {
  if (Array.isArray(modelo.lockers)) return modelo.lockers;
  if (modelo.locker) return [modelo.locker];
  return [];
}

const s = {
  wrap: { display: 'block' },
  resumenGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 },
  resumenCard: { display: 'flex', alignItems: 'center', gap: 14 },
  resumenIcono: { width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, background: 'rgba(201,146,74,0.15)' },
  resumenVal: { color: 'var(--text)', fontSize: 22, fontWeight: 700, lineHeight: 1.2 },
  resumenLabel: { color: 'var(--text-sub)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 },
  seccionTit: { color: 'var(--gold)', fontSize: 16, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14, marginTop: 8, paddingBottom: 8, borderBottom: '1px solid var(--border)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 14, marginBottom: 24 },
  lockerOcupado: { background: 'rgba(201,146,74,0.1)', border: '1px solid var(--gold-dim)', borderRadius: 14, padding: 16, boxShadow: 'var(--shadow-out)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', aspectRatio: '1', gap: 8 },
  lockerVacio: { background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', aspectRatio: '1', gap: 8 },
  numeroOcupado: { color: 'var(--gold)', fontSize: 26, fontWeight: 800, lineHeight: 1 },
  numeroVacio: { color: 'var(--text-dim)', fontSize: 26, fontWeight: 800, lineHeight: 1 },
  nombreModelo: { color: 'var(--text)', fontSize: 11, fontWeight: 600, lineHeight: 1.3, wordBreak: 'break-word' },
  metaModelo: { color: 'var(--text-sub)', fontSize: 10, lineHeight: 1.3 },
  disponibleTxt: { color: 'var(--text-dim)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  sinLockerCard: { overflow: 'hidden' },
  sinLockerFila: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border)' },
  avatar: { width: 36, height: 36, borderRadius: 18, background: 'var(--bg3)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', fontSize: 15, fontWeight: 600, flexShrink: 0 },
  vacio: { color: 'var(--text-dim)', textAlign: 'center', padding: 40, fontSize: 13 },
};

export default function Lockers() {
  const [modelosDB, setModelosDB] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'modelos'), snap => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      data.sort((a, b) => a.nombreReal.localeCompare(b.nombreReal));
      setModelosDB(data.filter(m => m.activa !== false));
    });
    return unsub;
  }, []);

  const modeloPorLocker = {};
  modelosDB.forEach(m => {
    lockersDeModelo(m).forEach(n => { modeloPorLocker[String(n)] = m; });
  });

  const numerosExistentes = modelosDB
    .flatMap(m => lockersDeModelo(m).map(Number))
    .filter(n => Number.isFinite(n) && n > 0);
  const totalLockers = Math.max(TOTAL_LOCKERS, ...numerosExistentes, 0);
  const lockers = Array.from({ length: totalLockers }, (_, i) => i + 1);

  const modelosSinLocker = modelosDB.filter(m => lockersDeModelo(m).length === 0);
  const ocupados = lockers.filter(n => modeloPorLocker[String(n)]).length;

  const inicial = (nombre) => (nombre || '?').charAt(0).toUpperCase();

  return (
    <div style={s.wrap}>
      <div style={s.resumenGrid}>
        <div style={s.resumenCard} className="nm-card-elevated">
          <div style={s.resumenIcono}>🔒</div>
          <div>
            <div style={s.resumenVal}>{lockers.length}</div>
            <div style={s.resumenLabel}>Lockers totales</div>
          </div>
        </div>
        <div style={s.resumenCard} className="nm-card-elevated">
          <div style={s.resumenIcono}>👤</div>
          <div>
            <div style={s.resumenVal}>{ocupados}</div>
            <div style={s.resumenLabel}>Asignados</div>
          </div>
        </div>
        <div style={s.resumenCard} className="nm-card-elevated">
          <div style={s.resumenIcono}>⬜</div>
          <div>
            <div style={s.resumenVal}>{lockers.length - ocupados}</div>
            <div style={s.resumenLabel}>Disponibles</div>
          </div>
        </div>
      </div>

      <div style={s.seccionTit}>Mapa de lockers</div>
      <div style={s.grid}>
        {lockers.map(n => {
          const modelo = modeloPorLocker[String(n)];
          if (modelo) {
            return (
              <div key={n} style={s.lockerOcupado}>
                <div style={s.numeroOcupado}>{n}</div>
                <div>
                  <div style={s.nombreModelo}>{modelo.nombreReal}</div>
                  <div style={s.metaModelo}>{modelo.turno || 'Sin turno'}{modelo.monitor ? ` · ${modelo.monitor}` : ''}</div>
                </div>
              </div>
            );
          }
          return (
            <div key={n} style={s.lockerVacio}>
              <div style={s.numeroVacio}>{n}</div>
              <div style={s.disponibleTxt}>Disponible</div>
            </div>
          );
        })}
      </div>

      <div style={s.seccionTit}>Modelos sin locker</div>
      {modelosSinLocker.length === 0 ? (
        <p style={s.vacio}>Todas las modelos activas tienen locker asignado</p>
      ) : (
        <div style={s.sinLockerCard} className="nm-card-elevated">
          {modelosSinLocker.map((m, i) => (
            <div key={m.id} style={{ ...s.sinLockerFila, borderBottom: i < modelosSinLocker.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={s.avatar}>{inicial(m.nombreReal)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: 'var(--text)', fontSize: 13, fontWeight: 500 }}>{m.nombreReal}</div>
                <div style={{ color: 'var(--text-sub)', fontSize: 11, marginTop: 2 }}>{m.turno || 'Sin turno'}{m.monitor ? ` · ${m.monitor}` : ''}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
