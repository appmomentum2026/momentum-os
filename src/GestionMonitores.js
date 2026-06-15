import React, { useState, useEffect } from 'react';
import { db, functions } from './firebase';
import { collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

const TURNOS = ['Manana', 'Tarde', 'Noche'];

export default function GestionMonitores() {
  const [monitores, setMonitores] = useState([]);
  const [modo, setModo] = useState(null);
  const [form, setForm] = useState({ nombre: '', turno: '', clave: '' });
  const [guardando, setGuardando] = useState(false);

  const eliminar = async (id) => {
    if (!window.confirm('Seguro que quieres eliminar este monitor?')) return;
    await deleteDoc(doc(db, 'monitores', id));
  };

  const editar = (monitor) => {
    setModo(monitor.id);
    setForm({ nombre: monitor.nombre || '', turno: monitor.turno || '', clave: '' });
  };

  useEffect(() => {
    const handleEditar = (e) => {
      const monitor = monitores.find(m => m.nombre === e.detail);
      if (monitor) editar(monitor);
    };
    const handleEliminar = (e) => {
      const monitor = monitores.find(m => m.nombre === e.detail);
      if (monitor) eliminar(monitor.id);
    };
    document.addEventListener('editarMonitor', handleEditar);
    document.addEventListener('eliminarMonitor', handleEliminar);
    return () => {
      document.removeEventListener('editarMonitor', handleEditar);
      document.removeEventListener('eliminarMonitor', handleEliminar);
    };
  }, [monitores]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'monitores'), snap => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      data.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
      setMonitores(data);
    });
    return unsub;
  }, []);

  const guardar = async () => {
    if (!form.nombre || !form.turno) return;
    setGuardando(true);
    const id = modo === 'nuevo' ? form.nombre.toLowerCase().replace(/\s+/g, '_') : modo;
    const monitorActual = modo !== 'nuevo' ? monitores.find(m => m.id === modo) : null;

    try {
      const guardarUsuario = httpsCallable(functions, 'guardarUsuario');
      await guardarUsuario({
        coleccion: 'monitores',
        id: id,
        clave: form.clave || '',
        datos: {
          nombre: form.nombre,
          turno: form.turno,
          modelas: monitorActual?.modelas || []
        }
      });
      setModo(null);
      setForm({ nombre: '', turno: '', clave: '' });
    } catch (err) {
      console.error('Error guardando monitor:', err);
    }
    setGuardando(false);
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
    card: { background: 'var(--bg2)', borderRadius: 14, padding: 16, boxShadow: 'var(--shadow-out)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    cardInfo: { flex: 1 },
    cardNombre: { color: 'var(--gold)', fontSize: 14, fontWeight: 600, marginBottom: 4 },
    cardSub: { color: 'var(--text-sub)', fontSize: 12 },
    cardBtns: { display: 'flex', gap: 8 },
    btnEditar: { background: 'var(--bg)', border: 'none', borderRadius: 8, boxShadow: 'var(--shadow-out)', color: 'var(--text-sub)', padding: '6px 12px', fontSize: 12, cursor: 'pointer' },
    btnEliminar: { background: 'var(--bg)', border: 'none', borderRadius: 8, boxShadow: 'var(--shadow-out)', color: '#d85a30', padding: '6px 12px', fontSize: 12, cursor: 'pointer' },
    confirmBox: { background: 'var(--bg)', borderRadius: 14, padding: 16, boxShadow: 'var(--shadow-in)', marginBottom: 10 },
    confirmText: { color: 'var(--text-sub)', fontSize: 13, marginBottom: 12 },
    turnoLabel: { color: 'var(--gold)', fontSize: 18, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12, marginTop: 10, paddingBottom: 8, borderBottom: '1px solid var(--border)' }
  };

  return (
    <div style={s.wrap}>
      {modo === null && (
        <button style={s.btnNuevo} onClick={() => { setModo('nuevo'); setForm({ nombre: '', turno: '', clave: '' }); }}>
          + Agregar monitor
        </button>
      )}

      {modo !== null && (
        <div style={s.form}>
          <label style={s.label}>Nombre del monitor</label>
          <input style={s.input} placeholder="Nombre" value={form.nombre} onChange={e => setForm(prev => ({ ...prev, nombre: e.target.value }))} />
          <label style={s.label}>Turno</label>
          <select style={s.select} value={form.turno} onChange={e => setForm(prev => ({ ...prev, turno: e.target.value }))}>
            <option value="">Seleccionar turno</option>
            {TURNOS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <label style={s.label}>Clave de acceso {modo !== 'nuevo' && '(dejar vacío para no cambiar)'}</label>
          <input style={s.input} placeholder="Clave" value={form.clave} onChange={e => setForm(prev => ({ ...prev, clave: e.target.value }))} />
          <div style={s.btnRow}>
            <button style={s.btnGuardar} onClick={guardar} disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar'}</button>
            <button style={s.btnCancelar} onClick={() => setModo(null)}>Cancelar</button>
          </div>
        </div>
      )}

      {monitores.length === 0 && modo === null && <p style={{ color: 'var(--text-dim)', textAlign: 'center', padding: 40, fontSize: 13 }}>No hay monitores registrados</p>}

    </div>
  );
}
