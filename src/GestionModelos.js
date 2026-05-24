import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

const MONITORES_LISTA = [
  { nombre: 'Daniela', turno: 'Manana' },
  { nombre: 'Ramon', turno: 'Manana' },
  { nombre: 'Santiago', turno: 'Tarde' },
  { nombre: 'Monica', turno: 'Tarde' },
  { nombre: 'Juan', turno: 'Noche' },
  { nombre: 'Cesar', turno: 'Noche' }
];

export default function GestionModelos() {
  const [modelos, setModelos] = useState([]);
  const [modo, setModo] = useState(null); // 'nuevo' o id para editar
  const [form, setForm] = useState({ nombreReal: '', nombreModelo: '', monitor: '', turno: '' });
  const [confirmEliminar, setConfirmEliminar] = useState(null);
  const [expandida, setExpandida] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'modelos'), snap => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      data.sort((a, b) => a.nombreReal.localeCompare(b.nombreReal));
      setModelos(data);
    });
    return unsub;
  }, []);

  const guardar = async () => {
    if (!form.nombreReal || !form.monitor) return;
    const id = modo === 'nuevo' ? Date.now().toString() : modo;
    await setDoc(doc(db, 'modelos', id), {
      nombreReal: form.nombreReal,
      nombreModelo: form.nombreModelo,
      monitor: form.monitor,
      turno: form.turno,
      activa: true
    });
    setModo(null);
    setForm({ nombreReal: '', nombreModelo: '', monitor: '', turno: '' });
  };

  const editar = (modelo) => {
    setModo(modelo.id);
    setForm({ nombreReal: modelo.nombreReal, nombreModelo: modelo.nombreModelo || '', monitor: modelo.monitor, turno: modelo.turno });
  };

  const eliminar = async (id) => {
    await deleteDoc(doc(db, 'modelos', id));
    setConfirmEliminar(null);
  };

  const seleccionarMonitor = (nombre) => {
    const m = MONITORES_LISTA.find(m => m.nombre === nombre);
    setForm(prev => ({ ...prev, monitor: nombre, turno: m?.turno || '' }));
  };

  const s = {
    wrap: { display: 'flex', flexDirection: 'column', gap: 12 },
    btnNuevo: { background: 'var(--bg)', border: 'none', borderRadius: 12, boxShadow: 'var(--shadow-out)', color: 'var(--gold)', padding: '12px 20px', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer', marginBottom: 8 },
    form: { background: 'var(--bg)', borderRadius: 14, padding: 20, boxShadow: 'var(--shadow-out)', marginBottom: 8 },
    label: { color: 'var(--text-sub)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6, display: 'block' },
    input: { width: '100%', background: 'var(--bg)', border: 'none', borderRadius: 10, boxShadow: 'var(--shadow-in)', color: 'var(--gold)', padding: '10px 12px', fontSize: 13, outline: 'none', marginBottom: 14 },
    select: { width: '100%', background: 'var(--bg)', border: 'none', borderRadius: 10, boxShadow: 'var(--shadow-in)', color: 'var(--gold)', padding: '10px 12px', fontSize: 13, outline: 'none', marginBottom: 14 },
    btnRow: { display: 'flex', gap: 10 },
    btnGuardar: { flex: 1, background: 'var(--bg)', border: 'none', borderRadius: 10, boxShadow: 'var(--shadow-out)', color: 'var(--gold)', padding: '10px', fontSize: 13, letterSpacing: 1, cursor: 'pointer' },
    btnCancelar: { background: 'transparent', border: 'none', color: 'var(--text-sub)', padding: '10px', fontSize: 13, cursor: 'pointer' },
    card: { background: 'var(--bg)', borderRadius: 14, padding: 16, boxShadow: 'var(--shadow-out)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    cardInfo: { flex: 1 },
    cardNombre: { color: 'var(--gold)', fontSize: 13, fontWeight: 500, marginBottom: 4 },
    cardSub: { color: 'var(--text-sub)', fontSize: 12 },
    cardBtns: { display: 'flex', gap: 8 },
    btnEditar: { background: 'var(--bg)', border: 'none', borderRadius: 8, boxShadow: 'var(--shadow-out)', color: 'var(--text-sub)', padding: '6px 12px', fontSize: 12, cursor: 'pointer' },
    btnEliminar: { background: 'var(--bg)', border: 'none', borderRadius: 8, boxShadow: 'var(--shadow-out)', color: '#d85a30', padding: '6px 12px', fontSize: 12, cursor: 'pointer' },
    confirmBox: { background: 'var(--bg)', borderRadius: 14, padding: 16, boxShadow: 'var(--shadow-in)', marginTop: 8 },
    confirmText: { color: 'var(--text-sub)', fontSize: 13, marginBottom: 12 },
    vacio: { color: 'var(--text-dim)', textAlign: 'center', padding: 40, fontSize: 13 }
  };

  return (
    <div style={s.wrap}>
      {modo === null && (
        <button style={s.btnNuevo} onClick={() => { setModo('nuevo'); setForm({ nombreReal: '', nombreModelo: '', monitor: '', turno: '' }); }}>
          + Agregar modelo
        </button>
      )}

      {modo !== null && (
        <div style={s.form}>
          <label style={s.label}>Nombre real</label>
          <input style={s.input} placeholder="Nombre completo" value={form.nombreReal} onChange={e => setForm(prev => ({ ...prev, nombreReal: e.target.value }))} />
          <label style={s.label}>Nombre de modelo</label>
          <input style={s.input} placeholder="Nombre artistico" value={form.nombreModelo} onChange={e => setForm(prev => ({ ...prev, nombreModelo: e.target.value }))} />
          <label style={s.label}>Monitor</label>
          <select style={s.select} value={form.monitor} onChange={e => seleccionarMonitor(e.target.value)}>
            <option value="">Seleccionar monitor</option>
            {MONITORES_LISTA.map(m => <option key={m.nombre} value={m.nombre}>{m.nombre} — {m.turno}</option>)}
          </select>
          <label style={s.label}>Turno</label>
          <input style={{ ...s.input, color: 'var(--text-sub)' }} value={form.turno} readOnly placeholder="Se asigna con el monitor" />
          <div style={s.btnRow}>
            <button style={s.btnGuardar} onClick={guardar}>Guardar</button>
            <button style={s.btnCancelar} onClick={() => setModo(null)}>Cancelar</button>
          </div>
        </div>
      )}

      {modelos.length === 0 && modo === null && <p style={s.vacio}>No hay modelos registradas</p>}

      {modelos.length === 0 && modo === null && <p style={s.vacio}>No hay modelos registradas</p>}

      {modelos.map(m => (
        <div key={m.id}>
          <div style={s.card} onClick={() => setExpandida(expandida === m.id ? null : m.id)}>
            <div style={s.cardInfo}>
              <div style={s.cardNombre}>{m.nombreReal}</div>
              <div style={s.cardSub}>{m.nombreModelo && `${m.nombreModelo} · `}{m.monitor} · {m.turno}</div>
            </div>
            <div style={s.cardBtns}>
              <button style={s.btnEditar} onClick={e => { e.stopPropagation(); editar(m); }}>Editar</button>
              <button style={s.btnEliminar} onClick={e => { e.stopPropagation(); setConfirmEliminar(m.id); }}>Eliminar</button>
            </div>
          </div>
          {expandida === m.id && (
            <div style={{ background: 'var(--bg)', borderRadius: '0 0 14px 14px', padding: '12px 16px', boxShadow: 'var(--shadow-in)', marginTop: -4 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-sub)', fontSize: 12 }}>Nombre real</span>
                  <span style={{ color: 'var(--text)', fontSize: 12 }}>{m.nombreReal}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-sub)', fontSize: 12 }}>Nombre modelo</span>
                  <span style={{ color: 'var(--text)', fontSize: 12 }}>{m.nombreModelo || 'Sin definir'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-sub)', fontSize: 12 }}>Monitor</span>
                  <span style={{ color: 'var(--text)', fontSize: 12 }}>{m.monitor}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-sub)', fontSize: 12 }}>Turno</span>
                  <span style={{ color: 'var(--text)', fontSize: 12 }}>{m.turno}</span>
                </div>
              </div>
            </div>
          )}
          {confirmEliminar === m.id && (
            <div style={s.confirmBox}>
              <div style={s.confirmText}>Seguro que quieres eliminar a {m.nombreReal}?</div>
              <div style={s.btnRow}>
                <button style={{ ...s.btnEliminar, boxShadow: 'var(--shadow-out)' }} onClick={() => eliminar(m.id)}>Si, eliminar</button>
                <button style={s.btnCancelar} onClick={() => setConfirmEliminar(null)}>Cancelar</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}