import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

const nm = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 14 },
  card: { background: '#1a1a2e', borderRadius: 14, padding: 20, boxShadow: '4px 4px 8px #0d0d1a, -4px -4px 8px #272742' },
  label: { color: '#555577', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
  valor: { color: '#C9A84C', fontSize: 28, fontWeight: 500, letterSpacing: 1 },
  valorSub: { color: '#888899', fontSize: 14, marginTop: 4 },
  fila: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1f1f35' },
  filaLabel: { color: '#555577', fontSize: 13 },
  filaValor: { color: '#888899', fontSize: 13 },
  porcentajeBadge: { background: '#C9A84C22', color: '#C9A84C', padding: '4px 12px', borderRadius: 20, fontSize: 12, letterSpacing: 1 },
  titulo: { color: '#C9A84C', fontSize: 14, fontWeight: 500, letterSpacing: 1, marginBottom: 16 },
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

export default function Nomina({ nombreModelo }) {
  const [cierres, setCierres] = useState([]);
  const [asistencia, setAsistencia] = useState({});
  const [metas, setMetas] = useState({});
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
    return () => { unsub1(); unsub2(); unsub3(); };
  }, []);

  const calcularTotales = () => {
    let totalTokens = 0;
    let diasTrabajados = 0;
    let horasTrabajadas = 0;

    const fechasAsistencia = Object.values(asistencia).filter(a =>
      a.modelo === nombreModelo &&
      a.presente === true &&
      a.fecha >= quincena.inicio &&
      a.fecha <= quincena.fin
    );
    diasTrabajados = fechasAsistencia.length;

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
    return { totalTokens, diasTrabajados, horasTrabajadas: horasTrabajadas.toFixed(1), horasRequeridas: horasRequeridas.toFixed(1), porcentaje, usdBruto: usdBruto.toFixed(2), usdNeto: usdNeto.toFixed(2) };
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
    <div style={nm.wrap}>
      <div style={nm.card}>
        <div style={nm.label}>Quincena actual</div>
        <div style={{ ...nm.valorSub, marginTop: 0 }}>{quincena.label}</div>
      </div>

      <div style={nm.card}>
        <div style={nm.titulo}>Mi resumen</div>
        <div style={nm.fila}>
          <div style={nm.filaLabel}>Dias trabajados</div>
          <div style={nm.filaValor}>{t.diasTrabajados} dias</div>
        </div>
        <div style={nm.fila}>
          <div style={nm.filaLabel}>Horas trabajadas</div>
          <div style={nm.filaValor}>{t.horasTrabajadas} hrs</div>
        </div>
        <div style={nm.fila}>
          <div style={nm.filaLabel}>Horas requeridas</div>
          <div style={nm.filaValor}>{t.horasRequeridas} hrs</div>
        </div>
        <div style={nm.fila}>
          <div style={nm.filaLabel}>Tokens totales</div>
          <div style={nm.filaValor}>{t.totalTokens.toLocaleString()}</div>
        </div>
        <div style={{ ...nm.fila, borderBottom: 'none' }}>
          <div style={nm.filaLabel}>Porcentaje</div>
          <div style={nm.porcentajeBadge}>{t.porcentaje}%</div>
        </div>
      </div>

      <div style={nm.card}>
        <div style={nm.label}>Lo que llevarias hoy</div>
        <div style={nm.valor}>${t.usdNeto} USD</div>
        <div style={nm.valorSub}>de ${t.usdBruto} USD brutos</div>
      </div>

      {meta > 0 && (
        <div style={nm.card}>
          <div style={nm.titulo}>Predictor de meta</div>
          <div style={nm.fila}>
            <div style={nm.filaLabel}>Meta quincenal</div>
            <div style={nm.filaValor}>{meta.toLocaleString()} tokens</div>
          </div>
          <div style={nm.fila}>
            <div style={nm.filaLabel}>Tokens que llevas</div>
            <div style={nm.filaValor}>{t.totalTokens.toLocaleString()} tokens</div>
          </div>
          <div style={nm.fila}>
            <div style={nm.filaLabel}>Dias restantes</div>
            <div style={nm.filaValor}>{p.diasRestantes} dias</div>
          </div>
          <div style={{ ...nm.fila, borderBottom: 'none' }}>
            <div style={nm.filaLabel}>Necesitas por dia</div>
            <div style={{ color: p.tokensNecesarios <= 0 ? '#1d9e75' : '#C9A84C', fontSize: 18, fontWeight: 500 }}>
              {p.tokensNecesarios <= 0 ? 'Meta cumplida!' : p.porDia.toLocaleString() + ' tokens'}
            </div>
          </div>
        </div>
      )}
    <ModelaPedidos nombreModelo={nombreModelo} />
    </div>
  );
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
    <div style={{ background: 'var(--bg)', borderRadius: 14, padding: 20, boxShadow: '4px 4px 8px var(--shadow1), -4px -4px 8px var(--shadow2)', marginTop: 4 }}>
      <div style={{ color: '#C9A84C', fontSize: 14, fontWeight: 500, letterSpacing: 1, marginBottom: 16 }}>Mis pedidos esta quincena</div>
      {pedidos.map(p => (
        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
          <div>
            <div style={{ color: 'var(--text)', fontSize: 13 }}>{p.producto}</div>
            <div style={{ color: 'var(--text-sub)', fontSize: 11 }}>{p.cuotas > 1 ? '2 cuotas' : 'Pago completo'} · {p.hora}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: p.estado === 'cancelado' ? 'var(--text-dim)' : '#d85a30', fontSize: 13, fontWeight: 500 }}>
              {p.estado === 'cancelado' ? 'Cancelado' : '-$' + p.precio?.toLocaleString()}
            </div>
            {p.cuotas > 1 && p.estado !== 'cancelado' && (
              <div style={{ color: 'var(--text-sub)', fontSize: 11 }}>Esta quincena: -${Math.ceil(p.precio / 2).toLocaleString()}</div>
            )}
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 8 }}>
        <div style={{ color: 'var(--text-sub)', fontSize: 13 }}>Total descuentos</div>
        <div style={{ color: '#d85a30', fontSize: 14, fontWeight: 500 }}>-${total.toLocaleString()}</div>
      </div>
    </div>
  );
}