import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, doc, setDoc, updateDoc, onSnapshot, arrayRemove, arrayUnion } from 'firebase/firestore';

const FORM_VACIO = { nombreReal: '', nombreModelo: '', clave: '', nacimiento: '', correo: '', lovense: '', amazon: '' };

const s = {
  btnNuevo: { background: 'var(--gold)', border: 'none', borderRadius: 12, color: '#141414', padding: '12px 20px', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer', marginBottom: 12, fontWeight: 700 },
  card: { background: 'var(--bg2)', borderRadius: 14, padding: 18, border: '1px solid var(--border2)', marginBottom: 10 },
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
  cabecera: { display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' },
  btnVerMas: { background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, padding: 4 },
  btnVerMasTxt: { fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-sub)' },
  chevron: { color: 'var(--gold)', fontSize: 16, transition: 'transform 0.25s ease' },
  panel: { overflow: 'hidden', transition: 'max-height 0.35s ease' },
  panelInner: { paddingTop: 14 },
  tabs: { display: 'flex', gap: 4, marginBottom: 12, borderBottom: '1px solid var(--border)' },
  tabBtn: { background: 'transparent', border: 'none', padding: '8px 14px', fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-sub)', cursor: 'pointer', borderBottom: '2px solid transparent', marginBottom: -1, transition: 'color 0.15s, border-color 0.15s' },
  tabBtnActivo: { color: 'var(--gold)', borderBottom: '2px solid var(--gold)' },
  vacioSeccion: { color: 'var(--text-dim)', fontSize: 12, padding: '10px 0' },
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
      <input style={s.input} type="date" value={form.nacimiento} onChange={e => setForm(f => ({ ...f, nacimiento: e.target.value }))} />
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
  const [editando, setEditando] = useState(null);
  const [formEdit, setFormEdit] = useState(FORM_VACIO);
  const [paginasEdit, setPaginasEdit] = useState([]);
  const [vistaGrid, setVistaGrid] = useState(true);
  const [expandidas, setExpandidas] = useState(new Set());
  const [tabCard, setTabCard] = useState({});

  const toggleExpandir = (id) => {
    setExpandidas(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'modelos'), snap => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      data.sort((a, b) => a.nombreReal.localeCompare(b.nombreReal));
      setModelos(data);
    });
    return unsub;
  }, []);

  const misModelos = modelos.filter(m => m.activa !== false && m.monitor === monitorData?.nombre);

  const iniciarEdicion = (m) => {
    setEditando(m.id);
    setFormEdit({ nombreReal: m.nombreReal, nombreModelo: m.nombreModelo || '', clave: m.clave || '', nacimiento: m.nacimiento || '', correo: m.correo || '', lovense: m.lovense || '', amazon: m.amazon || '' });
    setPaginasEdit(m.paginas || []);
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

  return (
    <div>
      {misModelos.length === 0 && (
        <div style={s.vacio}>No tienes modelos asignadas</div>
      )}

      {misModelos.length > 0 && <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 8, padding: 3 }}>
          <button style={{ background: vistaGrid ? 'var(--bg3)' : 'transparent', border: 'none', borderRadius: 6, color: vistaGrid ? 'var(--gold)' : 'var(--text-sub)', padding: '6px 10px', cursor: 'pointer', fontSize: 16 }} onClick={() => setVistaGrid(true)}>⊞</button>
          <button style={{ background: !vistaGrid ? 'var(--bg3)' : 'transparent', border: 'none', borderRadius: 6, color: !vistaGrid ? 'var(--gold)' : 'var(--text-sub)', padding: '6px 10px', cursor: 'pointer', fontSize: 16 }} onClick={() => setVistaGrid(false)}>☰</button>
        </div>
      </div>
      <div className={vistaGrid ? 'nm-grid-cards' : ''}>
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
          ) : (() => {
            const expandida = expandidas.has(m.id);
            const tab = tabCard[m.id] || 'personal';
            const plataformaBox = (nombre, user, pass, link) => {
              if (!user && !pass && !link) return null;
              return (
                <React.Fragment key={nombre}>
                  <div style={s.secTit}>{nombre}</div>
                  <div style={{ ...s.credBox, marginBottom: 6 }}>
                    {user && <div style={s.pagRow}><span style={s.pagLabel}>Usuario</span><span style={s.pagValor}>{user}</span></div>}
                    {pass && <div style={s.pagRow}><span style={s.pagLabel}>Clave</span><span style={s.pagValor}>{pass}</span></div>}
                    {link && <div style={s.pagRow}><span style={s.pagLabel}>Link</span><span style={s.pagValor}>{link}</span></div>}
                  </div>
                </React.Fragment>
              );
            };
            const hayDatosPersonales = m.nacimiento || m.correo || m.cedula || m.contacto || m.direccion || m.fechaInicio || m.cuentaBancaria || m.entidadBancaria || m.locker || m.contrato;
            const hayPlataformas = m.lovense || m.amazon || m.chaturbateUser || m.chaturbatePass || m.chaturbateLink || m.camsodaUser || m.camsodaPass || m.camsodaLink || m.stripchatUser || m.stripchatPass || m.stripchatLink || m.correoTrabajo || m.claveCorreoTrabajo || (m.paginas && m.paginas.length > 0);

            return (
              <>
                {/* Header con avatar */}
                <div style={s.cabecera} onClick={() => toggleExpandir(m.id)}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    {m.fotoURL
                      ? <img src={m.fotoURL} alt={m.nombreReal} style={{ width: 48, height: 48, borderRadius: 24, objectFit: 'cover', border: '1px solid var(--border2)' }} />
                      : <div style={{ width: 48, height: 48, borderRadius: 24, background: 'var(--bg3)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', fontSize: 18 }}>👤</div>
                    }
                    <div style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, background: '#4CAF7D', border: '2px solid var(--bg2)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: 'var(--text)', fontSize: 14, fontWeight: 600 }}>{m.nombreReal}</div>
                    {m.nombreModelo && <div style={{ color: 'var(--text-sub)', fontSize: 11, marginTop: 2 }}>{m.nombreModelo}</div>}
                  </div>
                  <button type="button" style={s.btnVerMas} onClick={e => { e.stopPropagation(); toggleExpandir(m.id); }}>
                    <span style={s.btnVerMasTxt}>{expandida ? 'Ver menos' : 'Ver más'}</span>
                    <i className="ti ti-chevron-down" style={{ ...s.chevron, transform: expandida ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                  </button>
                </div>

                {/* Contenido expandible */}
                <div style={{ ...s.panel, maxHeight: expandida ? 2000 : 0 }}>
                  <div style={s.panelInner}>
                    <div style={s.tabs}>
                      <button type="button" style={{ ...s.tabBtn, ...(tab === 'personal' ? s.tabBtnActivo : {}) }} onClick={() => setTabCard(prev => ({ ...prev, [m.id]: 'personal' }))}>Datos personales</button>
                      <button type="button" style={{ ...s.tabBtn, ...(tab === 'plataformas' ? s.tabBtnActivo : {}) }} onClick={() => setTabCard(prev => ({ ...prev, [m.id]: 'plataformas' }))}>Plataformas</button>
                    </div>

                    {tab === 'personal' && (
                      hayDatosPersonales ? (
                        <>
                          {m.nacimiento && <div style={s.fila}><span style={s.filaLabel}>Nacimiento</span><span style={s.filaValor}>{m.nacimiento}</span></div>}
                          {m.fechaInicio && <div style={s.fila}><span style={s.filaLabel}>Fecha de inicio</span><span style={s.filaValor}>{m.fechaInicio}</span></div>}
                          {m.cedula && <div style={s.fila}><span style={s.filaLabel}>Cédula</span><span style={s.filaValor}>{m.cedula}</span></div>}
                          {m.correo && <div style={s.fila}><span style={s.filaLabel}>Correo</span><span style={s.filaValor}>{m.correo}</span></div>}
                          {m.contacto && <div style={s.fila}><span style={s.filaLabel}>Contacto</span><span style={s.filaValor}>{m.contacto}</span></div>}
                          {m.direccion && <div style={s.fila}><span style={s.filaLabel}>Dirección</span><span style={s.filaValor}>{m.direccion}</span></div>}
                          {m.cuentaBancaria && <div style={s.fila}><span style={s.filaLabel}>Cuenta bancaria</span><span style={s.filaValor}>{m.cuentaBancaria}</span></div>}
                          {m.entidadBancaria && <div style={s.fila}><span style={s.filaLabel}>Entidad bancaria</span><span style={s.filaValor}>{m.entidadBancaria}</span></div>}
                          {m.locker && <div style={s.fila}><span style={s.filaLabel}>Locker</span><span style={s.filaValor}>{m.locker}</span></div>}
                          {m.contrato && <div style={{ ...s.fila, borderBottom: 'none' }}><span style={s.filaLabel}>Contrato</span><span style={s.filaValor}>{m.contrato}</span></div>}
                        </>
                      ) : <div style={s.vacioSeccion}>Sin datos registrados</div>
                    )}

                    {tab === 'plataformas' && (
                      hayPlataformas ? (
                        <>
                          {m.lovense && (
                            <>
                              <div style={s.secTit}>Lovense</div>
                              <div style={{ ...s.credBox, marginBottom: 6 }}><div style={s.credTexto}>{m.lovense}</div></div>
                            </>
                          )}
                          {m.amazon && (
                            <>
                              <div style={s.secTit}>Amazon</div>
                              <div style={{ ...s.credBox, marginBottom: 6 }}><div style={s.credTexto}>{m.amazon}</div></div>
                            </>
                          )}
                          {(m.correoTrabajo || m.claveCorreoTrabajo) && (
                            <>
                              <div style={s.secTit}>Correo de trabajo</div>
                              <div style={{ ...s.credBox, marginBottom: 6 }}>
                                {m.correoTrabajo && <div style={s.pagRow}><span style={s.pagLabel}>Correo</span><span style={s.pagValor}>{m.correoTrabajo}</span></div>}
                                {m.claveCorreoTrabajo && <div style={s.pagRow}><span style={s.pagLabel}>Clave</span><span style={s.pagValor}>{m.claveCorreoTrabajo}</span></div>}
                              </div>
                            </>
                          )}
                          {plataformaBox('Chaturbate', m.chaturbateUser, m.chaturbatePass, m.chaturbateLink)}
                          {plataformaBox('Camsoda', m.camsodaUser, m.camsodaPass, m.camsodaLink)}
                          {plataformaBox('Stripchat', m.stripchatUser, m.stripchatPass, m.stripchatLink)}
                          {m.paginas && m.paginas.length > 0 && (
                            <>
                              <div style={s.secTit}>Otras plataformas</div>
                              {m.paginas.map((p, i) => (
                                <div key={i} style={{ ...s.credBox, marginBottom: 6 }}>
                                  <div style={s.pagNombre}>{p.nombre || '—'}</div>
                                  {p.usuario && <div style={s.pagRow}><span style={s.pagLabel}>Usuario</span><span style={s.pagValor}>{p.usuario}</span></div>}
                                  {p.clave && <div style={s.pagRow}><span style={s.pagLabel}>Clave</span><span style={s.pagValor}>{p.clave}</span></div>}
                                </div>
                              ))}
                            </>
                          )}
                        </>
                      ) : <div style={s.vacioSeccion}>Sin plataformas registradas</div>
                    )}

                    {expandida && (
                      <div style={s.accionRow}>
                        <button style={s.btnEditar} onClick={() => iniciarEdicion(m)}>✎ Editar</button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      ))}
      </div>
      </>}
    </div>
  );
}
