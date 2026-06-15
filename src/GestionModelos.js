import React, { useState, useEffect } from 'react';
import { db, storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, doc, deleteDoc, updateDoc, onSnapshot, arrayUnion, arrayRemove } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

const MONITORES_LISTA = [
  { nombre: 'Daniela', turno: 'Manana' },
  { nombre: 'Ramon', turno: 'Manana' },
  { nombre: 'Santiago', turno: 'Tarde' },
  { nombre: 'Monica', turno: 'Tarde' },
  { nombre: 'Juan', turno: 'Noche' },
  { nombre: 'Cesar', turno: 'Noche' }
];

const FORM_VACIO = { nombreReal: '', nombreModelo: '', monitor: '', turno: '', clave: '', nacimiento: '', correo: '', lovense: '', amazon: '' };

const TURNO_ICONO = { 'Manana': '🌅', 'Tarde': '☀️', 'Noche': '🌙' };

export default function GestionModelos() {
  const [modelos, setModelos] = useState([]);
  const [monitores, setMonitores] = useState([]);
  const [modo, setModo] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [paginas, setPaginas] = useState([]);
  const [confirmEliminar, setConfirmEliminar] = useState(null);
  const [expandida, setExpandida] = useState(null);
const [fotoFile, setFotoFile] = useState(null);
const [fotoPreview, setFotoPreview] = useState(null);
const [vistaGrid, setVistaGrid] = useState(true);
const [busqueda, setBusqueda] = useState('');

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
    let fotoURL = form.fotoURL || '';
    if (fotoFile) {
      const storageRef = ref(storage, `fotos/${id}`);
      await uploadBytes(storageRef, fotoFile);
      fotoURL = await getDownloadURL(storageRef);
    }
    const modeloActual = modo !== 'nuevo' ? modelos.find(m => m.id === modo) : null;

    const guardarUsuario = httpsCallable(functions, 'guardarUsuario');
    await guardarUsuario({
      coleccion: 'modelos',
      id: id,
      clave: form.clave || '',
      datos: {
        nombreReal: form.nombreReal,
        nombreModelo: form.nombreModelo,
        monitor: form.monitor,
        turno: form.turno,
        activa: true,
        nacimiento: form.nacimiento || '',
        correo: form.correo || '',
        lovense: form.lovense || '',
        amazon: form.amazon || '',
        paginas: paginas,
        fotoURL: fotoURL
      }
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
      amazon: modelo.amazon || '',
      fotoURL: modelo.fotoURL || ''
    });
    setFotoFile(null);
    setFotoPreview(null);
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
    btnNuevo: { background: 'var(--gold)', border: 'none', borderRadius: 12, color: '#141414', padding: '12px 20px', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer', marginBottom: 8, fontWeight: 700 },
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
          <label style={s.label}>Foto</label>
          <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            {(fotoPreview || form.fotoURL) && (
              <img src={fotoPreview || form.fotoURL} alt="foto" style={{ width: 60, height: 60, borderRadius: 30, objectFit: 'cover', border: '2px solid var(--gold)' }} />
            )}
            <input type="file" accept="image/*" style={{ color: 'var(--text-sub)', fontSize: 12 }}
              onChange={e => {
                const file = e.target.files[0];
                if (file) { setFotoFile(file); setFotoPreview(URL.createObjectURL(file)); }
              }} />
          </div>
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

      {modo === null && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 10, padding: '9px 14px', flex: 1 }}>
            <i className="ti ti-search" style={{ color: 'var(--text-dim)', fontSize: 16 }} />
            <input style={{ background: 'transparent', border: 'none', color: 'var(--text)', fontSize: 13, outline: 'none', flex: 1 }} placeholder="Buscar modelo..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 8, padding: 3 }}>
            <button style={{ background: vistaGrid ? 'var(--bg3)' : 'transparent', border: 'none', borderRadius: 6, color: vistaGrid ? 'var(--gold)' : 'var(--text-sub)', padding: '6px 10px', cursor: 'pointer', fontSize: 16 }} onClick={() => setVistaGrid(true)}>⊞</button>
            <button style={{ background: !vistaGrid ? 'var(--bg3)' : 'transparent', border: 'none', borderRadius: 6, color: !vistaGrid ? 'var(--gold)' : 'var(--text-sub)', padding: '6px 10px', cursor: 'pointer', fontSize: 16 }} onClick={() => setVistaGrid(false)}>☰</button>
          </div>
        </div>
      )}

      {['Manana', 'Tarde', 'Noche'].map(turno => {
        const modelosTurno = modelos.filter(m => m.turno === turno && (m.nombreReal.toLowerCase().includes(busqueda.toLowerCase()) || (m.nombreModelo || '').toLowerCase().includes(busqueda.toLowerCase())));
        if (modelosTurno.length === 0) return null;
        return (
          <div key={turno} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 22 }}>{TURNO_ICONO[turno]}</span>
              <span style={{ color: 'var(--gold)', fontSize: 18, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Turno {turno}</span>
              <span style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 20, color: 'var(--text-sub)', fontSize: 11, padding: '4px 12px' }}>{modelosTurno.length} modelos</span>
            </div>
            <div className={vistaGrid ? 'nm-grid-cards' : ''} style={!vistaGrid ? { display: 'flex', flexDirection: 'column', gap: 10 } : {}}>
            {modelosTurno.map(m => (
              <div key={m.id}>
                <div style={{ background: 'var(--bg2)', borderRadius: 14, padding: 16, border: '1px solid var(--border2)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      {m.fotoURL
                        ? <img src={m.fotoURL} alt={m.nombreReal} style={{ width: 48, height: 48, borderRadius: 24, objectFit: 'cover', border: '1px solid var(--border2)' }} />
                        : <div style={{ width: 48, height: 48, borderRadius: 24, background: 'var(--bg3)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', fontSize: 18 }}>👤</div>
                      }
                      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, background: m.activa !== false ? '#4CAF7D' : 'var(--text-dim)', border: '2px solid var(--bg2)' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: 'var(--text)', fontSize: 14, fontWeight: 600 }}>{m.nombreReal}</div>
                      <div style={{ color: 'var(--text-sub)', fontSize: 11, marginTop: 2 }}>{m.nombreModelo ? `${m.nombreModelo} · ` : ''}{m.monitor}</div>
                      <span style={{ display: 'inline-block', marginTop: 6, background: 'rgba(201,146,74,0.15)', color: 'var(--gold)', fontSize: 10, padding: '2px 10px', borderRadius: 20, fontWeight: 500 }}>{m.turno}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                    <button style={{ flex: 1, background: 'var(--bg)', border: 'none', borderRadius: 8, boxShadow: 'var(--shadow-out)', color: 'var(--gold)', padding: '7px 12px', fontSize: 12, cursor: 'pointer' }} onClick={() => editar(m)}>✎ Editar</button>
                    <button style={{ flex: 1, background: 'var(--bg)', border: 'none', borderRadius: 8, boxShadow: 'var(--shadow-out)', color: '#d85a30', padding: '7px 12px', fontSize: 12, cursor: 'pointer' }} onClick={() => setConfirmEliminar(m.id)}>🗑 Eliminar</button>
                  </div>
                </div>
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