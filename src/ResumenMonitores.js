import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot } from 'firebase/firestore';

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

const ICONO_TURNO = { 'Manana': 'sun', 'Tarde': 'sunset', 'Noche': 'moon' };

const s = {
  wrap: { display: 'block' },
  card: { background: 'var(--bg2)', borderRadius: 14, padding: 18, border: '1px solid var(--border)' },
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
};

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
  const quincena = getQuincena();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'cierres'), snap => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      setCierres(data);
    });
    return unsub;
  }, []);

  const calcularMonitor = (nombreMonitor) => {
    const susModelos = MONITORES[nombreMonitor] || [];
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

  const ORDEN = ['Manana', 'Tarde', 'Noche'];

  return (
    <div style={s.wrap}>
      {ORDEN.map(turnoActual => {
        const monitoresTurno = Object.keys(MONITORES).filter(m => TURNOS[m] === turnoActual);
        if (monitoresTurno.length === 0) return null;
        return (
          <div key={turnoActual} style={{ marginBottom: 8 }}>
            <div style={s.turnoLabel}>Turno {turnoActual}</div>
            <div className="nm-grid-cards">
            {monitoresTurno.map(monitor => {
              const datos = calcularMonitor(monitor);
              const turno = TURNOS[monitor];
              return (
          <div key={monitor} style={s.card}>
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