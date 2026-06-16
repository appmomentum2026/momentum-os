import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot } from 'firebase/firestore';

const MODELOS_POR_TURNO = {
  'Mañana': [
    'Ashly Naibel Burgos Machado', 'Ana Sofia Ospina Ortega', 'Tatiana Andrea Rios Hurtado',
    'Luz Magnolia Salazar Garcia', 'Vanessa Arroyave', 'Valentina Osorno Alvarez',
    'Sara Arango Zuleta', 'Valentina Zapata Azcuntar', 'Alejandra Rojas Vargas',
    'Maye Catalina Insuasty Saldariaga', 'Juliana Ospina Jimenez', 'Liliana Castillo Salgado',
    'Nicoll Pulgarin Nohava', 'Alison Daniela Zapata Estrada', 'Evelyn Tamayo Zapata'
  ],
  'Tarde': [
    'Valentina Marquez Pino', 'Susana Pelaez', 'Ivonne Camila Zuluaga Prieto',
    'Evelin Saday Ricardo Solis', 'Luisa Fernanda Osorio Jimenez',
    'Natalia Hernandez Llano', 'Maria Camila Correa Munoz', 'Nataly Cardenas Moreno',
    'Dayannis Tobon Acosta', 'Diana Luz Agamez Gonzalez', 'Asoryana Ramos Briseno', 'Yesmi Diaz Ruiz'
  ],
  'Noche': [
    'Andrea Carolina Gomez Rodelo', 'Viviana Marcela Zambrano Mosquera', 'Sofia del Pilar Herrera Celis',
    'Angie Marcela Villa Carmona', 'Isabela Gutierrez Rivera', 'Alexa Rivera Montoya',
    'Yeimy Viviana Osorio Rojas', 'Maria Jose Lopez Mejia', 'Sara Paulina Mejia Marin',
    'Luisa Fernanda Rodriguez Calderon'
  ]
};

const TURNO_ICONO = { 'Mañana': '🌅', 'Tarde': '☀️', 'Noche': '🌙' };
const MODELOS_TODAS = Object.values(MODELOS_POR_TURNO).flat();

function getQuincena(offset = 0) {
  const hoy = new Date();
  let dia = hoy.getDate();
  let mes = hoy.getMonth();
  let anio = hoy.getFullYear();
  let esPrimera = dia <= 15;
  let totalQ = (esPrimera ? 0 : 1) + offset;
  while (totalQ < 0) { mes -= 1; if (mes < 0) { mes = 11; anio -= 1; } totalQ += 2; }
  while (totalQ > 1) { mes += 1; if (mes > 11) { mes = 0; anio += 1; } totalQ -= 2; }
  const mesNombre = new Date(anio, mes, 1).toLocaleString('es-CO', { month: 'long' });
  if (totalQ === 0) {
    return { inicio: new Date(anio, mes, 1).toISOString().split('T')[0], fin: new Date(anio, mes, 15).toISOString().split('T')[0], label: `1 - 15 de ${mesNombre}` };
  } else {
    const ultimoDia = new Date(anio, mes + 1, 0).getDate();
    return { inicio: new Date(anio, mes, 16).toISOString().split('T')[0], fin: new Date(anio, mes, ultimoDia).toISOString().split('T')[0], label: `16 - ${ultimoDia} de ${mesNombre}` };
  }
}

function calcularPorcentaje(tokens, horasCumplidas, horasRequeridas) {
  const cumpleHoras = horasCumplidas >= horasRequeridas;
  if (!cumpleHoras) return 50;
  if (tokens >= 70000) return 70;
  if (tokens >= 60000) return 65;
  return 60;
}

function getBadgeStyle(porcentaje) {
  if (porcentaje === 70) return { background: 'rgba(76,175,125,0.15)', color: '#4CAF7D' };
  if (porcentaje === 65) return { background: 'rgba(201,146,74,0.15)', color: '#C9924A' };
  if (porcentaje === 60) return { background: 'rgba(106,138,170,0.15)', color: '#6A8AAA' };
  return { background: 'rgba(192,97,74,0.15)', color: '#C0614A' };
}

export default function ResumenJefe() {
  const [cierres, setCierres] = useState([]);
  const [asistencia, setAsistencia] = useState({});
  const [vistaGrid, setVistaGrid] = useState(true);
  const [rankingAbierto, setRankingAbierto] = useState(false);
  const [quincenaOffset, setQuincenaOffset] = useState(0);

  const quincena = getQuincena(quincenaOffset);
  const quincenaAnterior = getQuincena(quincenaOffset - 1);

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

  const calcularModelo = (nombreModelo, q) => {
    let totalTokens = 0;
    let horasTrabajadas = 0;
    const fechasAsistencia = Object.values(asistencia).filter(a =>
      a.modelo === nombreModelo && a.presente === true &&
      a.fecha >= q.inicio && a.fecha <= q.fin
    );
    const diasTrabajados = fechasAsistencia.length;
    cierres.forEach(cierre => {
      if (cierre.fecha < q.inicio || cierre.fecha > q.fin + 'Z') return;
      if (!cierre.modelos) return;
      const modelaData = cierre.modelos.find(m => m.nombre === nombreModelo);
      if (!modelaData) return;
      ['Stripchat', 'Camsoda', 'Chaturbate', 'Streamate'].forEach(p => {
        totalTokens += Number(modelaData[p + '_tokens'] || 0);
      });
      if (modelaData.inicio && modelaData.fin) {
        const [hi, mi] = modelaData.inicio.split(':').map(Number);
        const [hf, mf] = modelaData.fin.split(':').map(Number);
        let mins = (hf * 60 + mf) - (hi * 60 + mi);
        if (modelaData.inicioBreak && modelaData.finBreak) {
          const [hbi, mbi] = modelaData.inicioBreak.split(':').map(Number);
          const [hbf, mbf] = modelaData.finBreak.split(':').map(Number);
          mins -= (hbf * 60 + mbf) - (hbi * 60 + mbi);
        }
        horasTrabajadas += Math.max(0, mins / 60);
      }
    });
    const horasRequeridas = diasTrabajados * 6.5;
    const porcentaje = calcularPorcentaje(totalTokens, horasTrabajadas, horasRequeridas);
    const usdNeto = (totalTokens / 20) * (porcentaje / 100);
    return { diasTrabajados, totalTokens, horasTrabajadas: horasTrabajadas.toFixed(1), horasRequeridas: horasRequeridas.toFixed(1), porcentaje, usdNeto: usdNeto.toFixed(2) };
  };

  const resumen = MODELOS_TODAS.map(m => ({ nombre: m, ...calcularModelo(m, quincena) }));
  const resumenAnterior = MODELOS_TODAS.map(m => ({ nombre: m, ...calcularModelo(m, quincenaAnterior) }));

  const totalPagar = resumen.reduce((acc, m) => acc + parseFloat(m.usdNeto), 0);
  const totalTokensEstudio = resumen.reduce((acc, m) => acc + m.totalTokens, 0);
  const totalTokensAnterior = resumenAnterior.reduce((acc, m) => acc + m.totalTokens, 0);

  const diasConData = new Set();
  cierres.forEach(c => {
    const f = c.fecha?.split('T')[0] || '';
    if (f >= quincena.inicio && f <= quincena.fin) diasConData.add(f);
  });
  const diasTranscurridos = diasConData.size;
  const proyeccionTokens = diasTranscurridos > 0 ? Math.round((totalTokensEstudio / diasTranscurridos) * 15) : 0;
  const pctCambio = totalTokensAnterior > 0 ? Math.round(((totalTokensEstudio - totalTokensAnterior) / totalTokensAnterior) * 100) : null;

  const ranking = resumen.filter(m => m.totalTokens > 0).sort((a, b) => b.totalTokens - a.totalTokens);
  const maxRank = ranking.length > 0 ? ranking[0].totalTokens : 1;
  const topModelo = ranking[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 10, padding: '8px 14px' }}>
          <span style={{ color: 'var(--text-sub)', fontSize: 12 }}>📅</span>
          <span style={{ color: 'var(--text)', fontSize: 12 }}>{quincena.label}</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button style={{ background: 'transparent', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontSize: 16, padding: '0 4px' }} onClick={() => setQuincenaOffset(o => o - 1)}>‹</button>
            {quincenaOffset < 0 && <button style={{ background: 'transparent', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontSize: 16, padding: '0 4px' }} onClick={() => setQuincenaOffset(o => o + 1)}>›</button>}
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>

        {/* Total a pagar - card dorada */}
        <div style={{ background: 'linear-gradient(135deg, #C9924A 0%, #8B6230 100%)', borderRadius: 16, padding: '24px 20px', position: 'relative', overflow: 'hidden', gridColumn: '1' }}>
          <div style={{ position: 'absolute', right: -20, top: -20, fontSize: 80, opacity: 0.15 }}>💰</div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Total a pagar esta quincena</div>
          <div style={{ color: '#fff', fontSize: 32, fontWeight: 700 }}>${totalPagar.toFixed(2)} <span style={{ fontSize: 16, fontWeight: 400 }}>USD</span></div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 6 }}>{quincena.label}</div>
        </div>

        {/* Tokens generados */}
        <div style={{ background: 'var(--bg2)', borderRadius: 16, padding: '24px 20px', border: '1px solid var(--border2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 20 }}>🪙</span>
            <span style={{ color: 'var(--text-sub)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}>Tokens generados</span>
          </div>
          <div style={{ color: 'var(--text)', fontSize: 28, fontWeight: 700 }}>{totalTokensEstudio.toLocaleString()}</div>
          <div style={{ color: 'var(--text-sub)', fontSize: 12, marginTop: 4 }}>${(totalTokensEstudio / 20).toFixed(2)} USD</div>
        </div>

        {/* Proyección */}
        <div style={{ background: 'var(--bg2)', borderRadius: 16, padding: '24px 20px', border: '1px solid var(--border2)', display: 'none' }} className="nm-hide-mobile">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 20 }}>📈</span>
            <span style={{ color: 'var(--text-sub)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}>Proyección quincena</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ color: 'var(--gold)', fontSize: 28, fontWeight: 700 }}>{proyeccionTokens.toLocaleString()}</div>
            {pctCambio !== null && (
              <span style={{ background: pctCambio >= 0 ? 'rgba(76,175,125,0.15)' : 'rgba(192,97,74,0.15)', color: pctCambio >= 0 ? '#4CAF7D' : '#C0614A', fontSize: 11, padding: '3px 8px', borderRadius: 20, fontWeight: 600 }}>
                {pctCambio >= 0 ? '+' : ''}{pctCambio}%
              </span>
            )}
          </div>
          <button style={{ background: 'transparent', border: 'none', color: 'var(--text-sub)', fontSize: 11, cursor: 'pointer', padding: 0, marginTop: 6, textDecoration: 'underline' }} onClick={() => setQuincenaOffset(o => o - 1)}>
            Ver quincena anterior
          </button>
        </div>
      </div>

      {/* Ranking */}
      {ranking.length > 0 && (
        <div style={{ background: 'var(--bg2)', borderRadius: 14, padding: '16px 20px', border: '1px solid var(--border2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22 }}>🏆</span>
              <div>
                <div style={{ color: 'var(--text-sub)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}>Ranking por tokens</div>
                {topModelo && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                    <span style={{ color: 'var(--text)', fontSize: 13, fontWeight: 500 }}>{topModelo.nombre}</span>
                    <div style={{ flex: 1, minWidth: 120, background: 'var(--bg3)', borderRadius: 20, height: 8, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: 'var(--gold)', borderRadius: 20, width: '100%' }} />
                    </div>
                    <span style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 600 }}>{topModelo.totalTokens.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
            <button style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--text)', padding: '8px 10px', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }} onClick={() => setRankingAbierto(r => !r)}>
              {rankingAbierto ? 'Ocultar' : 'Ver ranking'}
            </button>
          </div>
          {rankingAbierto && (
            <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ranking.map((m, i) => (
                <div key={m.nombre} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: i === 0 ? '#C9924A' : 'var(--text-dim)', fontSize: 12, fontWeight: 700, minWidth: 20 }}>#{i + 1}</span>
                  <span style={{ color: 'var(--text)', fontSize: 12, flex: 1 }}>{m.nombre}</span>
                  <div style={{ width: 120, background: 'var(--bg3)', borderRadius: 20, height: 6, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'var(--gold)', borderRadius: 20, width: `${Math.round((m.totalTokens / maxRank) * 100)}%` }} />
                  </div>
                  <span style={{ color: 'var(--gold)', fontSize: 12, fontWeight: 600, minWidth: 60, textAlign: 'right' }}>{m.totalTokens.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Turnos */}
      {Object.entries(MODELOS_POR_TURNO).map(([turno, modelos]) => {
        const modelosTurno = resumen.filter(m => modelos.includes(m.nombre));
        const totalTurno = modelosTurno.reduce((acc, m) => acc + parseFloat(m.usdNeto), 0);
        const tokensTurno = modelosTurno.reduce((acc, m) => acc + m.totalTokens, 0);
        return (
          <div key={turno}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>{TURNO_ICONO[turno]}</span>
                <span style={{ color: 'var(--gold)', fontSize: 18, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Turno {turno}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: 'var(--text-sub)', fontSize: 12 }}>{tokensTurno.toLocaleString()} tokens · <span style={{ color: 'var(--gold)', fontWeight: 600 }}>${totalTurno.toFixed(2)} USD</span></span>
                <div style={{ display: 'flex', gap: 3, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: 3 }}>
                  <button style={{ background: vistaGrid ? 'var(--bg3)' : 'transparent', border: 'none', borderRadius: 6, color: vistaGrid ? 'var(--gold)' : 'var(--text-sub)', padding: '5px 9px', cursor: 'pointer', fontSize: 15 }} onClick={() => setVistaGrid(true)}>⊞</button>
                  <button style={{ background: !vistaGrid ? 'var(--bg3)' : 'transparent', border: 'none', borderRadius: 6, color: !vistaGrid ? 'var(--gold)' : 'var(--text-sub)', padding: '5px 9px', cursor: 'pointer', fontSize: 15 }} onClick={() => setVistaGrid(false)}>☰</button>
                </div>
              </div>
            </div>
            <div className={vistaGrid ? 'nm-grid-cards' : ''} style={!vistaGrid ? { display: 'flex', flexDirection: 'column', gap: 10 } : {}}>
              {modelosTurno.map(m => {
                const badgeStyle = getBadgeStyle(m.porcentaje);
                return (
                  <div key={m.nombre} style={{ background: 'var(--bg2)', borderRadius: 12, padding: 16, border: '1px solid var(--border2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 18, background: 'var(--bg3)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', fontSize: 16, flexShrink: 0 }}>👤</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600 }}>{m.nombre}</div>
                      </div>
                      <div style={{ width: 8, height: 8, borderRadius: 4, background: m.totalTokens > 0 ? '#4CAF7D' : 'var(--text-dim)' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-sub)', fontSize: 12 }}>Dias trabajados</span>
                      <span style={{ color: 'var(--text)', fontSize: 12 }}>{m.diasTrabajados}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-sub)', fontSize: 12 }}>Horas</span>
                      <span style={{ color: 'var(--text)', fontSize: 12 }}>{m.horasTrabajadas} / {m.horasRequeridas} hrs</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-sub)', fontSize: 12 }}>Tokens</span>
                      <span style={{ color: 'var(--text)', fontSize: 12 }}>{m.totalTokens.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10 }}>
                      <span style={{ ...badgeStyle, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{m.porcentaje}%</span>
                      <span style={{ color: 'var(--gold)', fontSize: 14, fontWeight: 700 }}>${m.usdNeto} USD</span>
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