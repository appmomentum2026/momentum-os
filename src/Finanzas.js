import React, { useState, useEffect, useRef } from 'react';
import { db } from './firebase';
import { collection, doc, onSnapshot, addDoc, deleteDoc, setDoc } from 'firebase/firestore';

const TRM_API = 'https://www.datos.gov.co/resource/32sa-8pi3.json?$limit=1&$order=vigenciadesde DESC';

function getQuincena(offset = 0) {
  const hoy = new Date();
  let mes = hoy.getMonth();
  let anio = hoy.getFullYear();
  let esPrimera = hoy.getDate() <= 15;
  let totalQ = (esPrimera ? 0 : 1) + offset;
  while (totalQ < 0) { mes -= 1; if (mes < 0) { mes = 11; anio -= 1; } totalQ += 2; }
  while (totalQ > 1) { mes += 1; if (mes > 11) { mes = 0; anio += 1; } totalQ -= 2; }
  const mesNombre = new Date(anio, mes, 1).toLocaleString('es-CO', { month: 'long' });
  if (totalQ === 0) {
    return {
      inicio: new Date(anio, mes, 1).toISOString().split('T')[0],
      fin: new Date(anio, mes, 15).toISOString().split('T')[0],
      label: `1 - 15 de ${mesNombre}`
    };
  } else {
    const ultimoDia = new Date(anio, mes + 1, 0).getDate();
    return {
      inicio: new Date(anio, mes, 16).toISOString().split('T')[0],
      fin: new Date(anio, mes, ultimoDia).toISOString().split('T')[0],
      label: `16 - ${ultimoDia} de ${mesNombre}`
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

const CATEGORIAS_GASTO = ['Arriendo', 'Servicios', 'Internet', 'Salarios monitores', 'Aseo', 'Otros'];

const s = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 20 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  quincenaBox: { display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 10, padding: '8px 14px' },
  quincenaLabel: { color: 'var(--text)', fontSize: 13 },
  navBtn: { background: 'transparent', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontSize: 18, padding: '0 4px', lineHeight: 1 },
  tasaBox: { display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 10, padding: '8px 14px', flexWrap: 'wrap' },
  tasaLabel: { color: 'var(--text-sub)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  tasaVal: { color: 'var(--gold)', fontSize: 13, fontWeight: 600 },
  tasaInput: { background: 'var(--bg)', border: 'none', borderRadius: 8, boxShadow: 'var(--shadow-in)', color: 'var(--gold)', padding: '6px 10px', fontSize: 13, outline: 'none', width: 90 },
  tasaBtnEdit: { background: 'transparent', border: 'none', color: 'var(--text-sub)', cursor: 'pointer', fontSize: 12, padding: '0 4px' },
  tasaBtnSave: { background: 'transparent', border: 'none', color: '#4CAF7D', cursor: 'pointer', fontSize: 12, padding: '0 4px' },
  trmBadge: { background: 'rgba(76,175,125,0.12)', border: '1px solid rgba(76,175,125,0.3)', borderRadius: 6, color: '#4CAF7D', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', padding: '2px 7px', whiteSpace: 'nowrap' },
  manualBadge: { background: 'rgba(201,146,74,0.12)', border: '1px solid rgba(201,146,74,0.3)', borderRadius: 6, color: '#C9924A', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', padding: '2px 7px' },
  btnUsarTRM: { background: 'transparent', border: '1px solid rgba(76,175,125,0.4)', borderRadius: 6, color: '#4CAF7D', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', padding: '2px 8px', cursor: 'pointer', whiteSpace: 'nowrap' },
  // P&L
  plCard: { background: 'var(--bg2)', borderRadius: 14, padding: 20, boxShadow: 'var(--shadow-out)' },
  plTitle: { color: 'var(--text-sub)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 },
  plRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' },
  plRowLast: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0 0' },
  plConcepto: { color: 'var(--text)', fontSize: 13 },
  plConceptoSub: { color: 'var(--text-sub)', fontSize: 11, marginTop: 2 },
  plValUSD: { color: 'var(--text)', fontSize: 14, fontWeight: 600, textAlign: 'right' },
  plValCOP: { color: 'var(--text-dim)', fontSize: 11, textAlign: 'right', marginTop: 2 },
  plDivider: { border: 'none', borderTop: '2px solid var(--border2)', margin: '6px 0' },
  utilidadPos: { fontSize: 20, fontWeight: 700, color: '#4CAF7D', textAlign: 'right' },
  utilidadNeg: { fontSize: 20, fontWeight: 700, color: '#C0614A', textAlign: 'right' },
  // Gastos
  section: { background: 'var(--bg2)', borderRadius: 14, padding: 20, boxShadow: 'var(--shadow-out)' },
  sectionTitle: { color: 'var(--text-sub)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 },
  gastoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border)' },
  gastoConcepto: { color: 'var(--text)', fontSize: 13 },
  gastoCat: { color: 'var(--text-dim)', fontSize: 11, marginTop: 2 },
  gastoMonto: { color: 'var(--gold)', fontSize: 13, fontWeight: 600 },
  btnEliminar: { background: 'transparent', border: 'none', color: '#C0614A', cursor: 'pointer', fontSize: 16, padding: '0 6px', marginLeft: 10 },
  formGasto: { display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' },
  inputGasto: { background: 'var(--bg)', border: 'none', borderRadius: 10, boxShadow: 'var(--shadow-in)', color: 'var(--gold)', padding: '9px 12px', fontSize: 13, outline: 'none', flex: 1, minWidth: 120 },
  selectGasto: { background: 'var(--bg)', border: 'none', borderRadius: 10, boxShadow: 'var(--shadow-in)', color: 'var(--gold)', padding: '9px 12px', fontSize: 13, outline: 'none' },
  btnAgregar: { background: 'var(--gold)', border: 'none', borderRadius: 10, color: '#141414', padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' },
  vacioPL: { color: 'var(--text-dim)', fontSize: 12, textAlign: 'center', padding: '8px 0' },
  // Inventario costo
  invCard: { background: 'var(--bg2)', borderRadius: 14, padding: 20, boxShadow: 'var(--shadow-out)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 },
  invInfo: {},
  invLabel: { color: 'var(--text-sub)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
  invVal: { color: 'var(--text)', fontSize: 26, fontWeight: 700 },
  invSub: { color: 'var(--text-dim)', fontSize: 12, marginTop: 4 },
  invIcon: { fontSize: 40, opacity: 0.25 },
};

export default function Finanzas() {
  const [quincenaOffset, setQuincenaOffset] = useState(0);
  const [tasa, setTasa] = useState(4000);
  const [tasaEdit, setTasaEdit] = useState('');
  const [editandoTasa, setEditandoTasa] = useState(false);
  const [trmOficial, setTrmOficial] = useState(null);
  const [trmFecha, setTrmFecha] = useState('');
  const [tasaFuente, setTasaFuente] = useState('config');

  const trmCargadaRef = useRef(false);
  const tasaManualRef = useRef(false);

  const [cierres, setCierres] = useState([]);
  const [asistencia, setAsistencia] = useState({});
  const [modelos, setModelos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [gastos, setGastos] = useState([]);

  const [formGasto, setFormGasto] = useState({ concepto: '', monto: '', categoria: 'Arriendo' });
  const [guardandoGasto, setGuardandoGasto] = useState(false);

  const quincena = getQuincena(quincenaOffset);

  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'cierres'), snap => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      setCierres(data);
    });
    const u2 = onSnapshot(collection(db, 'asistencia'), snap => {
      const data = {};
      snap.forEach(d => { data[d.id] = d.data(); });
      setAsistencia(data);
    });
    const u3 = onSnapshot(collection(db, 'modelos'), snap => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      setModelos(data.filter(m => m.activa !== false));
    });
    const u4 = onSnapshot(collection(db, 'inventario'), snap => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      setProductos(data);
    });
    const u5 = onSnapshot(collection(db, 'pedidos'), snap => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      setPedidos(data);
    });
    const u6 = onSnapshot(collection(db, 'gastos'), snap => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.creado || '').localeCompare(a.creado || ''));
      setGastos(data);
    });
    const u7 = onSnapshot(doc(db, 'config', 'finanzas'), snap => {
      if (snap.exists() && !trmCargadaRef.current && !tasaManualRef.current) {
        setTasa(snap.data().tasa || 4000);
      }
    });

    const fetchTRM = async () => {
      try {
        const res = await fetch(TRM_API);
        if (!res.ok) return;
        const data = await res.json();
        if (!data.length || !data[0].valor) return;
        const valor = Number(data[0].valor);
        if (!valor || valor <= 0) return;
        if (tasaManualRef.current) return;
        const partesFecha = (data[0].vigenciadesde || '').split('T')[0].split('-');
        const fechaDisplay = partesFecha.length === 3
          ? `${partesFecha[2]}/${partesFecha[1]}`
          : '';
        trmCargadaRef.current = true;
        setTrmOficial(valor);
        setTrmFecha(fechaDisplay);
        setTasa(valor);
        setTasaFuente('trm');
        await setDoc(doc(db, 'config', 'finanzas'), { tasa: valor });
      } catch (err) {
        console.error('TRM no disponible, usando valor guardado:', err.message || err);
      }
    };
    fetchTRM();

    return () => { u1(); u2(); u3(); u4(); u5(); u6(); u7(); };
  }, []);

  const calcularModeloQ = (nombreModelo) => {
    let totalTokens = 0;
    let horasTrabajadas = 0;
    const diasTrabajados = Object.values(asistencia).filter(a =>
      a.modelo === nombreModelo && a.presente === true &&
      a.fecha >= quincena.inicio && a.fecha <= quincena.fin
    ).length;

    cierres.forEach(cierre => {
      if (cierre.fecha < quincena.inicio || cierre.fecha > quincena.fin + 'Z') return;
      if (!cierre.modelos) return;
      const md = cierre.modelos.find(m => m.nombre === nombreModelo);
      if (!md) return;
      ['Stripchat', 'Camsoda', 'Chaturbate', 'Streamate'].forEach(p => {
        totalTokens += Number(md[p + '_tokens'] || 0);
      });
      if (md.inicio && md.fin) {
        const [hi, mi] = md.inicio.split(':').map(Number);
        const [hf, mf] = md.fin.split(':').map(Number);
        let mins = (hf * 60 + mf) - (hi * 60 + mi);
        if (md.inicioBreak && md.finBreak) {
          const [hbi, mbi] = md.inicioBreak.split(':').map(Number);
          const [hbf, mbf] = md.finBreak.split(':').map(Number);
          mins -= (hbf * 60 + mbf) - (hbi * 60 + mbi);
        }
        horasTrabajadas += Math.max(0, mins / 60);
      }
    });

    const horasRequeridas = diasTrabajados * 6.5;
    const porcentaje = calcularPorcentaje(totalTokens, horasTrabajadas, horasRequeridas);
    const usdNeto = (totalTokens / 20) * (porcentaje / 100);
    return { totalTokens, usdNeto };
  };

  const modelResults = modelos.map(m => calcularModeloQ(m.nombreReal));
  const totalTokensEstudio = modelResults.reduce((acc, r) => acc + r.totalTokens, 0);
  const ingresosUSD = totalTokensEstudio / 20;
  const pagoModelosUSD = modelResults.reduce((acc, r) => acc + r.usdNeto, 0);
  const margenBrutoUSD = ingresosUSD - pagoModelosUSD;

  const pedidosQuincena = pedidos.filter(p => {
    const fecha = (p.fecha || '').split('T')[0];
    return fecha >= quincena.inicio && fecha <= quincena.fin && p.estado !== 'cancelado';
  });
  const descuentosCOP = pedidosQuincena.reduce((acc, p) => acc + (p.precio || 0), 0);
  const descuentosUSD = descuentosCOP / tasa;

  const gastosQuincena = gastos.filter(g => g.quincena === quincena.label);
  const gastosCOP = gastosQuincena.reduce((acc, g) => acc + (g.monto || 0), 0);
  const gastosUSD = gastosCOP / tasa;

  const utilidadNeta = margenBrutoUSD + descuentosUSD - gastosUSD;

  const valorCostoInventario = productos.reduce((acc, p) => acc + ((p.stock || 0) * (p.costo || 0)), 0);

  const guardarTasa = async () => {
    const valor = Number(tasaEdit);
    if (!valor || valor <= 0) return;
    tasaManualRef.current = true;
    setTasa(valor);
    setTasaFuente('manual');
    await setDoc(doc(db, 'config', 'finanzas'), { tasa: valor });
    setEditandoTasa(false);
    setTasaEdit('');
  };

  const usarTRM = async () => {
    if (!trmOficial) return;
    tasaManualRef.current = false;
    trmCargadaRef.current = true;
    setTasa(trmOficial);
    setTasaFuente('trm');
    await setDoc(doc(db, 'config', 'finanzas'), { tasa: trmOficial });
  };

  const agregarGasto = async () => {
    if (!formGasto.concepto || !formGasto.monto) return;
    setGuardandoGasto(true);
    await addDoc(collection(db, 'gastos'), {
      concepto: formGasto.concepto,
      monto: Number(formGasto.monto),
      categoria: formGasto.categoria,
      quincena: quincena.label,
      creado: new Date().toISOString()
    });
    setFormGasto({ concepto: '', monto: '', categoria: 'Arriendo' });
    setGuardandoGasto(false);
  };

  const fmt = (usd) => `$${usd.toFixed(2)} USD`;
  const fmtCOP = (cop) => `$${Math.round(cop).toLocaleString('es-CO')} COP`;

  return (
    <div style={s.wrap}>

      {/* Header: quincena + tasa */}
      <div style={s.header}>
        <div style={s.quincenaBox}>
          <span style={{ color: 'var(--text-sub)', fontSize: 14 }}>📅</span>
          <span style={s.quincenaLabel}>{quincena.label}</span>
          <button style={s.navBtn} onClick={() => setQuincenaOffset(o => o - 1)}>‹</button>
          {quincenaOffset < 0 && (
            <button style={s.navBtn} onClick={() => setQuincenaOffset(o => o + 1)}>›</button>
          )}
        </div>

        <div style={s.tasaBox}>
          <span style={s.tasaLabel}>COP/USD</span>
          {editandoTasa ? (
            <>
              <input
                style={s.tasaInput}
                type="number"
                value={tasaEdit}
                onChange={e => setTasaEdit(e.target.value)}
                placeholder={String(tasa)}
                autoFocus
              />
              <button style={s.tasaBtnSave} onClick={guardarTasa}>✓</button>
              <button style={s.tasaBtnEdit} onClick={() => { setEditandoTasa(false); setTasaEdit(''); }}>✕</button>
            </>
          ) : (
            <>
              <span style={s.tasaVal}>{tasa.toLocaleString('es-CO')}</span>
              {tasaFuente === 'trm' && (
                <span style={s.trmBadge}>TRM oficial{trmFecha ? ` · ${trmFecha}` : ''}</span>
              )}
              {tasaFuente === 'manual' && (
                <span style={s.manualBadge}>Manual</span>
              )}
              {tasaFuente === 'manual' && trmOficial && (
                <button style={s.btnUsarTRM} onClick={usarTRM}>Usar TRM</button>
              )}
              <button style={s.tasaBtnEdit} onClick={() => { setEditandoTasa(true); setTasaEdit(String(tasa)); }}>✎</button>
            </>
          )}
        </div>
      </div>

      {/* Estado de resultados */}
      <div style={s.plCard}>
        <div style={s.plTitle}>Estado de resultados — {quincena.label}</div>

        <div style={s.plRow}>
          <div>
            <div style={s.plConcepto}>Ingresos por tokens</div>
            <div style={s.plConceptoSub}>{totalTokensEstudio.toLocaleString()} tokens</div>
          </div>
          <div>
            <div style={s.plValUSD}>{fmt(ingresosUSD)}</div>
            <div style={s.plValCOP}>{fmtCOP(ingresosUSD * tasa)}</div>
          </div>
        </div>

        <div style={s.plRow}>
          <div>
            <div style={s.plConcepto}>(-) Pago a modelos</div>
            <div style={s.plConceptoSub}>{modelos.length} modelos activas</div>
          </div>
          <div>
            <div style={{ ...s.plValUSD, color: '#C0614A' }}>-{fmt(pagoModelosUSD)}</div>
            <div style={s.plValCOP}>{fmtCOP(pagoModelosUSD * tasa)}</div>
          </div>
        </div>

        <div style={{ ...s.plRow, background: 'var(--bg3)', borderRadius: 8, padding: '10px 12px', margin: '4px -4px' }}>
          <div style={{ ...s.plConcepto, fontWeight: 600 }}>Margen bruto</div>
          <div>
            <div style={{ ...s.plValUSD, color: margenBrutoUSD >= 0 ? '#4CAF7D' : '#C0614A' }}>{fmt(margenBrutoUSD)}</div>
            <div style={s.plValCOP}>{fmtCOP(margenBrutoUSD * tasa)}</div>
          </div>
        </div>

        <div style={s.plRow}>
          <div>
            <div style={s.plConcepto}>(+) Descuentos pedidos</div>
            <div style={s.plConceptoSub}>{pedidosQuincena.length} pedidos — {fmtCOP(descuentosCOP)}</div>
          </div>
          <div>
            <div style={{ ...s.plValUSD, color: '#4CAF7D' }}>+{fmt(descuentosUSD)}</div>
          </div>
        </div>

        <div style={s.plRow}>
          <div>
            <div style={s.plConcepto}>(-) Gastos operativos</div>
            <div style={s.plConceptoSub}>{gastosQuincena.length} gastos — {fmtCOP(gastosCOP)}</div>
          </div>
          <div>
            <div style={{ ...s.plValUSD, color: '#C0614A' }}>-{fmt(gastosUSD)}</div>
          </div>
        </div>

        <hr style={s.plDivider} />

        <div style={s.plRowLast}>
          <div style={{ ...s.plConcepto, fontSize: 15, fontWeight: 700 }}>Utilidad neta</div>
          <div>
            <div style={utilidadNeta >= 0 ? s.utilidadPos : s.utilidadNeg}>{fmt(utilidadNeta)}</div>
            <div style={s.plValCOP}>{fmtCOP(utilidadNeta * tasa)}</div>
          </div>
        </div>
      </div>

      {/* Gastos operativos */}
      <div style={s.section}>
        <div style={s.sectionTitle}>Gastos operativos — {quincena.label}</div>

        {gastosQuincena.length === 0 && (
          <div style={s.vacioPL}>Sin gastos registrados para esta quincena</div>
        )}

        {gastosQuincena.map(g => (
          <div key={g.id} style={s.gastoRow}>
            <div>
              <div style={s.gastoConcepto}>{g.concepto}</div>
              <div style={s.gastoCat}>{g.categoria}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div>
                <div style={s.gastoMonto}>{fmtCOP(g.monto)}</div>
                <div style={s.plValCOP}>{fmt(g.monto / tasa)}</div>
              </div>
              <button style={s.btnEliminar} onClick={() => deleteDoc(doc(db, 'gastos', g.id))}>×</button>
            </div>
          </div>
        ))}

        <div style={s.formGasto}>
          <input
            style={s.inputGasto}
            placeholder="Concepto"
            value={formGasto.concepto}
            onChange={e => setFormGasto(f => ({ ...f, concepto: e.target.value }))}
          />
          <input
            style={{ ...s.inputGasto, flex: '0 0 130px' }}
            type="number"
            placeholder="Monto (COP)"
            value={formGasto.monto}
            onChange={e => setFormGasto(f => ({ ...f, monto: e.target.value }))}
          />
          <select
            style={s.selectGasto}
            value={formGasto.categoria}
            onChange={e => setFormGasto(f => ({ ...f, categoria: e.target.value }))}
          >
            {CATEGORIAS_GASTO.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button style={s.btnAgregar} onClick={agregarGasto} disabled={guardandoGasto}>
            {guardandoGasto ? '...' : '+ Agregar'}
          </button>
        </div>
      </div>

      {/* Inventario a costo */}
      <div style={s.invCard}>
        <div style={s.invInfo}>
          <div style={s.invLabel}>Valor inventario a costo</div>
          <div style={s.invVal}>{fmtCOP(valorCostoInventario)}</div>
          <div style={s.invSub}>{fmt(valorCostoInventario / tasa)} · {productos.length} productos</div>
        </div>
        <div style={s.invIcon}>📦</div>
      </div>

    </div>
  );
}
