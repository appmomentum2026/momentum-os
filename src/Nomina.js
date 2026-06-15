import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

const s = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 12 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  card: { background: 'var(--bg2)', borderRadius: 14, padding: 20, border: '1px solid var(--border2)' },
  label: { color: 'var(--text-sub)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
  valor: { color: 'var(--gold)', fontSize: 28, fontWeight: 500 },
  fila: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' },
  filaLabel: { color: 'var(--text-sub)', fontSize: 13 },
  filaValor: { color: 'var(--text)', fontSize: 13 },
  porcentajeBadge: { background: 'rgba(201,146,74,0.15)', color: 'var(--gold)', padding: '4px 12px', borderRadius: 20, fontSize: 12, letterSpacing: 1 },
  titulo: { color: 'var(--gold)', fontSize: 14, fontWeight: 500, letterSpacing: 0.5, marginBottom: 14 },
  pedidoRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' },
  pedidoNombre: { color: 'var(--text)', fontSize: 13 },
  pedidoSub: { color: 'var(--text-sub)', fontSize: 11 },
  vacio: { color: 'var(--text-dim)', textAlign: 'center', padding: 24, fontSize: 13 }
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

function ModelaPedidos({ nombreModelo }) {
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'pedidos'), orderBy('fecha', 'desc'));
    const unsub = onSnapshot(q, snap => {
      const data = [];
      snap.forEach(d => {
        const p = { id: d.id, ...d.data() };
        if (p.modelo === nombreModelo) data.push(p);
      });
      setPedidos(data);
    });
    return unsub;
  }, [nombreModelo]);

  if (pedidos.length === 0) return null;

  const total = pedidos.filter(p => p.estado !== 'cancelado').reduce((acc, p) => acc + (p.precio || 0), 0);

  return (
    <div style={s.card}>
      <div style={s.titulo}>Mis pedidos esta quincena</div>
      {pedidos.map(p => (
        <div key={p.id} style={s.pedidoRow}>
          <div>
            <div style={s.pedidoNombre}>{p.producto}</div>
            <div style={s.pedidoSub}>{p.cuotas > 1 ? '2 cuotas' : 'Pago completo'} · {p.hora}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: p.estado === 'cancelado' ? 'var(--text-dim)' : '#C0614A', fontSize: 13, fontWeight: 500 }}>
              {p.estado === 'cancelado' ? 'Cancelado' : '-$' + p.precio?.toLocaleString()}
            </div>
            {p.cuotas > 1 && p.estado !== 'cancelado' && (
              <div style={s.pedidoSub}>Esta quincena: -${Math.ceil(p.precio / 2).toLocaleString()}</div>
            )}
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 8 }}>
        <div style={s.filaLabel}>Total descuentos</div>
        <div style={{ color: '#C0614A', fontSize: 14, fontWeight: 500 }}>-${total.toLocaleString()}</div>
      </div>
    </div>
  );
}

export default function Nomina({ nombreModelo }) {
  const [cierres, setCierres] = useState([]);
  const [asistencia, setAsistencia] = useState({});
  const [metas, setMetas] = useState({});
  const [pedidos, setPedidos] = useState([]);
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
    const unsub3 = onSnapshot(collection(db, 'metas'), snap => {
      const data = {};
      snap.forEach(d => { data[d.id] = d.data(); });
      setMetas(data);
    });
    const unsub4 = onSnapshot(collection(db, 'pedidos'), snap => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      setPedidos(data);
    });
    return () => { unsub1(); unsub2(); unsub3(); unsub4(); };
  }, []);

  const calcularTotales = () => {
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
    const totalDescuentos = pedidos
      .filter(p => p.modelo === nombreModelo && p.estado !== 'cancelado')
      .reduce((acc, p) => acc + (p.precio || 0), 0);
    const descuentoUSD = totalDescuentos / 4000;
    const usdNetoFinal = Math.max(0, usdNeto - descuentoUSD);
    return { totalTokens, diasTrabajados, horasTrabajadas: horasTrabajadas.toFixed(1), horasRequeridas: horasRequeridas.toFixed(1), porcentaje, usdNeto: usdNetoFinal.toFixed(2), totalDescuentos };
  };

  const t = calcularTotales();
  const meta = metas[nombreModelo]?.tokens || 0;

  const calcularPredictor = () => {
    const hoy = new Date();
    const finQuincena = new Date(quincena.fin);
    const diasRestantes = Math.max(1, Math.ceil((finQuincena - hoy) / (1000 * 60 * 60 * 24)));
    const tokensNecesarios = Math.max(0, meta - t.totalTokens);
    const porDia = diasRestantes > 0 ? Math.ceil(tokensNecesarios / diasRestantes) : 0;
    return { diasRestantes, tokensNecesarios, porDia };
  };

  const p = calcularPredictor();

  return (
    <div style={s.wrap}>

      <div style={s.grid2}>
        <div style={s.card}>
          <div style={s.label}>Quincena actual</div>
          <div style={{ color: 'var(--text)', fontSize: 14 }}>{quincena.label}</div>
        </div>

        <div style={s.card}>
          <div style={s.label}>Lo que llevas ganado</div>
          <div style={s.valor}>${t.usdNeto} USD</div>
          {t.totalDescuentos > 0 && (
            <div style={{ color: '#C0614A', fontSize: 12, marginTop: 6 }}>
              Incluye -{t.totalDescuentos.toLocaleString()} COP en pedidos
            </div>
          )}
        </div>
      </div>

      <div style={s.grid2}>
        <div style={s.card}>
          <div style={s.titulo}>Mi resumen</div>
          <div style={s.fila}><div style={s.filaLabel}>Dias trabajados</div><div style={s.filaValor}>{t.diasTrabajados} dias</div></div>
          <div style={s.fila}><div style={s.filaLabel}>Horas trabajadas</div><div style={s.filaValor}>{t.horasTrabajadas} hrs</div></div>
          <div style={s.fila}><div style={s.filaLabel}>Horas requeridas</div><div style={s.filaValor}>{t.horasRequeridas} hrs</div></div>
          <div style={s.fila}><div style={s.filaLabel}>Tokens totales</div><div style={s.filaValor}>{t.totalTokens.toLocaleString()}</div></div>
          <div style={{ ...s.fila, borderBottom: 'none' }}>
            <div style={s.filaLabel}>Porcentaje</div>
            <div style={s.porcentajeBadge}>{t.porcentaje}%</div>
          </div>
        </div>

        {meta > 0 ? (
          <div style={s.card}>
            <div style={s.titulo}>Predictor de meta</div>
            <div style={s.fila}><div style={s.filaLabel}>Meta quincenal</div><div style={s.filaValor}>{meta.toLocaleString()} tokens</div></div>
            <div style={s.fila}><div style={s.filaLabel}>Tokens que llevas</div><div style={s.filaValor}>{t.totalTokens.toLocaleString()} tokens</div></div>
            <div style={s.fila}><div style={s.filaLabel}>Dias restantes</div><div style={s.filaValor}>{p.diasRestantes} dias</div></div>
            <div style={{ ...s.fila, borderBottom: 'none' }}>
              <div style={s.filaLabel}>Necesitas por dia</div>
              <div style={{ color: p.tokensNecesarios <= 0 ? '#4CAF7D' : 'var(--gold)', fontSize: 18, fontWeight: 500 }}>
                {p.tokensNecesarios <= 0 ? 'Meta cumplida!' : p.porDia.toLocaleString() + ' tokens'}
              </div>
            </div>
          </div>
        ) : <div />}
      </div>

      <ModelaPedidos nombreModelo={nombreModelo} />
    </div>
  );
}