import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, doc, setDoc, deleteDoc, updateDoc, onSnapshot, arrayUnion, arrayRemove } from 'firebase/firestore';

const MONITORES_LISTA = [
  { nombre: 'Daniela', turno: 'Manana' },
  { nombre: 'Ramon', turno: 'Manana' },
  { nombre: 'Santiago', turno: 'Tarde' },
  { nombre: 'Monica', turno: 'Tarde' },
  { nombre: 'Juan', turno: 'Noche' },
  { nombre: 'Cesar', turno: 'Noche' }
];

const FORM_VACIO = { nombreReal: '', nombreModelo: '', monitor: '', turno: '', clave: '', nacimiento: '', correo: '', lovense: '', amazon: '' };

export default function GestionModelos() {
  const [modelos, setModelos] = useState([]);
  const [monitores, setMonitores] = useState([]);
  const [modo, setModo] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [paginas, setPaginas] = useState([]);
  const [confirmEliminar, setConfirmEliminar] = useState(null);
  const [expandida, setExpandida] = useState(null);

  useEffect(() => {
    const unsub1 = onSnapshot(collection(db, 'modelos'), snap => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      data.sort((a, b) => a.nombreReal.localeCompare(b.nombreReal));
      setModelos(data);
    });
    const unsub2 = onSnapshot(collection(db, 'monitores'), snap => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      setMonitores(data);
    });
    return () => { unsub1(); unsub2(); };
  }, []);

  const guardar = async () => {
    if (!form.nombreReal || !form.monitor) return;
    const id = modo === 'nuevo' ? Date.now().toString() : modo;
    const modeloActual = modo !== 'nuevo' ? modelos.find(m => m.id === modo) : null;

    await setDoc(doc(db, 'modelos', id), {
      nombreReal: form.nombreReal,
      nombreModelo: form.nombreModelo,
      monitor: form.monitor,
      turno: form.turno,
      clave: form.clave || '',
      activa: true,
      nacimiento: form.nacimiento || '',
      correo: form.correo || '',
      lovense: form.lovense || '',
      amazon: form.amazon || '',
      paginas: paginas
    });

    // Sincronizar con la colección monitores
    if (modo === 'nuevo') {
      const monDoc = monitores.find(m => m.nombre === form.monitor);
      if (monDoc) await updateDoc(doc(db, 'monitores', monDoc.id), { modelas: arrayUnion(form.nombreReal) });
    } else if (modeloActual) {
      const oldMonitor = modeloActual.monitor;
      const oldNombreReal = modeloActual.nombreReal;
      if (oldMonitor !== form.monitor) {
        const oldMon = monitores.find(m => m.nombre === oldMonitor);
        if (oldMon) await updateDoc(doc(db, 'monitores', oldMon.id), { modelas: arrayRemove(oldNombreReal) });
        const newMon = monitores.find(m => m.nombre === form.monitor);
        if (newMon) await updateDoc(doc(db, 'monitores', newMon.id), { modelas: arrayUnion(form.nombreReal) });
      } else if (oldNombreReal !== form.nombreReal) {
        const monDoc = monitores.find(m => m.nombre === form.monitor);
        if (monDoc) {
          await updateDoc(doc(db, 'monitores', monDoc.id), { modelas: arrayRemove(oldNombreReal) });
          await updateDoc(doc(db, 'monitores', monDoc.id), { modelas: arrayUnion(form.nombreReal) });
        }
      }
    }

    setModo(null);
    setForm(FORM_VACIO);
    setPaginas([]);
  };

  const editar = (modelo) => {
    setModo(modelo.id);
    setForm({
      nombreReal: modelo.nombreReal,
      nombreModelo: modelo.nombreModelo || '',
      monitor: modelo.monitor,
      turno: modelo.turno,
      clave: modelo.clave || '',
      nacimiento: modelo.nacimiento || '',
      correo: modelo.correo || '',
      lovense: modelo.lovense || '',
      amazon: modelo.amazon || ''
    });
    setPaginas(modelo.paginas || []);
  };

  const eliminar = async (id) => {
    const modelo = modelos.find(m => m.id === id);
    await deleteDoc(doc(db, 'modelos', id));
    if (modelo) {
      const monDoc = monitores.find(m => m.nombre === modelo.monitor);
      if (monDoc) await updateDoc(doc(db, 'monitores', monDoc.id), { modelas: arrayRemove(modelo.nombreReal) });
    }
    setConfirmEliminar(null);
  };

  const seleccionarMonitor = (nombre) => {
    const m = MONITORES_LISTA.find(m => m.nombre === nombre);
    setForm(prev => ({ ...prev, monitor: nombre, turno: m?.turno || '' }));
  };

  const s = {
    wrap: { display: 'block' },
    btnNuevo: { background: 'var(--bg)', border: 'none', borderRadius: 12, boxShadow: 'var(--shadow-out)', color: 'var(--gold)', padding: '12px 20px', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer', marginBottom: 8 },
    form: { background: 'var(--bg2)', borderRadius: 14, padding: 20, boxShadow: 'var(--shadow-out)', marginBottom: 8 },
    label: { color: 'var(--text-sub)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6, display: 'block' },
    input: { width: '100%', background: 'var(--bg)', border: 'none', borderRadius: 10, boxShadow: 'var(--shadow-in)', color: 'var(--gold)', padding: '10px 12px', fontSize: 13, outline: 'none', marginBottom: 14 },
    select: { width: '100%', background: 'var(--bg)', border: 'none', borderRadius: 10, boxShadow: 'var(--shadow-in)', color: 'var(--gold)', padding: '10px 12px', fontSize: 13, outline: 'none', marginBottom: 14 },
    btnRow: { display: 'flex', gap: 10 },
    btnGuardar: { flex: 1, background: 'var(--bg)', border: 'none', borderRadius: 10, boxShadow: 'var(--shadow-out)', color: 'var(--gold)', padding: '10px', fontSize: 13, letterSpacing: 1, cursor: 'pointer' },
    btnCancelar: { background: 'transparent', border: 'none', color: 'var(--text-sub)', padding: '10px', fontSize: 13, cursor: 'pointer' },
    card: { background: 'var(--bg2)', borderRadius: 14, padding: 16, boxShadow: 'var(--shadow-out)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' },
    cardInfo: { flex: 1 },
    cardNombre: { color: 'var(--gold)', fontSize: 13, fontWeight: 500, marginBottom: 4 },
    cardSub: { color: 'var(--text-sub)', fontSize: 12 },
    cardBtns: { display: 'flex', gap: 8 },
    btnEditar: { background: 'var(--bg)', border: 'none', borderRadius: 8, boxShadow: 'var(--shadow-out)', color: 'var(--text-sub)', padding: '6px 12px', fontSize: 12, cursor: 'pointer' },
    btnEliminar: { background: 'var(--bg)', border: 'none', borderRadius: 8, boxShadow: 'var(--shadow-out)', color: '#d85a30', padding: '6px 12px', fontSize: 12, cursor: 'pointer' },
    confirmBox: { background: 'var(--bg)', borderRadius: 14, padding: 16, boxShadow: 'var(--shadow-in)', marginTop: 8 },
    confirmText: { color: 'var(--text-sub)', fontSize: 13, marginBottom: 12 },
    vacio: { color: 'var(--text-dim)', textAlign: 'center', padding: 40, fontSize: 13 },
    detalle: { background: 'var(--bg)', borderRadius: '0 0 14px 14px', padding: '12px 16px', boxShadow: 'var(--shadow-in)', marginTop: -4 },
    detalleRow: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' },
    detalleLabel: { color: 'var(--text-sub)', fontSize: 12 },
    detalleValor: { color: 'var(--text)', fontSize: 12 },
    turnoLabel: { color: 'var(--gold)', fontSize: 18, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12, marginTop: 10, paddingBottom: 8, borderBottom: '1px solid var(--border)' }
  };

  return (
    <div style={s.wrap}>
      {modo === null && (
        <button style={s.btnNuevo} onClick={() => { setModo('nuevo'); setForm({ nombreReal: '', nombreModelo: '', monitor: '', turno: '', clave: '' }); }}>
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
          <label style={s.label}>Clave de acceso</label>
          <input style={s.input} placeholder="Clave para la modelo" value={form.clave || ''} onChange={e => setForm(prev => ({ ...prev, clave: e.target.value }))} />
          <label style={s.label}>Fecha de nacimiento</label>
          <input style={s.input} placeholder="DD/MM/AAAA" value={form.nacimiento || ''} onChange={e => setForm(prev => ({ ...prev, nacimiento: e.target.value }))} />
          <label style={s.label}>Correo electrónico</label>
          <input style={s.input} type="email" placeholder="correo@ejemplo.com" value={form.correo || ''} onChange={e => setForm(prev => ({ ...prev, correo: e.target.value }))} />
          <label style={s.label}>Accesos Lovense</label>
          <input style={s.input} placeholder="Usuario / Clave" value={form.lovense || ''} onChange={e => setForm(prev => ({ ...prev, lovense: e.target.value }))} />
          <label style={s.label}>Accesos Amazon</label>
          <input style={s.input} placeholder="Usuario / Clave" value={form.amazon || ''} onChange={e => setForm(prev => ({ ...prev, amazon: e.target.value }))} />
          <label style={s.label}>Páginas</label>
          {paginas.map((p, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 6, marginBottom: 8 }}>
              <input style={{ ...s.input, marginBottom: 0 }} placeholder="Plataforma" value={p.nombre} onChange={e => setPaginas(ps => ps.map((x, idx) => idx === i ? { ...x, nombre: e.target.value } : x))} />
              <input style={{ ...s.input, marginBottom: 0 }} placeholder="Usuario" value={p.usuario} onChange={e => setPaginas(ps => ps.map((x, idx) => idx === i ? { ...x, usuario: e.target.value } : x))} />
              <input style={{ ...s.input, marginBottom: 0 }} placeholder="Clave" value={p.clave} onChange={e => setPaginas(ps => ps.map((x, idx) => idx === i ? { ...x, clave: e.target.value } : x))} />
              <button style={{ background: 'transparent', border: 'none', color: '#d85a30', cursor: 'pointer', fontSize: 16, padding: '0 4px' }} onClick={() => setPaginas(ps => ps.filter((_, idx) => idx !== i))}>✕</button>
            </div>
          ))}
          <button style={{ ...s.btnCancelar, color: 'var(--gold)', marginBottom: 14, display: 'block' }} onClick={() => setPaginas(ps => [...ps, { nombre: '', usuario: '', clave: '' }])}>+ Agregar página</button>
          <div style={s.btnRow}>
            <button style={s.btnGuardar} onClick={guardar}>Guardar</button>
            <button style={s.btnCancelar} onClick={() => { setModo(null); setPaginas([]); }}>Cancelar</button>
          </div>
        </div>
      )}

      {modelos.length === 0 && modo === null && <p style={s.vacio}>No hay modelos registradas</p>}

      {['Manana', 'Tarde', 'Noche'].map(turno => {
        const modelosTurno = modelos.filter(m => m.turno === turno);
        if (modelosTurno.length === 0) return null;
        return (
          <div key={turno} style={{ marginBottom: 8 }}>
            <div style={s.turnoLabel}>Turno {turno}</div>
            <div className="nm-grid-cards">
            {modelosTurno.map(m => (
              <div key={m.id} style={{ marginBottom: 12 }}>
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
                  <div style={s.detalle}>
                    <div style={s.detalleRow}>
                      <span style={s.detalleLabel}>Nombre real</span>
                      <span style={s.detalleValor}>{m.nombreReal}</span>
                    </div>
                    <div style={s.detalleRow}>
                      <span style={s.detalleLabel}>Nombre modelo</span>
                      <span style={s.detalleValor}>{m.nombreModelo || 'Sin definir'}</span>
                    </div>
                    <div style={s.detalleRow}>
                      <span style={s.detalleLabel}>Monitor</span>
                      <span style={s.detalleValor}>{m.monitor}</span>
                    </div>
                    <div style={{ ...s.detalleRow, borderBottom: 'none' }}>
                      <span style={s.detalleLabel}>Turno</span>
                      <span style={s.detalleValor}>{m.turno}</span>
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
          </div>
        );
      })}
    </div>
  );
}