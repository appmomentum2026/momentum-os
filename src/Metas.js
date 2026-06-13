import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';


const MODELOS_POR_TURNO = {
  'Manana': [
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

const s = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 12 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  card: { background: 'var(--bg2)', borderRadius: 12, padding: 14, border: '1px solid var(--border)' },
  fila: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  nombre: { color: 'var(--text)', fontSize: 13, flex: 1 },
  input: { background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--gold)', padding: '8px 12px', fontSize: 13, width: 120, outline: 'none', textAlign: 'right' },
  btnGuardar: { background: 'var(--gold)', border: 'none', borderRadius: 8, color: '#141414', padding: '8px 14px', fontSize: 12, letterSpacing: 1, cursor: 'pointer', fontWeight: 500 },
  metaActual: { color: 'var(--text-dim)', fontSize: 12, marginTop: 6 },
  bigCard: { background: 'var(--bg2)', borderRadius: 14, padding: 20, border: '1px solid var(--border)' },
  label: { color: 'var(--text-sub)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
  bigVal: { color: 'var(--gold)', fontSize: 32, fontWeight: 500, marginBottom: 4 },
  titulo: { color: 'var(--gold)', fontSize: 14, fontWeight: 500, marginBottom: 14 },
  statFila: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' },
  statLabel: { color: 'var(--text-sub)', fontSize: 13 },
  statVal: { color: 'var(--text)', fontSize: 13 },
  barraWrap: { background: 'var(--bg3)', borderRadius: 20, height: 8, marginTop: 12, overflow: 'hidden' },
  barraFill: { height: '100%', borderRadius: 20, transition: 'width 0.5s' },
  badge: { padding: '4px 12px', borderRadius: 20, fontSize: 12, letterSpacing: 1 },
  motivacion: { background: 'rgba(76,175,125,0.1)', border: '1px solid rgba(76,175,125,0.2)', borderRadius: 12, padding: 14, color: '#4CAF7D', fontSize: 13, lineHeight: 1.5 },
  turnoLabel: { color: 'var(--gold)', fontSize: 15, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, marginTop: 8, paddingBottom: 6, borderBottom: '1px solid var(--border)' },
  compRow: { display: 'flex', gap: 10 },
  compBox: { flex: 1, background: 'var(--bg3)', borderRadius: 10, padding: 14, textAlign: 'center' },
  compLabel: { color: 'var(--text-sub)', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  compVal: { color: 'var(--text)', fontSize: 18, fontWeight: 500 },
  proyeccionBox: { background: 'rgba(201,146,74,0.08)', border: '1px solid rgba(201,146,74,0.2)', borderRadius: 12, padding: 16, textAlign: 'center' },
};

function getQuincena(offset = 0) {
  // offset 0 = quincena actual, -1 = quincena anterior
  const hoy = new Date();
  let dia = hoy.getDate();
  let mes = hoy.getMonth();
  let anio = hoy.getFullYear();

  // Determinar si estamos en primera (1-15) o segunda (16-fin) quincena
  let esPrimera = dia <= 15;

  // Aplicar offset
  let totalQuincenas = (esPrimera ? 0 : 1) + offset;
  while (totalQuincenas < 0) {
    mes -= 1;
    if (mes < 0) { mes = 11; anio -= 1; }
    totalQuincenas += 2;
  }
  while (totalQuincenas > 1) {
    mes += 1;
    if (mes > 11) { mes = 0; anio += 1; }
    totalQuincenas -= 2;
  }

  if (totalQuincenas === 0) {
    return {
      inicio: new Date(anio, mes, 1).toISOString().split('T')[0],
      fin: new Date(anio, mes, 15).toISOString().split('T')[0],
    };
  } else {
    const ultimoDia = new Date(anio, mes + 1, 0).getDate();
    return {
      inicio: new Date(anio, mes, 16).toISOString().split('T')[0],
      fin: new Date(anio, mes, ultimoDia).toISOString().split('T')[0],
    };
  }
}

function tokensEnRango(cierres, nombreModelo, inicio, fin) {
  let total = 0;
  const porDia = {};
  cierres.forEach(cierre => {
    const fechaCierre = cierre.fecha?.split('T')[0] || '';
    if (fechaCierre < inicio || fechaCierre > fin) return;
    if (!cierre.modelos) return;
    const modelaData = cierre.modelos.find(m => m.nombre === nombreModelo);
    if (!modelaData) return;
    let tokensDelDia = 0;
    ['Stripchat', 'Camsoda', 'Chaturbate', 'Streamate'].forEach(p => {
      tokensDelDia += Number(modelaData[p + '_tokens'] || 0);
    });
    total += tokensDelDia;
    porDia[fechaCierre] = (porDia[fechaCierre] || 0) + tokensDelDia;
  });
  return { total, porDia };
}

function ProyeccionModelo({ nombreModelo, meta }) {
  const [cierres, setCierres] = useState([]);
  const [asistencia, setAsistencia] = useState({});
  const quincena = getQuincena(0);
  const quincenaAnterior = getQuincena(-1);

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

  const actual = tokensEnRango(cierres, nombreModelo, quincena.inicio, quincena.fin);
  const anterior = tokensEnRango(cierres, nombreModelo, quincenaAnterior.inicio, quincenaAnterior.fin);

  const totalTokens = actual.total;
  const tokensPorDia = actual.porDia;

  let mejorDia = { fecha: '', tokens: 0 };
  Object.entries(tokensPorDia).forEach(([fecha, tokens]) => {
    if (tokens > mejorDia.tokens) mejorDia = { fecha, tokens };
  });

  const diasTrabajados = Object.values(asistencia).filter(a =>
    a.modelo === nombreModelo && a.presente === true &&
    a.fecha >= quincena.inicio && a.fecha <= quincena.fin
  ).length;

  const hoy = new Date();
  const finQuincena = new Date(quincena.fin);
  const diasRestantes = Math.max(1, Math.ceil((finQuincena - hoy) / (1000 * 60 * 60 * 24)));
  const cumplimiento = meta > 0 ? Math.min(100, Math.round((totalTokens / meta) * 100)) : 0;
  const tokensNecesarios = Math.max(0, meta - totalTokens);
  const porDia = diasRestantes > 0 ? Math.ceil(tokensNecesarios / diasRestantes) : 0;
  const promedioDiario = diasTrabajados > 0 ? Math.round(totalTokens / diasTrabajados) : 0;
  const diasOrdenados = Object.entries(tokensPorDia).sort(([a], [b]) => a.localeCompare(b)).slice(-10);
  const maxTokens = Math.max(...diasOrdenados.map(([, v]) => v), 1);

  // Proyección: al ritmo actual, cuánto terminará haciendo
  const diasTranscurridos = Object.keys(tokensPorDia).length;
  const totalDiasQuincena = 15;
  const proyeccionFinal = diasTranscurridos > 0
    ? Math.round((totalTokens / diasTranscurridos) * totalDiasQuincena)
    : 0;

  // Comparación con quincena anterior
  
  const porcentajeCambio = anterior.total > 0
    ? Math.round(((totalTokens - anterior.total) / anterior.total) * 100)
    : null;

  const getMensaje = () => {
    if (cumplimiento >= 100) return 'Meta cumplida! Excelente quincena.';
    if (cumplimiento >= 75) return 'Vas muy bien, sigue asi!';
    if (cumplimiento >= 50) return 'Vas a mitad de camino, puedes lograrlo!';
    if (cumplimiento >= 25) return 'Aun hay tiempo, enfocate!';
    return 'Arranca fuerte, cada token cuenta!';
  };

  return (
    <div style={s.wrap}>

      <div style={s.grid2}>
        <div style={s.bigCard}>
          <div style={s.label}>Tu meta esta quincena</div>
          <div style={s.bigVal}>{meta > 0 ? meta.toLocaleString() : '—'} tokens</div>
          <div style={{ ...s.statFila, borderBottom: 'none', marginTop: 4 }}>
            <div style={{ color: 'var(--text-sub)', fontSize: 13 }}>Llevas {totalTokens.toLocaleString()} tokens</div>
            <div style={{ ...s.badge, background: cumplimiento >= 100 ? 'rgba(76,175,125,0.15)' : 'rgba(201,146,74,0.15)', color: cumplimiento >= 100 ? '#4CAF7D' : 'var(--gold)' }}>{cumplimiento}%</div>
          </div>
          <div style={s.barraWrap}>
            <div style={{ ...s.barraFill, width: `${cumplimiento}%`, background: cumplimiento >= 100 ? '#4CAF7D' : 'var(--gold)' }}></div>
          </div>
          <div style={{ ...s.motivacion, marginTop: 12 }}>{getMensaje()}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {meta > 0 && (
            <div style={s.proyeccionBox}>
              <div style={s.compLabel}>Proyección al ritmo actual</div>
              <div style={{ color: 'var(--gold)', fontSize: 26, fontWeight: 500, marginBottom: 4 }}>
                {proyeccionFinal.toLocaleString()} tokens
              </div>
              <div style={{ color: 'var(--text-sub)', fontSize: 12 }}>
                {proyeccionFinal >= meta
                  ? 'Vas camino a superar tu meta!'
                  : `Te faltarían ${(meta - proyeccionFinal).toLocaleString()} para la meta`}
              </div>
            </div>
          )}

          <div style={s.bigCard}>
            <div style={s.titulo}>Mis estadisticas</div>
            <div style={s.statFila}><div style={s.statLabel}>Dias trabajados</div><div style={s.statVal}>{diasTrabajados} dias</div></div>
            <div style={s.statFila}><div style={s.statLabel}>Promedio diario</div><div style={s.statVal}>{promedioDiario.toLocaleString()} tokens</div></div>
            <div style={s.statFila}><div style={s.statLabel}>Mejor dia</div><div style={s.statVal}>{mejorDia.tokens > 0 ? mejorDia.tokens.toLocaleString() + ' tokens' : '—'}</div></div>
            <div style={s.statFila}><div style={s.statLabel}>Dias restantes</div><div style={s.statVal}>{diasRestantes} dias</div></div>
            <div style={{ ...s.statFila, borderBottom: 'none' }}>
              <div style={s.statLabel}>Necesitas por dia</div>
              <div style={{ color: tokensNecesarios <= 0 ? '#4CAF7D' : 'var(--gold)', fontSize: 16, fontWeight: 500 }}>
                {tokensNecesarios <= 0 ? 'Meta cumplida!' : porDia.toLocaleString() + ' tokens'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={s.grid2}>
        <div style={s.bigCard}>
          <div style={s.titulo}>Comparación quincenas</div>
          <div style={s.compRow}>
            <div style={s.compBox}>
              <div style={s.compLabel}>Quincena anterior</div>
              <div style={s.compVal}>{anterior.total.toLocaleString()}</div>
            </div>
            <div style={s.compBox}>
              <div style={s.compLabel}>Esta quincena</div>
              <div style={s.compVal}>{totalTokens.toLocaleString()}</div>
            </div>
          </div>
          {porcentajeCambio !== null && (
            <div style={{ textAlign: 'center', marginTop: 12, fontSize: 14, fontWeight: 500, color: porcentajeCambio >= 0 ? '#4CAF7D' : '#C0614A' }}>
              {porcentajeCambio >= 0 ? '▲' : '▼'} {Math.abs(porcentajeCambio)}% {porcentajeCambio >= 0 ? 'más' : 'menos'} que la quincena pasada
            </div>
          )}
          {porcentajeCambio === null && (
            <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: 'var(--text-dim)' }}>
              Sin datos de la quincena anterior para comparar
            </div>
          )}
        </div>

        {diasOrdenados.length > 0 && (
          <div style={s.bigCard}>
            <div style={s.titulo}>Tokens por dia</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 100, padding: '0 4px' }}>
              {diasOrdenados.map(([fecha, tokens]) => (
                <div key={fecha} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>{tokens.toLocaleString()}</div>
                  <div style={{
                    width: '100%',
                    height: `${Math.round((tokens / maxTokens) * 60)}px`,
                    background: tokens === mejorDia.tokens ? '#4CAF7D' : 'var(--gold)',
                    borderRadius: '4px 4px 0 0',
                    opacity: 0.85,
                    minHeight: 4
                  }}></div>
                  <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>{fecha.split('-')[2]}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

export default function Metas({ rol, nombreModelo }) {
  const [metas, setMetas] = useState({});
  const [editando, setEditando] = useState({});

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'metas'), snap => {
      const data = {};
      snap.forEach(d => { data[d.id] = d.data(); });
      setMetas(data);
    });
    return unsub;
  }, []);

  const guardarMeta = async (modelo, valor) => {
    if (!valor) return;
    await setDoc(doc(db, 'metas', modelo), { tokens: Number(valor), actualizado: new Date().toISOString() });
    setEditando(prev => { const n = { ...prev }; delete n[modelo]; return n; });
  };

  if (rol === 'jefe') {
    const renderModelo = (modelo) => (
      <div key={modelo} style={s.card}>
        <div style={s.fila}>
          <div style={s.nombre}>{modelo}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input style={s.input} type="number" placeholder={metas[modelo]?.tokens || 'Meta'}
              value={editando[modelo] || ''}
              onChange={e => setEditando(prev => ({ ...prev, [modelo]: e.target.value }))} />
            <button style={s.btnGuardar} onClick={() => guardarMeta(modelo, editando[modelo])}>OK</button>
          </div>
        </div>
        {metas[modelo] && <div style={s.metaActual}>Meta actual: {metas[modelo].tokens.toLocaleString()} tokens</div>}
      </div>
    );

    return (
      <div style={s.wrap}>
        {Object.entries(MODELOS_POR_TURNO).map(([turno, modelos]) => (
          <div key={turno} style={{ marginBottom: 8 }}>
            <div style={s.turnoLabel}>Turno {turno}</div>
            <div className="nm-grid-cards">
              {modelos.map(renderModelo)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const meta = metas[nombreModelo]?.tokens || 0;
  return <ProyeccionModelo nombreModelo={nombreModelo} meta={meta} />;
}