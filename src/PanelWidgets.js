import React, { useState, useEffect, useRef } from 'react';
import { db } from './firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DOW   = ['L','M','X','J','V','S','D'];
const BTNS  = ['C','⌫','÷','×','7','8','9','-','4','5','6','+','1','2','3','=','±','0','.',''];

const s = {
  sep:  { height: 1, background: 'var(--border)', margin: '16px 0' },
  tit:  { color: 'var(--text-sub)', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
          marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 },
  ico:  { color: 'var(--gold)', fontSize: 12 },

  // Calendario
  calCab:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  calMes:    { color: 'var(--text)', fontSize: 11, fontWeight: 600, letterSpacing: 0.3 },
  calNavBtn: { background: 'transparent', border: 'none', color: 'var(--text-sub)',
               cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center', fontSize: 14 },
  calGrid:   { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 },
  calDow:    { color: 'var(--text-dim)', fontSize: 9, textAlign: 'center', paddingBottom: 4 },
  calDia:    { color: 'var(--text-sub)', fontSize: 10, textAlign: 'center', padding: '3px 0', borderRadius: 4 },
  calHoy:    { background: 'var(--gold)', color: '#141414', fontWeight: 700 },

  // Calculadora
  calcDisp:  { background: 'var(--bg)', borderRadius: 10, boxShadow: 'var(--shadow-in)',
               color: 'var(--gold)', fontSize: 18, fontWeight: 500, padding: '8px 12px',
               textAlign: 'right', marginBottom: 8, overflow: 'hidden',
               textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: 0.5 },
  calcGrid:  { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 },
  calcBtn:   { background: 'var(--bg)', border: 'none', borderRadius: 7, boxShadow: 'var(--shadow-out)',
               color: 'var(--text)', fontSize: 12, fontWeight: 500, padding: '9px 0', cursor: 'pointer' },
  calcBtnOp: { background: 'var(--bg)', border: 'none', borderRadius: 7, boxShadow: 'var(--shadow-out)',
               color: 'var(--gold)', fontSize: 12, fontWeight: 600, padding: '9px 0', cursor: 'pointer' },
  calcBtnEq: { background: 'var(--gold)', border: 'none', borderRadius: 7,
               color: '#141414', fontSize: 12, fontWeight: 700, padding: '9px 0', cursor: 'pointer' },
  calcBtnOf: { background: 'transparent', border: 'none', cursor: 'default' },

  // Bloc de notas
  notasWrap: { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 },
  notasCab:  { color: 'var(--text-sub)', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
               marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 },
  guardando: { marginLeft: 'auto', color: 'var(--text-dim)', fontSize: 9, letterSpacing: 1 },
  notasArea: { flex: 1, background: 'var(--bg)', border: 'none', borderRadius: 10,
               boxShadow: 'var(--shadow-in)', color: 'var(--text)', fontSize: 12,
               lineHeight: 1.6, padding: '10px 12px', resize: 'none', outline: 'none',
               fontFamily: 'inherit', minHeight: 100 },
};

// ─── CALENDARIO ───────────────────────────────────────────────────────────────
function Calendario() {
  const hoy = new Date();
  const [mes, setMes]   = useState(hoy.getMonth());
  const [anio, setAnio] = useState(hoy.getFullYear());

  const anterior  = () => { if (mes === 0) { setMes(11); setAnio(a => a - 1); } else setMes(m => m - 1); };
  const siguiente = () => { if (mes === 11) { setMes(0);  setAnio(a => a + 1); } else setMes(m => m + 1); };

  // offset lunes=0 … domingo=6
  const offset     = (new Date(anio, mes, 1).getDay() + 6) % 7;
  const diasEnMes  = new Date(anio, mes + 1, 0).getDate();
  const celdas     = [...Array(offset).fill(null), ...Array.from({ length: diasEnMes }, (_, i) => i + 1)];
  const esHoy      = d => d === hoy.getDate() && mes === hoy.getMonth() && anio === hoy.getFullYear();

  return (
    <div>
      <div style={s.tit}>
        <i className="ti ti-calendar" style={s.ico} aria-hidden="true"></i>
        Calendario
      </div>
      <div style={s.calCab}>
        <button style={s.calNavBtn} onClick={anterior}>
          <i className="ti ti-chevron-left" aria-hidden="true"></i>
        </button>
        <span style={s.calMes}>{MESES[mes]} {anio}</span>
        <button style={s.calNavBtn} onClick={siguiente}>
          <i className="ti ti-chevron-right" aria-hidden="true"></i>
        </button>
      </div>
      <div style={s.calGrid}>
        {DOW.map(d => <div key={d} style={s.calDow}>{d}</div>)}
        {celdas.map((d, i) => (
          <div key={i} style={d && esHoy(d) ? { ...s.calDia, ...s.calHoy } : s.calDia}>
            {d ?? ''}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CALCULADORA ──────────────────────────────────────────────────────────────
function Calculadora() {
  const [disp,      setDisp]      = useState('0');
  const [prevVal,   setPrevVal]   = useState(null);
  const [operador,  setOperador]  = useState(null);
  const [esperando, setEsperando] = useState(false);

  const ingresarDigito = val => {
    if (esperando) {
      setDisp(val === '.' ? '0.' : val);
      setEsperando(false);
      return;
    }
    if (val === '.' && disp.includes('.')) return;
    setDisp(d => (d === '0' && val !== '.') ? val : d.length >= 12 ? d : d + val);
  };

  const aplicarOp = op => {
    setPrevVal(parseFloat(disp));
    setOperador(op);
    setEsperando(true);
  };

  const calcular = () => {
    if (prevVal === null || operador === null) return;
    const curr = parseFloat(disp);
    let res;
    switch (operador) {
      case '+': res = prevVal + curr; break;
      case '-': res = prevVal - curr; break;
      case '×': res = prevVal * curr; break;
      case '÷': res = curr === 0 ? 'Error' : prevVal / curr; break;
      default:  return;
    }
    setDisp(typeof res === 'number' ? String(parseFloat(res.toFixed(10))) : res);
    setPrevVal(null); setOperador(null); setEsperando(true);
  };

  const limpiar     = () => { setDisp('0'); setPrevVal(null); setOperador(null); setEsperando(false); };
  const borrar      = () => { if (!esperando) setDisp(d => d.length > 1 ? d.slice(0, -1) : '0'); };
  const alternarSgn = () => setDisp(d => d === '0' ? '0' : d.startsWith('-') ? d.slice(1) : '-' + d);

  const presionar = b => {
    if (!b) return;
    if (b === 'C')  { limpiar(); return; }
    if (b === '⌫') { borrar();  return; }
    if (b === '=')  { calcular(); return; }
    if (b === '±')  { alternarSgn(); return; }
    if (['+','-','×','÷'].includes(b)) { aplicarOp(b); return; }
    ingresarDigito(b);
  };

  const estiloBtn = b => {
    if (!b) return s.calcBtnOf;
    if (b === '=') return s.calcBtnEq;
    if (['+','-','×','÷'].includes(b)) return s.calcBtnOp;
    return s.calcBtn;
  };

  return (
    <div>
      <div style={s.tit}>
        <i className="ti ti-calculator" style={s.ico} aria-hidden="true"></i>
        Calculadora
      </div>
      <div style={s.calcDisp}>{disp}</div>
      <div style={s.calcGrid}>
        {BTNS.map((b, i) => (
          <button key={i} style={estiloBtn(b)} onClick={() => presionar(b)} disabled={!b}>
            {b}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── BLOC DE NOTAS ────────────────────────────────────────────────────────────
function BlocNotas({ userId }) {
  const [texto,     setTexto]     = useState('');
  const [guardando, setGuardando] = useState(false);
  const timerRef = useRef(null);
  const docId = userId || 'notas';

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'panel_widgets', docId), snap => {
      if (snap.exists()) setTexto(snap.data().contenido || '');
    });
    return unsub;
  }, [docId]);

  const guardar = async val => {
    setGuardando(true);
    await setDoc(doc(db, 'panel_widgets', docId), {
      contenido: val,
      actualizado: new Date().toISOString()
    });
    setGuardando(false);
  };

  const onChange = e => {
    const val = e.target.value;
    setTexto(val);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => guardar(val), 900);
  };

  return (
    <div style={s.notasWrap}>
      <div style={s.notasCab}>
        <i className="ti ti-notes" style={s.ico} aria-hidden="true"></i>
        Bloc de notas
        {guardando && <span style={s.guardando}>guardando…</span>}
      </div>
      <textarea
        style={s.notasArea}
        value={texto}
        onChange={onChange}
        placeholder="Escribe notas rápidas..."
      />
    </div>
  );
}

// ─── PANEL PRINCIPAL ──────────────────────────────────────────────────────────
export default function PanelWidgets({ userId }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className={`nm-panel-widgets${abierto ? ' abierto' : ''}`}>
      <button className="nm-widgets-tab" onClick={() => setAbierto(a => !a)} title={abierto ? 'Ocultar widgets' : 'Mostrar widgets'}>
        <i className={`ti ti-chevron-${abierto ? 'right' : 'left'}`} aria-hidden="true"></i>
      </button>
      <div className="nm-widgets-inner">
        <Calendario />
        <div style={s.sep} />
        <Calculadora />
        <div style={s.sep} />
        <BlocNotas userId={userId} />
      </div>
    </div>
  );
}
