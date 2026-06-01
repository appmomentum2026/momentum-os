import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';

const MOTIVOS = ['No contesto', 'Permiso', 'Incapacidad', 'Otro'];

const MODELOS = [
  'Ashly Naibel Burgos Machado', 'Ana Sofia Ospina Ortega', 'Tatiana Andrea Rios Hurtado',
  'Luz Magnolia Salazar Garcia', 'Vanessa Arroyave', 'Valentina Osorno Alvarez',
  'Sara Arango Zuleta', 'Valentina Zapata Azcuntar', 'Alejandra Rojas Vargas',
  'Maye Catalina Insuasty Saldariaga', 'Juliana Ospina Jimenez', 'Liliana Castillo Salgado',
  'Nicoll Pulgarin Nohava', 'Alison Daniela Zapata Estrada', 'Evelyn Tamayo Zapata'
];

const s = {
  tabla: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', color: 'var(--text-sub)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', paddingBottom: 12, borderBottom: '1px solid var(--border)' },
  td: { padding: '10px 8px', borderBottom: '1px solid var(--border)', fontSize: 13 },
  nombre: { color: 'var(--text)' },
  btnSi: { padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(76,175,125,0.3)', background: 'rgba(76,175,125,0.1)', color: '#4CAF7D', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer', marginRight: 8 },
  btnNo: { padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(192,97,74,0.3)', background: 'rgba(192,97,74,0.1)', color: '#C0614A', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer' },
  btnActivo: { opacity: 1, outline: '1px solid currentColor' },
  btnInactivo: { opacity: 0.35 },
  select: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--gold)', padding: '7px 10px', fontSize: 12 },
  badge: { padding: '4px 12px', borderRadius: 20, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  hora: { color: 'var(--text-dim)', fontSize: 12 }
};

export default function Asistencia({ rol }) {
  const [asistencia, setAsistencia] = useState({});
  const hoy = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'asistencia'), snap => {
      const data = {};
      snap.forEach(d => { data[d.id] = d.data(); });
      setAsistencia(data);
    });
    return unsub;
  }, []);

  const marcar = async (modelo, presente, motivo = '') => {
    const id = `${hoy}_${modelo}`;
    await setDoc(doc(db, 'asistencia', id), {
      modelo, fecha: hoy, presente,
      motivo: presente ? '' : motivo,
      hora: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    });
  };

  const getReg = (modelo) => asistencia[`${hoy}_${modelo}`] || null;

  return (
    <table style={s.tabla}>
      <thead>
        <tr>
          <th style={s.th}>Modelo</th>
          <th style={s.th}>Estado</th>
          {rol === 'monitor' && <th style={s.th}>Motivo</th>}
          <th style={s.th}>Hora</th>
        </tr>
      </thead>
      <tbody>
        {MODELOS.map(modelo => {
          const reg = getReg(modelo);
          return (
            <tr key={modelo}>
              <td style={{ ...s.td, ...s.nombre }}>{modelo}</td>
              <td style={s.td}>
                {rol === 'monitor' ? (
                  <div style={{ display: 'flex' }}>
                    <button style={{ ...s.btnSi, ...(reg?.presente === true ? s.btnActivo : reg ? s.btnInactivo : {}) }} onClick={() => marcar(modelo, true)}>
                      Asistio
                    </button>
                    <button style={{ ...s.btnNo, ...(reg?.presente === false ? s.btnActivo : reg ? s.btnInactivo : {}) }} onClick={() => marcar(modelo, false)}>
                      No asistio
                    </button>
                  </div>
                ) : (
                  <span style={{
                    ...s.badge,
                    background: reg?.presente === true ? 'rgba(76,175,125,0.1)' : reg?.presente === false ? 'rgba(192,97,74,0.1)' : 'rgba(255,255,255,0.05)',
                    color: reg?.presente === true ? '#4CAF7D' : reg?.presente === false ? '#C0614A' : 'var(--text-dim)'
                  }}>
                    {reg?.presente === true ? 'Asistio' : reg?.presente === false ? 'No asistio' : 'Sin registrar'}
                  </span>
                )}
              </td>
              {rol === 'monitor' && (
                <td style={s.td}>
                  {reg?.presente === false && (
                    <select style={s.select} value={reg?.motivo || ''} onChange={e => marcar(modelo, false, e.target.value)}>
                      <option value="">Motivo</option>
                      {MOTIVOS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  )}
                </td>
              )}
              <td style={{ ...s.td, ...s.hora }}>{reg?.hora || '—'}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}