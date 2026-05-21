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

const nm = {
  tabla: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', color: '#555577', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', paddingBottom: 12, borderBottom: '1px solid #272742' },
  td: { padding: '10px 8px', borderBottom: '1px solid #1f1f35', fontSize: 13 },
  nombre: { color: '#888899' },
  btnSi: { padding: '7px 14px', borderRadius: 10, border: 'none', background: '#1a1a2e', boxShadow: '3px 3px 6px #0d0d1a, -3px -3px 6px #272742', color: '#1d9e75', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer', marginRight: 8 },
  btnNo: { padding: '7px 14px', borderRadius: 10, border: 'none', background: '#1a1a2e', boxShadow: '3px 3px 6px #0d0d1a, -3px -3px 6px #272742', color: '#d85a30', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer' },
  btnActivo: { boxShadow: 'inset 3px 3px 6px #0d0d1a, inset -3px -3px 6px #272742' },
  btnInactivo: { opacity: 0.35 },
  select: { background: '#1a1a2e', border: 'none', borderRadius: 10, boxShadow: 'inset 2px 2px 5px #0d0d1a, inset -2px -2px 5px #272742', color: '#C9A84C', padding: '7px 10px', fontSize: 12 },
  badge: { padding: '4px 12px', borderRadius: 20, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  hora: { color: '#444466', fontSize: 12 }
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
    <table style={nm.tabla}>
      <thead>
        <tr>
          <th style={nm.th}>Modelo</th>
          <th style={nm.th}>Estado</th>
          {rol === 'monitor' && <th style={nm.th}>Motivo</th>}
          <th style={nm.th}>Hora</th>
        </tr>
      </thead>
      <tbody>
        {MODELOS.map(modelo => {
          const reg = getReg(modelo);
          return (
            <tr key={modelo}>
              <td style={{ ...nm.td, ...nm.nombre }}>{modelo}</td>
              <td style={nm.td}>
                {rol === 'monitor' ? (
                  <div style={{ display: 'flex' }}>
                    <button style={{ ...nm.btnSi, ...(reg?.presente === true ? nm.btnActivo : reg ? nm.btnInactivo : {}) }} onClick={() => marcar(modelo, true)}>
                      Asistio
                    </button>
                    <button style={{ ...nm.btnNo, ...(reg?.presente === false ? nm.btnActivo : reg ? nm.btnInactivo : {}) }} onClick={() => marcar(modelo, false)}>
                      No asistio
                    </button>
                  </div>
                ) : (
                  <span style={{
                    ...nm.badge,
                    background: reg?.presente === true ? '#1d9e7522' : reg?.presente === false ? '#d85a3022' : '#27274222',
                    color: reg?.presente === true ? '#1d9e75' : reg?.presente === false ? '#d85a30' : '#444466'
                  }}>
                    {reg?.presente === true ? 'Asistio' : reg?.presente === false ? 'No asistio' : 'Sin registrar'}
                  </span>
                )}
              </td>
              {rol === 'monitor' && (
                <td style={nm.td}>
                  {reg?.presente === false && (
                    <select style={nm.select} value={reg?.motivo || ''} onChange={e => marcar(modelo, false, e.target.value)}>
                      <option value="">Motivo</option>
                      {MOTIVOS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  )}
                </td>
              )}
              <td style={{ ...nm.td, ...nm.hora }}>{reg?.hora || '—'}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}