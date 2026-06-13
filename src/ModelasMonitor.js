import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, doc, setDoc, deleteDoc, updateDoc, onSnapshot, arrayUnion, arrayRemove } from 'firebase/firestore';

const FORM_VACIO = { nombreReal: '', nombreModelo: '', clave: '', nacimiento: '', correo: '', lovense: '', amazon: '' };

const s = {
  btnNuevo: { background: 'var(--bg)', border: 'none', borderRadius: 12, boxShadow: 'var(--shadow-out)', color: 'var(--gold)', padding: '12px 20px', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer', marginBottom: 12 },
  card: { background: 'var(--bg2)', borderRadius: 14, padding: 18, border: '1px solid var(--border)', marginBottom: 10 },
  nombre: { color: 'var(--gold)', fontSize: 17, fontWeight: 700, marginBottom: 2 },
  nombreModelo: { color: 'var(--text-sub)', fontSize: 12, letterSpacing: 1, marginBottom: 12 },
  secTit: { color: 'var(--text-sub)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginTop: 12, marginBottom: 6 },
  fila: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12 },
  filaLabel: { color: 'var(--text-sub)', fontSize: 12 },
  filaValor: { color: 'var(--text)', fontSize: 12, textAlign: 'right', maxWidth: '60%', wordBreak: 'break-all' },
  credBox: { background: 'var(--bg)', borderRadius: 10, padding: '10px 12px', boxShadow: 'var(--shadow-in)', marginBottom: 6 },
  credTexto: { color: 'var(--text)', fontSize: 12, wordBreak: 'break-all' },
  pagNombre: { color: 'var(--gold)', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  pagRow: { display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '3px 0' },
  pagLabel: { color: 'var(--text-sub)' },
  pagValor: { color: 'var(--text)', wordBreak: 'break-all', textAlign: 'right', maxWidth: '65%' },
  accionRow: { display: 'flex', gap: 8, marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)' },
  btnEditar: { background: 'var(--bg)', border: 'none', borderRadius: 8, boxShadow: 'var(--shadow-out)', color: 'var(--gold)', padding: '6px 14px', fontSize: 12, cursor: 'pointer' },
  btnEliminar: { background: 'var(--bg)', border: 'none', borderRadius: 8, boxShadow: 'var(--shadow-out)', color: '#d85a30', padding: '6px 14px', fontSize: 12, cursor: 'pointer' },
  btnConfirmar: { background: '#d85a3022', border: '1px solid #d85a30', borderRadius: 8, color: '#d85a30', padding: '6px 10px', fontSize: 11, cursor: 'pointer', fontWeight: 600 },
  label: { color: 'var(--text-sub)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6, display: 'block' },
  input: { width: '100%', background: 'var(--bg)', border: 'none', borderRadius: 10, boxShadow: 'var(--shadow-in)', color: 'var(--gold)', padding: '10px 12px', fontSize: 13, outline: 'none', marginBottom: 12, boxSizing: 'border-box' },
  btnGuardar: { flex: 1, background: 'var(--bg)', border: 'none', borderRadius: 10, boxShadow: 'var(--shadow-out)', color: 'var(--gold)', padding: '10px', fontSize: 13, letterSpacing: 1, cursor: 'pointer' },
  btnCancelar: { background: 'transparent', border: 'none', color: 'var(--text-sub)', padding: '10px', fontSize: 13, cursor: 'pointer' },
  vacio: { color: 'var(--text-dim)', textAlign: 'center', padding: 40, fontSize: 13 },
};

function FormCampos({ form, setForm, paginas, setPaginas }) {
  return (
    <>
      <label style={s.label}>Nombre real</label>
      <input style={s.input} placeholder="Nombre completo" value={form.nombreReal} onChange={e => setForm(f => ({ ...f, nombreReal: e.target.value }))} />
      <label style={s.label}>Nombre de modelo</label>
      <input style={s.input} placeholder="Nombre artístico" value={form.nombreModelo} onChange={e => setForm(f => ({ ...f, nombreModelo: e.target.value }))} />
      <label style={s.label}>Clave de acceso</label>
      <input style={s.input} placeholder="Clave de login" value={form.clave} onChange={e => setForm(f => ({ ...f, clave: e.target.value }))} />
      <label style={s.label}>Fecha de nacimiento</label>
      <input style={s.input} placeholder="DD/MM/AAAA" value={form.nacimiento} onChange={e => setForm(f => ({ ...f, nacimiento: e.target.value }))} />
      <label style={s.label}>Correo electrónico</label>
      <input style={s.input} type="email" placeholder="correo@ejemplo.com" value={form.correo} onChange={e => setForm(f => ({ ...f, correo: e.target.value }))} />
      <label style={s.label}>Accesos Lovense</label>
      <input style={s.input} placeholder="Usuario / Clave" value={form.lovense} onChange={e => setForm(f => ({ ...f, lovense: e.target.value }))} />
      <label style={s.label}>Accesos Amazon</label>
      <input style={s.input} placeholder="Usuario / Clave" value={form.amazon} onChange={e => setForm(f => ({ ...f, amazon: e.target.value }))} />
      <label style={s.label}>Páginas</label>
      {paginas.map((p, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 6, marginBottom: 8 }}>
          <input style={{ ...s.input, marginBottom: 0 }} placeholder="Plataforma" value={p.nombre} onChange={e => setPaginas(ps => ps.map((x, idx) => idx === i ? { ...x, nombre: e.target.value } : x))} />
          <input style={{ ...s.input, marginBottom: 0 }} placeholder="Usuario" value={p.usuario} onChange={e => setPaginas(ps => ps.map((x, idx) => idx === i ? { ...x, usuario: e.target.value } : x))} />
          <input style={{ ...s.input, marginBottom: 0 }} placeholder="Clave" value={p.clave} onChange={e => setPaginas(ps => ps.map((x, idx) => idx === i ? { ...x, clave: e.target.value } : x))} />
          <button style={{ background: 'transparent', border: 'none', color: '#d85a30', cursor: 'pointer', fontSize: 16, padding: '0 4px' }} onClick={() => setPaginas(ps => ps.filter((_, idx) => idx !== i))}>✕</button>
        </div>
      ))}
      <button style={{ ...s.btnCancelar, color: 'var(--gold)', marginBottom: 12, display: 'block', padding: '4px 0' }} onClick={() => setPaginas(ps => [...ps, { nombre: '', usuario: '', clave: '' }])}>+ Agregar página</button>
    </>
  );
}

export default function ModelasMonitor({ monitorData }) {
  const [modelos, setModelos] = useState([]);
  const [creando, setCreando] = useState(false);
  const [formNuevo, setFormNuevo] = useState(FORM_VACIO);
  const [paginasNuevo, setPaginasNuevo] = useState([]);
  const [editando, setEditando] = useState(null);
  const [formEdit, setFormEdit] = useState(FORM_VACIO);
  const [paginasEdit, setPaginasEdit] = useState([]);
  const [confirmando, setConfirmando] = useState(null);

  const modelasMonitor = monitorData?.modelas || [];

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'modelos'), snap => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      data.sort((a, b) => a.nombreReal.localeCompare(b.nombreReal));
      setModelos(data);
    });
    return unsub;
  }, []);

  const misModelos = modelos.filter(m => modelasMonitor.includes(m.nombreReal));

  const crear = async () => {
    if (!formNuevo.nombreReal) return;
    const id = Date.now().toString();
    await setDoc(doc(db, 'modelos', id), {
      nombreReal: formNuevo.nombreReal,
      nombreModelo: formNuevo.nombreModelo,
      clave: formNuevo.clave || '',
      monitor: monitorData?.nombre || '',
      turno: monitorData?.turno || '',
      activa: true,
      nacimiento: formNuevo.nacimiento || '',
      correo: formNuevo.correo || '',
      lovense: formNuevo.lovense || '',
      amazon: formNuevo.amazon || '',
      paginas: paginasNuevo
    });
    if (monitorData?.id) {
      await updateDoc(doc(db, 'monitores', monitorData.id), { modelas: arrayUnion(formNuevo.nombreReal) });
    }
    setCreando(false);
    setFormNuevo(FORM_VACIO);
    setPaginasNuevo([]);
  };

  const iniciarEdicion = (m) => {
    setEditando(m.id);
    setFormEdit({ nombreReal: m.nombreReal, nombreModelo: m.nombreModelo || '', clave: m.clave || '', nacimiento: m.nacimiento || '', correo: m.correo || '', lovense: m.lovense || '', amazon: m.amazon || '' });
    setPaginasEdit(m.paginas || []);
    setConfirmando(null);
  };

  const guardarEdicion = async () => {
    if (!editando || !formEdit.nombreReal) return;
    const modeloActual = modelos.find(m => m.id === editando);
    await setDoc(doc(db, 'modelos', editando), {
      ...modeloActual,
      nombreReal: formEdit.nombreReal,
      nombreModelo: formEdit.nombreModelo,
      clave: formEdit.clave,
      nacimiento: formEdit.nacimiento,
      correo: formEdit.correo,
      lovense: formEdit.lovense,
      amazon: formEdit.amazon,
      paginas: paginasEdit
    });
    // Si cambió el nombreReal, sincronizar modelas del monitor
    if (monitorData?.id && modeloActual && modeloActual.nombreReal !== formEdit.nombreReal) {
      await updateDoc(doc(db, 'monitores', monitorData.id), { modelas: arrayRemove(modeloActual.nombreReal) });
      await updateDoc(doc(db, 'monitores', monitorData.id), { modelas: arrayUnion(formEdit.nombreReal) });
    }
    setEditando(null);
    setFormEdit(FORM_VACIO);
    setPaginasEdit([]);
  };

  const eliminar = async (id) => {
    const modelo = modelos.find(m => m.id === id);
    await deleteDoc(doc(db, 'modelos', id));
    if (monitorData?.id && modelo) {
      await updateDoc(doc(db, 'monitores', monitorData.id), { modelas: arrayRemove(modelo.nombreReal) });
    }
    setConfirmando(null);
  };

  return (
    <div>
      {!creando && (
        <button style={s.btnNuevo} onClick={() => setCreando(true)}>+ Nueva modelo</button>
      )}

      {creando && (
        <div style={s.card}>
          <FormCampos form={formNuevo} setForm={setFormNuevo} paginas={paginasNuevo} setPaginas={setPaginasNuevo} />
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={s.btnGuardar} onClick={crear}>Guardar</button>
            <button style={s.btnCancelar} onClick={() => { setCreando(false); setFormNuevo(FORM_VACIO); setPaginasNuevo([]); }}>Cancelar</button>
          </div>
        </div>
      )}

      {misModelos.length === 0 && !creando && (
        <div style={s.vacio}>No tienes modelos asignadas</div>
      )}

      {misModelos.map(m => (
        <div key={m.id} style={s.card}>
          {editando === m.id ? (
            <>
              <FormCampos form={formEdit} setForm={setFormEdit} paginas={paginasEdit} setPaginas={setPaginasEdit} />
              <div style={{ display: 'flex', gap: 10 }}>
                <button style={s.btnGuardar} onClick={guardarEdicion}>Guardar</button>
                <button style={s.btnCancelar} onClick={() => { setEditando(null); setPaginasEdit([]); }}>Cancelar</button>
              </div>
            </>
          ) : (
            <>
              <div style={s.nombre}>{m.nombreReal}</div>
              {m.nombreModelo && <div style={s.nombreModelo}>{m.nombreModelo}</div>}

              <div style={s.fila}>
                <span style={s.filaLabel}>Nacimiento</span>
                <span style={s.filaValor}>{m.nacimiento || '—'}</span>
              </div>
              <div style={{ ...s.fila, borderBottom: m.lovense || m.amazon || (m.paginas?.length > 0) ? '1px solid var(--border)' : 'none' }}>
                <span style={s.filaLabel}>Correo</span>
                <span style={s.filaValor}>{m.correo || '—'}</span>
              </div>

              {m.lovense && (
                <>
                  <div style={s.secTit}>Lovense</div>
                  <div style={s.credBox}><div style={s.credTexto}>{m.lovense}</div></div>
                </>
              )}

              {m.amazon && (
                <>
                  <div style={s.secTit}>Amazon</div>
                  <div style={s.credBox}><div style={s.credTexto}>{m.amazon}</div></div>
                </>
              )}

              {m.paginas && m.paginas.length > 0 && (
                <>
                  <div style={s.secTit}>Páginas</div>
                  {m.paginas.map((p, i) => (
                    <div key={i} style={{ ...s.credBox, marginBottom: 6 }}>
                      <div style={s.pagNombre}>{p.nombre || '—'}</div>
                      {p.usuario && <div style={s.pagRow}><span style={s.pagLabel}>Usuario</span><span style={s.pagValor}>{p.usuario}</span></div>}
                      {p.clave && <div style={s.pagRow}><span style={s.pagLabel}>Clave</span><span style={s.pagValor}>{p.clave}</span></div>}
                    </div>
                  ))}
                </>
              )}

              <div style={s.accionRow}>
                <button style={s.btnEditar} onClick={() => iniciarEdicion(m)}>Editar</button>
                {confirmando === m.id ? (
                  <>
                    <button style={s.btnConfirmar} onClick={() => eliminar(m.id)}>¿Confirmar?</button>
                    <button style={s.btnCancelar} onClick={() => setConfirmando(null)}>No</button>
                  </>
                ) : (
                  <button style={s.btnEliminar} onClick={() => setConfirmando(m.id)}>Eliminar</button>
                )}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
