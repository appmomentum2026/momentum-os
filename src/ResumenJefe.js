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

const nm = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: { background: '#1a1a2e', borderRadius: 14, padding: 16, boxShadow: '4px 4px 8px #0d0d1a, -4px -4px 8px #272742' },
  nombre: { color: '#C9A84C', fontSize: 13, fontWeight: 500, marginBottom: 10 },
  fila: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1f1f35' },
  filaLabel: { color: '#555577', fontSize: 12 },
  filaValor: { color: '#888899', fontSize: 12 },
  badge: { padding: '3px 10px', borderRadius: 20, fontSize: 11, letterSpacing: 1, fontWeight: 500 },
  totalCard: { background: '#1a1a2e', borderRadius: 14, padding: 16, boxShadow: 'inset 3px 3px 6px #0d0d1a, inset -3px -3px 6px #272742', marginBottom: 16 },
  totalLabel: { color: '#555577', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  totalValor: { color: '#C9A84C', fontSize: 24, fontWeight: 500 }
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

function getBadgeColor(porcentaje) {
  if (porcentaje === 70) return { background: '#1d9e7522', color: '#1d9e75' };
  if (porcentaje === 65) return { background: '#C9A84C22', color: '#C9A84C' };
  if (porcentaje === 60) return { background: '#4466AA22', color: '#4466AA' };
  return { background: '#d85a3022', color: '#d85a30' };
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
    <div style={nm.wrap}>
      <div style={nm.totalCard}>
        <div style={nm.totalLabel}>Total a pagar esta quincena</div>
        <div style={nm.totalValor}>${totalPagar.toFixed(2)} USD</div>
        <div style={{ color: '#555577', fontSize: 12, marginTop: 4 }}>{quincena.label}</div>
      </div>

      {resumen.map(m => {
        const badgeColor = getBadgeColor(m.porcentaje);
        return (
          <div key={m.nombre} style={nm.card}>
            <div style={nm.nombre}>{m.nombre}</div>
            <div style={nm.fila}>
              <div style={nm.filaLabel}>Dias trabajados</div>
              <div style={nm.filaValor}>{m.diasTrabajados}</div>
            </div>
            <div style={nm.fila}>
              <div style={nm.filaLabel}>Horas</div>
              <div style={nm.filaValor}>{m.horasTrabajadas} / {m.horasRequeridas} hrs</div>
            </div>
            <div style={nm.fila}>
              <div style={nm.filaLabel}>Tokens</div>
              <div style={nm.filaValor}>{m.totalTokens.toLocaleString()}</div>
            </div>
            <div style={{ ...nm.fila, borderBottom: 'none', alignItems: 'center' }}>
              <div style={{ ...nm.badge, ...badgeColor }}>{m.porcentaje}%</div>
              <div style={{ color: '#C9A84C', fontSize: 14, fontWeight: 500 }}>${m.usdNeto} USD</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}