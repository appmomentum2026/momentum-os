import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot } from 'firebase/firestore';

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
    return {
      inicio: new Date(anio, mes, 1).toISOString().split('T')[0],
      fin: new Date(anio, mes, 15).toISOString().split('T')[0],
      label: `1 - 15 de ${mesNombre}`,
      dias: 15
    };
  } else {
    const ultimoDia = new Date(anio, mes + 1, 0).getDate();
    return {
      inicio: new Date(anio, mes, 16).toISOString().split('T')[0],
      fin: new Date(anio, mes, ultimoDia).toISOString().split('T')[0],
      label: `16 - ${ultimoDia} de ${mesNombre}`,
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

// Domingos dentro del rango de la quincena (fechas ISO 'YYYY-MM-DD')
function contarDomingos(inicioISO, finISO) {
  let count = 0;
  let d = new Date(inicioISO + 'T00:00:00');
  const fin = new Date(finISO + 'T00:00:00');
  while (d <= fin) {
    if (d.getDay() === 0) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

// Dias libres aprobados (colección diasLibres) de esa modelo dentro del rango
function contarDiasLibresAprobados(diasLibresList, nombreModelo, inicioISO, finISO) {
  let count = 0;
  diasLibresList.forEach(d => {
    if (d.tipo !== 'modelo' || d.modelo !== nombreModelo || d.estado !== 'aprobado') return;
    if (d.fecha1 && d.fecha1 >= inicioISO && d.fecha1 <= finISO) count++;
    if (d.fecha2 && d.fecha2 >= inicioISO && d.fecha2 <= finISO) count++;
  });
  return count;
}

// Dias laborales reales = dias de la quincena - domingos - dias libres aprobados
function calcularDiasLaborales(quincena, diasLibresList, nombreModelo) {
  const domingos = contarDomingos(quincena.inicio, quincena.fin);
  const libres = contarDiasLibresAprobados(diasLibresList, nombreModelo, quincena.inicio, quincena.fin);
  return Math.max(0, quincena.dias - domingos - libres);
}

export default function Nomina({ nombreModelo }) {
  const [cierres, setCierres] = useState([]);
  const [asistencia, setAsistencia] = useState({});
  const [metas, setMetas] = useState({});
  const [pedidos, setPedidos] = useState([]);
  const [diasLibres, setDiasLibres] = useState([]);
  const [quincenaOffset, setQuincenaOffset] = useState(0);
  const quincena = getQuincena(quincenaOffset);

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
    const unsub5 = onSnapshot(collection(db, 'diasLibres'), snap => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      setDiasLibres(data);
    });
    return () => { unsub1(); unsub2(); unsub3(); unsub4(); unsub5(); };
  }, []);

  // Calcular totales
  let totalTokens = 0;
  let horasTrabajadas = 0;
  const fechasAsistencia = Object.values(asistencia).filter(a =>
    a.modelo === nombreModelo && a.presente === true &&
    a.fecha >= quincena.inicio && a.fecha <= quincena.fin
  );
  const diasTrabajados = fechasAsistencia.length;
  const diasLabQuincena = calcularDiasLaborales(quincena, diasLibres, nombreModelo);

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

  // Pedidos: solo los pendientes (cualquier fecha) o los de la quincena seleccionada
  const misPedidos = pedidos.filter(p => {
    if (p.modelo !== nombreModelo) return false;
    if (p.estado === 'pendiente') return true;
    const fechaPedido = p.fecha?.split('T')[0] || '';
    return fechaPedido >= quincena.inicio && fechaPedido <= quincena.fin;
  });
  const totalDescuentos = misPedidos
    .filter(p => p.estado !== 'cancelado' && p.estado !== 'rechazado')
    .reduce((acc, p) => acc + (p.precio || 0), 0);
  const descuentoUSD = totalDescuentos / 4000;
  const usdNetoFinal = Math.max(0, usdNeto - descuentoUSD).toFixed(2);

  const metaUsd = metas[nombreModelo]?.usd || 0;
  const metaTokens = metaUsd * 20;
  const hoy = new Date();
  const finQuincena = new Date(quincena.fin);
  const diasRestantes = Math.max(0, Math.ceil((finQuincena - hoy) / (1000 * 60 * 60 * 24)));
  const tokensNecesarios = Math.max(0, metaTokens - totalTokens);
  const porDia = diasRestantes > 0 ? Math.ceil(tokensNecesarios / diasRestantes) : 0;
  const pctMeta = metaTokens > 0 ? Math.min(100, Math.round((totalTokens / metaTokens) * 100)) : 0;
  const pctDias = diasLabQuincena > 0 ? Math.min(100, Math.round((diasTrabajados / diasLabQuincena) * 100)) : 0;
  const horasReqTotal = diasLabQuincena * 6.5;
  const pctHoras = horasReqTotal > 0 ? Math.min(100, Math.round((horasTrabajadas / horasReqTotal) * 100)) : 0;

  const barraWrap = { background: 'var(--bg3)', borderRadius: 20, height: 6, marginTop: 6, overflow: 'hidden' };
  const barraFill = (pct, color) => ({ height: '100%', width: `${pct}%`, background: color || 'var(--gold)', borderRadius: 20, transition: 'width 0.4s' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ color: 'var(--text)', fontSize: 24, fontWeight: 700 }}>Mi nómina en vivo</div>
          <div style={{ color: 'var(--text-sub)', fontSize: 13, marginTop: 2 }}>Resumen de tu quincena</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 10, padding: '8px 14px' }}>
          <span style={{ fontSize: 14 }}>📅</span>
          <span style={{ color: 'var(--text)', fontSize: 12 }}>{quincena.label}</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button style={{ background: 'transparent', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontSize: 16, padding: '0 4px' }} onClick={() => setQuincenaOffset(o => o - 1)}>‹</button>
            {quincenaOffset < 0 && <button style={{ background: 'transparent', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontSize: 16, padding: '0 4px' }} onClick={() => setQuincenaOffset(o => o + 1)}>›</button>}
          </div>
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
          {metaUsd > 0 ? (
            <>
              <div style={{ color: 'var(--gold)', fontSize: 16, fontWeight: 700 }}>${metaUsd.toLocaleString()} USD</div>
              <div style={{ color: 'var(--text-dim)', fontSize: 11, marginBottom: 6 }}>({metaTokens.toLocaleString()} tokens)</div>
              <div style={{ color: 'var(--text)', fontSize: 15, fontWeight: 600 }}>{totalTokens.toLocaleString()} <span style={{ color: 'var(--text-sub)', fontSize: 12 }}>/ {metaTokens.toLocaleString()} tokens</span></div>
              <div style={barraWrap}><div style={barraFill(pctMeta, pctMeta >= 100 ? 'var(--green)' : 'var(--gold)')} /></div>
              <div style={{ color: 'var(--text-sub)', fontSize: 12, marginTop: 8 }}>
                {tokensNecesarios <= 0 ? 'Meta cumplida' : `Necesitas ${porDia.toLocaleString()} tokens por día`}
              </div>
            </>
          ) : (
            <div style={{ color: 'var(--text-dim)', fontSize: 13, marginTop: 8 }}>Sin meta asignada</div>
          )}
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
          <div style={{ color: 'var(--text-sub)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>Mi resumen</div>
          <div style={{ color: 'var(--text-dim)', fontSize: 11, marginBottom: 14 }}>{diasLabQuincena} días laborales esta quincena (sin domingos ni días libres aprobados)</div>

          {[
            { icon: '📅', label: 'Días trabajados', val: `${diasTrabajados} / ${diasLabQuincena} días`, pct: pctDias, color: 'var(--gold)' },
            { icon: '⏰', label: 'Horas trabajadas', val: `${horasTrabajadas.toFixed(1)} / ${horasReqTotal.toFixed(1)} hrs`, pct: pctHoras, color: 'var(--green)' },
            { icon: '📋', label: 'Horas requeridas', val: `${horasRequeridas.toFixed(1)} / ${horasReqTotal.toFixed(1)} hrs`, pct: horasReqTotal > 0 ? Math.min(100, Math.round((horasRequeridas / horasReqTotal) * 100)) : 0, color: '#6A8AAA' },
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
          {metaTokens > 0 ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'var(--text-sub)', fontSize: 12 }}>Tokens acumulados / meta en tokens</span>
                <span style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 600 }}>{pctMeta}%</span>
              </div>
              <div style={{ background: 'var(--bg3)', borderRadius: 12, height: 12, overflow: 'hidden', marginBottom: 10 }}>
                <div style={{ height: '100%', width: `${pctMeta}%`, background: pctMeta >= 100 ? 'var(--green)' : 'var(--gold)', borderRadius: 12, transition: 'width 0.4s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: 'var(--text-sub)', fontSize: 11 }}>{totalTokens.toLocaleString()} tokens</span>
                <span style={{ color: 'var(--gold)', fontSize: 11, fontWeight: 600 }}>Meta: ${metaUsd.toLocaleString()} USD ({metaTokens.toLocaleString()} tokens)</span>
              </div>
              <div style={{ background: 'rgba(201,146,74,0.08)', border: '1px solid var(--border2)', borderRadius: 12, padding: 14, marginTop: 12, textAlign: 'center' }}>
                <div style={{ color: 'var(--text-sub)', fontSize: 11, marginBottom: 4 }}>Llevas acumulados</div>
                <div style={{ color: 'var(--gold)', fontSize: 24, fontWeight: 700 }}>{totalTokens.toLocaleString()}</div>
                <div style={{ color: 'var(--text-sub)', fontSize: 11, marginTop: 4 }}>tokens esta quincena</div>
              </div>
              {totalTokens >= metaTokens ? (
                <div style={{ background: 'rgba(76,175,125,0.1)', border: '1px solid rgba(76,175,125,0.3)', borderRadius: 10, padding: 10, marginTop: 10, textAlign: 'center', color: 'var(--green)', fontSize: 13 }}>
                  🎉 Meta cumplida!
                </div>
              ) : (
                <div style={{ color: 'var(--text-sub)', fontSize: 12, marginTop: 10, textAlign: 'center' }}>
                  Te faltan {(metaTokens - totalTokens).toLocaleString()} tokens para tu meta
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
            <div style={{ color: 'var(--text-sub)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' }}>Mis pedidos {quincenaOffset === 0 ? '(pendientes y de esta quincena)' : '(pendientes y de la quincena seleccionada)'}</div>
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
              <span style={{ color: (p.estado === 'cancelado' || p.estado === 'rechazado') ? '#C0614A' : (p.estado === 'entregado' || p.estado === 'aprobado') ? 'var(--green)' : 'var(--gold)', fontSize: 12, fontWeight: 500, minWidth: 80, textAlign: 'right' }}>
                {p.estado === 'cancelado' ? 'Cancelado' : p.estado === 'rechazado' ? 'Rechazado' : p.estado === 'entregado' ? 'Completado' : p.estado === 'aprobado' ? 'Aprobado' : 'Pendiente'}
              </span>
              <span style={{ color: (p.estado === 'cancelado' || p.estado === 'rechazado') ? 'var(--text-dim)' : '#C0614A', fontSize: 13, fontWeight: 600, minWidth: 80, textAlign: 'right' }}>
                {(p.estado === 'cancelado' || p.estado === 'rechazado') ? '$0' : `-$${p.precio?.toLocaleString()}`}
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
