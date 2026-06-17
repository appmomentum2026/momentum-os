import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot } from 'firebase/firestore';

function getQuincena() {
  const hoy = new Date();
  const dia = hoy.getDate();
  const mes = hoy.getMonth();
  const anio = hoy.getFullYear();
  if (dia <= 15) {
    return {
      inicio: new Date(anio, mes, 1).toISOString().split('T')[0],
      fin: new Date(anio, mes, 15).toISOString().split('T')[0],
      label: `1 - 15 de ${hoy.toLocaleString('es-CO', { month: 'long' })}`,
      dias: 15
    };
  } else {
    const ultimoDia = new Date(anio, mes + 1, 0).getDate();
    return {
      inicio: new Date(anio, mes, 16).toISOString().split('T')[0],
      fin: new Date(anio, mes, ultimoDia).toISOString().split('T')[0],
      label: `16 - ${ultimoDia} de ${hoy.toLocaleString('es-CO', { month: 'long' })}`,
      dias: ultimoDia - 15
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

  // Calcular totales
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
  const usdNetoFinal = Math.max(0, usdNeto - descuentoUSD).toFixed(2);
  const meta = metas[nombreModelo]?.tokens || 0;
  const hoy = new Date();
  const finQuincena = new Date(quincena.fin);
  const diasRestantes = Math.max(0, Math.ceil((finQuincena - hoy) / (1000 * 60 * 60 * 24)));
  const tokensNecesarios = Math.max(0, meta - totalTokens);
  const porDia = diasRestantes > 0 ? Math.ceil(tokensNecesarios / diasRestantes) : 0;
  const pctMeta = meta > 0 ? Math.min(100, Math.round((totalTokens / meta) * 100)) : 0;
  const pctDias = quincena.dias > 0 ? Math.min(100, Math.round((diasTrabajados / quincena.dias) * 100)) : 0;
  const horasReqTotal = quincena.dias * 6.5;
  const pctHoras = horasReqTotal > 0 ? Math.min(100, Math.round((horasTrabajadas / horasReqTotal) * 100)) : 0;

  const misPedidos = pedidos.filter(p => p.modelo === nombreModelo);

  const barraWrap = { background: 'var(--bg3)', borderRadius: 20, height: 6, marginTop: 6, overflow: 'hidden' };
  const barraFill = (pct, color) => ({ height: '100%', width: `${pct}%`, background: color || 'var(--gold)', borderRadius: 20, transition: 'width 0.4s' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ color: 'var(--text)', fontSize: 24, fontWeight: 700 }}>Mi nómina en vivo</div>
          <div style={{ color: 'var(--text-sub)', fontSize: 13, marginTop: 2 }}>Resumen de tu quincena actual</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 10, padding: '8px 14px' }}>
          <span style={{ fontSize: 14 }}>📅</span>
          <span style={{ color: 'var(--text)', fontSize: 12 }}>{quincena.label}</span>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 12 }}>

        {/* Lo que llevas ganado */}
        <div style={{ background: 'linear-gradient(135deg, #C9924A 0%, #8B6230 100%)', borderRadius: 16, padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -10, top: -10, fontSize: 80, opacity: 0.15 }}>💰</div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Lo que llevas ganado</div>
          <div style={{ color: '#fff', fontSize: 32, fontWeight: 700 }}>${usdNetoFinal} <span style={{ fontSize: 16, fontWeight: 400 }}>USD</span></div>
          {totalDescuentos > 0 && (
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 6 }}>Incluye -{totalDescuentos.toLocaleString()} COP en pedidos</div>
          )}
        </div>

        {/* Meta quincenal */}
        <div style={{ background: 'var(--bg2)', borderRadius: 16, padding: '20px 18px', border: '1px solid var(--border2)' }}>
          <div style={{ color: 'var(--text-sub)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Meta quincenal</div>
          <div style={{ color: 'var(--text)', fontSize: 22, fontWeight: 700 }}>{totalTokens.toLocaleString()} <span style={{ color: 'var(--text-sub)', fontSize: 13 }}>/ {meta > 0 ? meta.toLocaleString() : '—'} tokens</span></div>
          <div style={barraWrap}><div style={barraFill(pctMeta)} /></div>
          <div style={{ color: 'var(--text-sub)', fontSize: 12, marginTop: 8 }}>
            {meta > 0 ? `Necesitas ${porDia.toLocaleString()} tokens por día` : 'Sin meta asignada'}
          </div>
        </div>

        {/* Días restantes */}
        <div style={{ background: 'var(--bg2)', borderRadius: 16, padding: '20px 18px', border: '1px solid var(--border2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, borderRadius: 26, background: 'rgba(201,146,74,0.15)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 8 }}>📅</div>
          <div style={{ color: 'var(--gold)', fontSize: 28, fontWeight: 700 }}>{diasRestantes}</div>
          <div style={{ color: 'var(--text-sub)', fontSize: 12 }}>días restantes</div>
          <div style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 2 }}>para completar tu meta</div>
        </div>
      </div>

      {/* Mi resumen + Progreso meta */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 12 }}>

        {/* Mi resumen */}
        <div style={{ background: 'var(--bg2)', borderRadius: 16, padding: '20px 18px', border: '1px solid var(--border2)' }}>
          <div style={{ color: 'var(--text-sub)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>Mi resumen</div>

          {[
            { icon: '📅', label: 'Días trabajados', val: `${diasTrabajados} / ${quincena.dias} días`, pct: pctDias, color: 'var(--gold)' },
            { icon: '⏰', label: 'Horas trabajadas', val: `${horasTrabajadas.toFixed(1)} / ${horasReqTotal.toFixed(1)} hrs`, pct: pctHoras, color: '#4CAF7D' },
            { icon: '📋', label: 'Horas requeridas', val: `${horasRequeridas.toFixed(1)} / ${horasReqTotal.toFixed(1)} hrs`, pct: Math.min(100, Math.round((horasRequeridas / horasReqTotal) * 100)), color: '#6A8AAA' },
            { icon: '🏆', label: 'Porcentaje de avance', val: `${porcentaje}%`, pct: porcentaje, color: 'var(--gold)' },
          ].map((item, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  <span style={{ color: 'var(--text-sub)', fontSize: 12 }}>{item.label}</span>
                </div>
                <span style={{ color: item.color, fontSize: 13, fontWeight: 600 }}>{item.val}</span>
              </div>
              <div style={barraWrap}><div style={barraFill(item.pct, item.color)} /></div>
            </div>
          ))}
        </div>

        {/* Progreso de meta */}
        <div style={{ background: 'var(--bg2)', borderRadius: 16, padding: '20px 18px', border: '1px solid var(--border2)' }}>
          <div style={{ color: 'var(--text-sub)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>Progreso de tu meta</div>
          {meta > 0 ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'var(--text-sub)', fontSize: 12 }}>Tokens acumulados</span>
                <span style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 600 }}>{pctMeta}%</span>
              </div>
              <div style={{ background: 'var(--bg3)', borderRadius: 12, height: 12, overflow: 'hidden', marginBottom: 16 }}>
                <div style={{ height: '100%', width: `${pctMeta}%`, background: pctMeta >= 100 ? '#4CAF7D' : 'var(--gold)', borderRadius: 12, transition: 'width 0.4s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: 'var(--text-sub)', fontSize: 11 }}>0</span>
                <span style={{ color: 'var(--gold)', fontSize: 11, fontWeight: 600 }}>Meta: {meta.toLocaleString()} tokens</span>
              </div>
              <div style={{ background: 'rgba(201,146,74,0.08)', border: '1px solid var(--border2)', borderRadius: 12, padding: 14, marginTop: 12, textAlign: 'center' }}>
                <div style={{ color: 'var(--text-sub)', fontSize: 11, marginBottom: 4 }}>Llevas acumulados</div>
                <div style={{ color: 'var(--gold)', fontSize: 24, fontWeight: 700 }}>{totalTokens.toLocaleString()}</div>
                <div style={{ color: 'var(--text-sub)', fontSize: 11, marginTop: 4 }}>tokens esta quincena</div>
              </div>
              {pctMeta >= 100 && (
                <div style={{ background: 'rgba(76,175,125,0.1)', border: '1px solid rgba(76,175,125,0.3)', borderRadius: 10, padding: 10, marginTop: 10, textAlign: 'center', color: '#4CAF7D', fontSize: 13 }}>
                  🎉 Meta cumplida!
                </div>
              )}
            </>
          ) : (
            <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: 30, fontSize: 13 }}>Sin meta asignada para esta quincena</div>
          )}
        </div>
      </div>

      {/* Mis pedidos */}
      {misPedidos.length > 0 && (
        <div style={{ background: 'var(--bg2)', borderRadius: 16, padding: '20px 18px', border: '1px solid var(--border2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ color: 'var(--text-sub)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' }}>Mis pedidos esta quincena</div>
            <div style={{ display: 'flex', gap: 20 }}>
              <span style={{ color: 'var(--text-sub)', fontSize: 11 }}>Estado</span>
              <span style={{ color: 'var(--text-sub)', fontSize: 11 }}>Monto</span>
            </div>
          </div>
          {misPedidos.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg3)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🛍️</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'var(--text)', fontSize: 13, fontWeight: 500 }}>{p.producto}</div>
                <div style={{ color: 'var(--text-sub)', fontSize: 11, marginTop: 2 }}>{p.cuotas > 1 ? '2 cuotas' : 'Pago completo'} · {p.hora}</div>
              </div>
              <span style={{ color: p.estado === 'cancelado' ? '#C0614A' : p.estado === 'entregado' ? '#4CAF7D' : 'var(--gold)', fontSize: 12, fontWeight: 500, minWidth: 80, textAlign: 'right' }}>
                {p.estado === 'cancelado' ? 'Cancelado' : p.estado === 'entregado' ? 'Completado' : 'Pendiente'}
              </span>
              <span style={{ color: p.estado === 'cancelado' ? 'var(--text-dim)' : '#C0614A', fontSize: 13, fontWeight: 600, minWidth: 80, textAlign: 'right' }}>
                {p.estado === 'cancelado' ? '$0' : `-$${p.precio?.toLocaleString()}`}
              </span>
            </div>
          ))}
          {totalDescuentos > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 80, marginTop: 12, paddingTop: 8 }}>
              <span style={{ color: 'var(--text-sub)', fontSize: 12 }}>Total descuentos</span>
              <span style={{ color: '#C0614A', fontSize: 14, fontWeight: 600 }}>-${totalDescuentos.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}

    </div>
  );
}