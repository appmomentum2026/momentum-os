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

// La meta se guarda como { usd: N }. Si el doc es de antes del cambio a USD, trae { tokens: N } —
// se reinterpreta como usd = tokens/20 para no perder metas ya asignadas.
function obtenerMetaUsd(metaDoc) {
  if (!metaDoc) return 0;
  if (metaDoc.usd !== undefined) return Number(metaDoc.usd) || 0;
  if (metaDoc.tokens !== undefined) return (Number(metaDoc.tokens) || 0) / 20;
  return 0;
}

function calcularPorcentaje(tokens, horasCumplidas, horasRequeridas) {
  const cumpleHoras = horasCumplidas >= horasRequeridas;
  if (!cumpleHoras) return 50;
  if (tokens >= 70000) return 70;
  if (tokens >= 60000) return 65;
  return 60;
}

// Texto explicativo de por qué corresponde ese porcentaje — misma regla que calcularPorcentaje,
// para mostrarle a la modelo (o al jefe en el reporte quincenal) el motivo del número.
function textoPorcentaje(tokens, horasCumplidas, horasRequeridas) {
  const cumpleHoras = horasCumplidas >= horasRequeridas;
  if (!cumpleHoras) {
    const faltan = Math.max(0, horasRequeridas - horasCumplidas);
    return `Faltan ${faltan.toFixed(1)} horas para el 60%`;
  }
  if (tokens >= 70000) return '+70k tokens (70%)';
  if (tokens >= 60000) return '+60k tokens (65%)';
  return 'Cumpliendo horas (60%)';
}

// Mensaje motivador de la tarjeta de estado, según qué tan cerca está de la meta
function mensajeMotivador(pctMeta, cumplida, tieneMeta) {
  if (!tieneMeta) return { texto: '🚀 ¡Sigue así, cada token cuenta!', color: 'var(--gold)', nivel: 'normal' };
  if (cumplida) return { texto: '🏆 ¡ERES UNA CAMPEONA!', color: 'var(--green)', nivel: 'campeona' };
  if (pctMeta >= 90) return { texto: '🔥 ¡Casi lo logras! Falta poquito', color: 'var(--gold)', nivel: 'alto' };
  if (pctMeta >= 70) return { texto: '💪 ¡Vas increíble, sigue así!', color: 'var(--gold)', nivel: 'alto' };
  if (pctMeta >= 40) return { texto: '⭐ ¡Buen ritmo, tú puedes!', color: 'var(--gold)', nivel: 'medio' };
  return { texto: '🚀 ¡Vamos con toda, aún hay tiempo!', color: 'var(--gold)', nivel: 'bajo' };
}

// Colores de las piezas de confeti (se repiten en ciclo, ver CONFETI_COLORES.length)
const CONFETI_COLORES = ['var(--gold)', 'var(--green)', '#ffffff', '#C9924A', '#4CAF7D', '#E8C77E'];

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

// Id de quincena en formato YYYY-MM-Q1/Q2, usado para rastrear cuotas de pedidos
function quincenaIdActual() {
  const hoy = new Date();
  const anioMes = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  return hoy.getDate() <= 15 ? `${anioMes}-Q1` : `${anioMes}-Q2`;
}
function quincenaIdANumero(id) {
  const [anio, mes, q] = id.split('-');
  return parseInt(anio) * 24 + (parseInt(mes) - 1) * 2 + (q === 'Q1' ? 0 : 1);
}
// Cuantas cuotas van pagadas de un pedido segun cuantas quincenas pasaron desde que se hizo
function estadoCuotas(pedido) {
  const total = pedido.cuotasTotales || pedido.cuotas || 1;
  if (!pedido.quincenaInicio) return { cuotaActual: total, total, pagado: false };
  const quincenasTranscurridas = quincenaIdANumero(quincenaIdActual()) - quincenaIdANumero(pedido.quincenaInicio) + 1;
  return {
    cuotaActual: Math.min(total, Math.max(1, quincenasTranscurridas)),
    total,
    pagado: quincenasTranscurridas > total
  };
}

export default function Nomina({ nombreModelo }) {
  const [cierres, setCierres] = useState([]);
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
    return () => { unsub1(); unsub3(); unsub4(); unsub5(); };
  }, []);

  // Calcular totales
  let totalTokens = 0;
  let horasTrabajadas = 0;
  // Días trabajados = días únicos de la quincena donde la modelo tiene un cierre con
  // inicio/fin válidos (misma fuente que las horas), no la asistencia marcada por el
  // monitor — así "días trabajados" y "horas" siempre cuadran entre sí.
  const diasTrabajadosSet = new Set();
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
      diasTrabajadosSet.add((cierre.fecha || '').split('T')[0]);
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

  const diasTrabajados = diasTrabajadosSet.size;
  // Horas requeridas de la quincena = 6.5h × días laborales de la quincena (no días
  // trabajados) — así el % no queda artificialmente al 100% solo por trabajar pocos días.
  const horasRequeridas = diasLabQuincena * 6.5;
  const porcentaje = calcularPorcentaje(totalTokens, horasTrabajadas, horasRequeridas);
  const textoPct = textoPorcentaje(totalTokens, horasTrabajadas, horasRequeridas);
  const usdBruto = totalTokens / 20;
  const usdNeto = usdBruto * (porcentaje / 100);

  // Pedidos: nunca los ya pagados; de los demas, solo pendientes (cualquier fecha) o los de la quincena seleccionada
  const misPedidos = pedidos.filter(p => {
    if (p.modelo !== nombreModelo) return false;
    if (estadoCuotas(p).pagado) return false;
    if (p.estado === 'pendiente') return true;
    const fechaPedido = p.fecha?.split('T')[0] || '';
    return fechaPedido >= quincena.inicio && fechaPedido <= quincena.fin;
  });
  const totalDescuentos = misPedidos
    .filter(p => p.estado !== 'cancelado' && p.estado !== 'rechazado')
    .reduce((acc, p) => acc + (p.precio || 0), 0);
  const descuentoUSD = totalDescuentos / 4000;
  const usdNetoFinal = Math.max(0, usdNeto - descuentoUSD).toFixed(2);

  const metaUsd = obtenerMetaUsd(metas[nombreModelo]);
  const metaTokens = metaUsd * 20;
  const hoy = new Date();
  const finQuincena = new Date(quincena.fin);
  const diasRestantes = Math.max(0, Math.ceil((finQuincena - hoy) / (1000 * 60 * 60 * 24)));
  const tokensNecesarios = Math.max(0, metaTokens - totalTokens);
  const porDia = diasRestantes > 0 ? Math.ceil(tokensNecesarios / diasRestantes) : 0;
  const pctMeta = metaTokens > 0 ? Math.min(100, Math.round((totalTokens / metaTokens) * 100)) : 0;
  const pctDias = diasLabQuincena > 0 ? Math.min(100, Math.round((diasTrabajados / diasLabQuincena) * 100)) : 0;
  const pctHoras = horasRequeridas > 0 ? Math.min(100, Math.round((horasTrabajadas / horasRequeridas) * 100)) : 0;
  const horasRestantes = Math.max(0, horasRequeridas - horasTrabajadas);
  const pctHorasRestantes = horasRequeridas > 0 ? Math.min(100, Math.round((horasRestantes / horasRequeridas) * 100)) : 0;

  // Estado de la meta: cumplida, mensaje motivador y proyección de cierre a partir del
  // ritmo diario actual (tokens acumulados / días transcurridos de la quincena).
  const metaCumplida = metaTokens > 0 && totalTokens >= metaTokens;
  const mensaje = mensajeMotivador(pctMeta, metaCumplida, metaTokens > 0);
  const inicioQDate = new Date(quincena.inicio + 'T00:00:00');
  const finQDate = new Date(quincena.fin + 'T00:00:00');
  const hoyClamped = hoy < inicioQDate ? inicioQDate : (hoy > finQDate ? finQDate : hoy);
  const diasTranscurridosQuincena = Math.max(1, Math.floor((hoyClamped - inicioQDate) / 86400000) + 1);
  const ritmoDiario = totalTokens / diasTranscurridosQuincena;
  const proyeccionCierre = Math.round(ritmoDiario * quincena.dias);

  // Chips de logros: siempre se muestran los 4, encendidos (dorado/verde) al alcanzarse,
  // apagados (gris) si no — así se ve claro qué falta por desbloquear.
  const chips = [
    { icon: '✓', texto: 'Cumplió horas', lograda: horasRequeridas > 0 && horasTrabajadas >= horasRequeridas, colorLogrado: 'var(--green)' },
    { icon: '⭐', texto: '+50k tokens', lograda: totalTokens >= 50000, colorLogrado: 'var(--gold)' },
    { icon: '💎', texto: '+60k tokens', lograda: totalTokens >= 60000, colorLogrado: 'var(--gold)' },
    { icon: '👑', texto: '+70k tokens', lograda: totalTokens >= 70000, colorLogrado: 'var(--gold)' },
  ];

  const barraWrap = { background: 'var(--bg3)', borderRadius: 20, height: 6, marginTop: 6, overflow: 'hidden' };
  const barraFill = (pct, color) => ({ height: '100%', width: `${pct}%`, background: color || 'var(--gold)', borderRadius: 20, transition: 'width 0.4s' });
  const estiloChip = (c) => ({
    display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 20, padding: '7px 14px', fontSize: 12, fontWeight: 700,
    background: c.lograda ? (c.colorLogrado === 'var(--green)' ? 'rgba(76,175,125,0.12)' : 'rgba(201,146,74,0.15)') : 'var(--bg)',
    color: c.lograda ? c.colorLogrado : 'var(--text-dim)',
    border: c.lograda ? `1px solid ${c.colorLogrado === 'var(--green)' ? 'rgba(76,175,125,0.35)' : 'var(--gold-dim)'}` : '1px solid var(--border2)',
    boxShadow: c.lograda ? 'var(--shadow-out)' : 'none',
    opacity: c.lograda ? 1 : 0.55,
  });

  return (
    <div className="nm-nomina-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

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

      {/* Banner de estado motivador */}
      <div
        className={`nm-card-elevated nm-mensaje-motivador${mensaje.nivel === 'campeona' ? ' nm-banner-campeona' : ''}`}
        style={{
          textAlign: 'center', padding: '22px 20px',
          border: metaCumplida ? '1px solid rgba(76,175,125,0.5)' : '1px solid var(--gold-dim)',
          background: metaCumplida ? undefined : 'linear-gradient(135deg, rgba(201,146,74,0.08), transparent)'
        }}
      >
        <div style={{ fontSize: metaCumplida ? 25 : 20, fontWeight: 800, color: mensaje.color, letterSpacing: 0.3 }}>
          {mensaje.texto}
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
        <div className="nm-card-elevated">
          <div style={{ color: 'var(--text-sub)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Meta quincenal</div>
          {metaUsd > 0 ? (
            <>
              <div style={{ color: 'var(--gold)', fontSize: 16, fontWeight: 700 }}>${metaUsd.toLocaleString()} USD</div>
              <div style={{ color: 'var(--text-dim)', fontSize: 11, marginBottom: 10 }}>({metaTokens.toLocaleString()} tokens)</div>
              <div style={{ color: 'var(--text-sub)', fontSize: 12 }}>
                {tokensNecesarios <= 0 ? '¡Meta cumplida! 🎉' : `Necesitas ${porDia.toLocaleString()} tokens por día`}
              </div>
            </>
          ) : (
            <div style={{ color: 'var(--text-dim)', fontSize: 13, marginTop: 8 }}>Sin meta asignada</div>
          )}
        </div>

        {/* Días restantes */}
        <div className="nm-card-elevated" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, borderRadius: 26, background: 'rgba(201,146,74,0.15)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 8 }}>📅</div>
          <div style={{ color: 'var(--gold)', fontSize: 28, fontWeight: 700 }}>{diasRestantes}</div>
          <div style={{ color: 'var(--text-sub)', fontSize: 12 }}>días restantes</div>
          <div style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 2 }}>para completar tu meta</div>
        </div>
      </div>

      {/* Progreso de meta — la pieza central, grande y motivadora */}
      <div
        className="nm-card-elevated"
        style={{ position: 'relative', overflow: 'hidden', border: metaCumplida ? '1px solid rgba(76,175,125,0.5)' : undefined }}
      >
        {metaCumplida && (
          <div className="nm-confeti-burst" aria-hidden="true">
            {Array.from({ length: 16 }).map((_, i) => (
              <span
                key={i}
                className="nm-confeti-pieza"
                style={{
                  left: `${(i * 6.7) % 100}%`,
                  background: CONFETI_COLORES[i % CONFETI_COLORES.length],
                  animationDelay: `${(i % 8) * 0.1}s`
                }}
              />
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <div style={{ color: 'var(--text-sub)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' }}>Progreso de tu meta</div>
          {metaTokens > 0 && (
            <div style={{ fontSize: 26, fontWeight: 800, color: metaCumplida ? 'var(--green)' : 'var(--gold)' }}>{pctMeta}%</div>
          )}
        </div>

        {metaTokens > 0 ? (
          <>
            {metaCumplida && (
              <div className="nm-meta-celebracion" style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--green)' }}>¡META CUMPLIDA! 🎉</div>
              </div>
            )}

            <div className="nm-barra-meta-track">
              <div className={`nm-barra-meta-fill ${metaCumplida ? 'cumplida' : 'en-progreso'}`} style={{ width: `${Math.min(100, Math.max(pctMeta, 6))}%` }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
              <span style={{ color: 'var(--text-sub)', fontSize: 11 }}>{totalTokens.toLocaleString()} tokens</span>
              <span style={{ color: 'var(--gold)', fontSize: 11, fontWeight: 600 }}>Meta: ${metaUsd.toLocaleString()} USD ({metaTokens.toLocaleString()} tokens)</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
              <div style={{ background: 'rgba(201,146,74,0.08)', border: '1px solid var(--border2)', borderRadius: 12, padding: 14, textAlign: 'center' }}>
                <div style={{ color: 'var(--text-sub)', fontSize: 11, marginBottom: 4 }}>Tokens acumulados</div>
                <div style={{ color: 'var(--gold)', fontSize: 28, fontWeight: 800 }}>{totalTokens.toLocaleString()}</div>
                <div style={{ color: 'var(--text-sub)', fontSize: 11, marginTop: 2 }}>tokens</div>
              </div>
              <div style={{ background: metaCumplida ? 'rgba(76,175,125,0.1)' : 'rgba(201,146,74,0.08)', border: '1px solid var(--border2)', borderRadius: 12, padding: 14, textAlign: 'center' }}>
                <div style={{ color: 'var(--text-sub)', fontSize: 11, marginBottom: 4 }}>{metaCumplida ? '¡Meta superada por!' : 'Te faltan'}</div>
                <div style={{ color: metaCumplida ? 'var(--green)' : 'var(--text)', fontSize: 28, fontWeight: 800 }}>{Math.abs(metaTokens - totalTokens).toLocaleString()}</div>
                <div style={{ color: 'var(--text-sub)', fontSize: 11, marginTop: 2 }}>tokens</div>
              </div>
            </div>

            {quincenaOffset === 0 && !metaCumplida && (
              <div style={{ textAlign: 'center', color: 'var(--text-sub)', fontSize: 12, marginTop: 14 }}>
                Al ritmo actual, cerrarás en <b style={{ color: 'var(--gold)' }}>~{proyeccionCierre.toLocaleString()}</b> tokens
              </div>
            )}
          </>
        ) : (
          <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: 30, fontSize: 13 }}>Sin meta asignada para esta quincena</div>
        )}

        {/* Chips de logros: siempre visibles, encendidos al lograrse */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: metaTokens > 0 ? 18 : 6, justifyContent: 'center' }}>
          {chips.map((c, i) => (
            <span key={i} className={c.lograda ? 'nm-hito-chip' : ''} style={{ ...estiloChip(c), animationDelay: `${i * 0.08}s` }}>
              {c.icon} {c.texto}
            </span>
          ))}
        </div>
      </div>

      {/* Mi resumen */}
      <div className="nm-card-elevated">
        <div style={{ color: 'var(--text-sub)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>Mi resumen</div>
        <div style={{ color: 'var(--text-dim)', fontSize: 11, marginBottom: 14 }}>{diasLabQuincena} días laborales esta quincena (sin domingos ni días libres aprobados)</div>

        <div className="nm-form-grid2">
          {[
            { icon: '📅', label: 'Días trabajados', val: `${diasTrabajados} / ${diasLabQuincena} días`, pct: pctDias, color: 'var(--gold)' },
            { icon: '⏰', label: 'Horas trabajadas', val: `${horasTrabajadas.toFixed(1)} / ${horasRequeridas.toFixed(1)} hrs`, pct: pctHoras, color: 'var(--green)' },
            { icon: '⏳', label: 'Horas restantes', val: `${horasRestantes.toFixed(1)} hrs`, pct: pctHorasRestantes, color: '#6A8AAA' },
            { icon: '🏆', label: 'Porcentaje de avance', val: `${porcentaje}%`, pct: porcentaje, color: 'var(--gold)', sub: textoPct },
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
              {item.sub && <div style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 4 }}>{item.sub}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Mis pedidos */}
      {misPedidos.length > 0 && (
        <div className="nm-card-elevated">
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
                <div style={{ color: 'var(--text-sub)', fontSize: 11, marginTop: 2 }}>
                  {(() => { const info = estadoCuotas(p); return info.total > 1 ? `Cuota ${info.cuotaActual}/${info.total}` : 'Pago completo'; })()} · {p.hora}
                </div>
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
