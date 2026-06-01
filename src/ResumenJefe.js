import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot } from 'firebase/firestore';

const MODELOS_TODAS = [
  'Ashly Naibel Burgos Machado', 'Ana Sofia Ospina Ortega', 'Tatiana Andrea Rios Hurtado',
  'Luz Magnolia Salazar Garcia', 'Vanessa Arroyave', 'Valentina Osorno Alvarez',
  'Sara Arango Zuleta', 'Valentina Zapata Azcuntar', 'Alejandra Rojas Vargas',
  'Maye Catalina Insuasty Saldariaga', 'Juliana Ospina Jimenez', 'Liliana Castillo Salgado',
  'Nicoll Pulgarin Nohava', 'Alison Daniela Zapata Estrada', 'Evelyn Tamayo Zapata',
  'Valentina Marquez Pino', 'Susana Pelaez', 'Ivonne Camila Zuluaga Prieto',
  'Evelin Saday Ricardo Solis', 'Luisa Fernanda Osorio Jimenez',
  'Natalia Hernandez Llano', 'Maria Camila Correa Munoz', 'Nataly Cardenas Moreno',
  'Dayannis Tobon Acosta', 'Diana Luz Agamez Gonzalez', 'Asoryana Ramos Briseno', 'Yesmi Diaz Ruiz',
  'Andrea Carolina Gomez Rodelo', 'Viviana Marcela Zambrano Mosquera', 'Sofia del Pilar Herrera Celis',
  'Angie Marcela Villa Carmona', 'Isabela Gutierrez Rivera', 'Alexa Rivera Montoya',
  'Yeimy Viviana Osorio Rojas', 'Maria Jose Lopez Mejia', 'Sara Paulina Mejia Marin',
  'Luisa Fernanda Rodriguez Calderon'
];

const s = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 10 },
  totalCard: { background: 'var(--bg2)', borderRadius: 14, padding: 16, border: '1px solid var(--border)', marginBottom: 6 },
  totalLabel: { color: 'var(--text-sub)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  totalValor: { color: 'var(--gold)', fontSize: 28, fontWeight: 500 },
  totalSub: { color: 'var(--text-dim)', fontSize: 12, marginTop: 4 },
  card: { background: 'var(--bg2)', borderRadius: 12, padding: 14, border: '1px solid var(--border)' },
  nombre: { color: 'var(--gold)', fontSize: 13, fontWeight: 500, marginBottom: 10 },
  fila: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' },
  filaLabel: { color: 'var(--text-sub)', fontSize: 12 },
  filaValor: { color: 'var(--text)', fontSize: 12 },
  badge: { padding: '3px 10px', borderRadius: 20, fontSize: 11, letterSpacing: 1, fontWeight: 500 },
};

function getQuincena() {
  const hoy = new Date();
  const dia = hoy.getDate();
  const mes = hoy.getMonth();
  const anio = hoy.getFullYear();
  if (dia <= 15) {
    return {
      inicio: new Date(anio, mes, 1).toISOString().split('T')[0],
      fin: new Date(anio, mes, 15).toISOString().split('T')[0],
      label: `1 - 15 de ${hoy.toLocaleString('es-CO', { month: 'long' })}`
    };
  } else {
    const ultimoDia = new Date(anio, mes + 1, 0).getDate();
    return {
      inicio: new Date(anio, mes, 16).toISOString().split('T')[0],
      fin: new Date(anio, mes, ultimoDia).toISOString().split('T')[0],
      label: `16 - ${ultimoDia} de ${hoy.toLocaleString('es-CO', { month: 'long' })}`
    };
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
  const quincena = getQuincena();

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

  const calcularModelo = (nombreModelo) => {
    let totalTokens = 0;
    let horasTrabajadas = 0;

    const fechasAsistencia = Object.values(asistencia).filter(a =>
      a.modelo === nombreModelo && a.presente === true &&
      a.fecha >= quincena.inicio && a.fecha <= quincena.fin
    );
    const diasTrabajados = fechasAsistencia.length;

    cierres.forEach(cierre => {
      if (cierre.fecha < quincena.inicio || cierre.fecha > quincena.fin + 'Z') return;
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
    const usdBruto = totalTokens / 20;
    const usdNeto = usdBruto * (porcentaje / 100);

    return { diasTrabajados, totalTokens, horasTrabajadas: horasTrabajadas.toFixed(1), horasRequeridas: horasRequeridas.toFixed(1), porcentaje, usdNeto: usdNeto.toFixed(2) };
  };

  const resumen = MODELOS_TODAS.map(m => ({ nombre: m, ...calcularModelo(m) }));
  const totalPagar = resumen.reduce((acc, m) => acc + parseFloat(m.usdNeto), 0);

  return (
    <div style={s.wrap}>
      <div style={s.totalCard}>
        <div style={s.totalLabel}>Total a pagar esta quincena</div>
        <div style={s.totalValor}>${totalPagar.toFixed(2)} USD</div>
        <div style={s.totalSub}>{quincena.label}</div>
      </div>

      {resumen.map(m => {
        const badgeStyle = getBadgeStyle(m.porcentaje);
        return (
          <div key={m.nombre} style={s.card}>
            <div style={s.nombre}>{m.nombre}</div>
            <div style={s.fila}><div style={s.filaLabel}>Dias trabajados</div><div style={s.filaValor}>{m.diasTrabajados}</div></div>
            <div style={s.fila}><div style={s.filaLabel}>Horas</div><div style={s.filaValor}>{m.horasTrabajadas} / {m.horasRequeridas} hrs</div></div>
            <div style={s.fila}><div style={s.filaLabel}>Tokens</div><div style={s.filaValor}>{m.totalTokens.toLocaleString()}</div></div>
            <div style={{ ...s.fila, borderBottom: 'none', alignItems: 'center', paddingTop: 8 }}>
              <div style={{ ...s.badge, ...badgeStyle }}>{m.porcentaje}%</div>
              <div style={{ color: 'var(--gold)', fontSize: 14, fontWeight: 500 }}>${m.usdNeto} USD</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}