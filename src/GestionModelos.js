import React, { useState, useEffect } from 'react';
import { db, storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, doc, deleteField, updateDoc, onSnapshot, arrayUnion, arrayRemove } from 'firebase/firestore';
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

const FORM_VACIO = {
  nombreReal: '', nombreModelo: '', cedula: '', monitor: '', turno: '', habitacion: '',
  nacimiento: '', fechaInicio: '', contacto: '', direccion: '', correo: '',
  cuentaBancaria: '', entidadBancaria: '', lockers: [], contrato: '', clave: '',
  correoTrabajo: '', claveCorreoTrabajo: '',
  chaturbateUser: '', chaturbatePass: '', chaturbateLink: '',
  camsodaUser: '', camsodaPass: '', camsodaLink: '',
  stripchatUser: '', stripchatPass: '', stripchatLink: '',
  lovenseCorreo: '', lovenseClave: '', amazonCorreo: '', amazonClave: ''
};

// Compatibilidad: modelos viejas guardaban un solo "locker"; las nuevas guardan
// "lockers" (array). Si existe el array se usa ese; si no, se envuelve el valor viejo.
function lockersDeModelo(modelo) {
  if (Array.isArray(modelo.lockers)) return modelo.lockers;
  if (modelo.locker) return [modelo.locker];
  return [];
}

const TURNO_ICONO = { 'Manana': '🌅', 'Tarde': '☀️', 'Noche': '🌙' };

const s = {
  wrap: { display: 'block' },
  btnNuevo: { background: 'var(--gold)', border: 'none', borderRadius: 12, color: '#141414', padding: '12px 20px', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer', marginBottom: 8, fontWeight: 700 },
  form: { marginBottom: 8 },
  label: { color: 'var(--text-sub)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6, display: 'block' },
  input: { width: '100%', background: 'var(--bg)', border: 'none', borderRadius: 10, boxShadow: 'var(--shadow-in)', color: 'var(--gold)', padding: '10px 12px', fontSize: 13, outline: 'none', marginBottom: 14, boxSizing: 'border-box' },
  select: { width: '100%', background: 'var(--bg)', border: 'none', borderRadius: 10, boxShadow: 'var(--shadow-in)', color: 'var(--gold)', padding: '10px 12px', fontSize: 13, outline: 'none', marginBottom: 14, boxSizing: 'border-box' },
  btnRow: { display: 'flex', gap: 10 },
  btnGuardar: { flex: 1, background: 'var(--bg)', border: 'none', borderRadius: 10, boxShadow: 'var(--shadow-out)', color: 'var(--gold)', padding: '10px', fontSize: 13, letterSpacing: 1, cursor: 'pointer' },
  btnCancelar: { background: 'transparent', border: 'none', color: 'var(--text-sub)', padding: '10px', fontSize: 13, cursor: 'pointer' },
  btnEditar: { background: 'var(--bg)', border: 'none', borderRadius: 8, boxShadow: 'var(--shadow-out)', color: 'var(--text-sub)', padding: '6px 12px', fontSize: 12, cursor: 'pointer' },
  btnEliminar: { background: 'var(--bg)', border: 'none', borderRadius: 8, boxShadow: 'var(--shadow-out)', color: '#d85a30', padding: '6px 12px', fontSize: 12, cursor: 'pointer' },
  confirmBox: { background: 'var(--bg3)', borderRadius: 14, padding: 16, border: '1px solid rgba(216,90,48,0.45)', marginTop: 8 },
  confirmText: { color: 'var(--text-sub)', fontSize: 13, marginBottom: 12 },
  vacio: { color: 'var(--text-dim)', textAlign: 'center', padding: 40, fontSize: 13 },
  turnoLabel: { color: 'var(--gold)', fontSize: 18, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12, marginTop: 10, paddingBottom: 8, borderBottom: '1px solid var(--border)' },
  tabla: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', color: 'var(--text-sub)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', padding: '10px 12px', borderBottom: '1px solid var(--border2)', whiteSpace: 'nowrap' },
  td: { padding: '10px 12px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text)', userSelect: 'text' },
  secTit: { color: 'var(--text-sub)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginTop: 14, marginBottom: 8 },
  tabs: { display: 'flex', gap: 4, marginBottom: 18, borderBottom: '1px solid var(--border)' },
  tabBtn: { background: 'transparent', border: 'none', padding: '10px 18px', fontSize: 12, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-sub)', cursor: 'pointer', borderBottom: '2px solid transparent', marginBottom: -1, transition: 'color 0.15s, border-color 0.15s' },
  tabBtnActivo: { color: 'var(--gold)', borderBottom: '2px solid var(--gold)' },
  fotoWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 20 },
  fotoImg: { width: 96, height: 96, borderRadius: 48, objectFit: 'cover', border: '2px solid var(--gold)', boxShadow: 'var(--shadow-out)' },
  fotoPlaceholder: { width: 96, height: 96, borderRadius: 48, background: 'var(--bg3)', border: '2px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', fontSize: 32 },
  fotoBtn: { background: 'var(--bg)', boxShadow: 'var(--shadow-out)', borderRadius: 8, color: 'var(--gold)', padding: '6px 14px', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer', display: 'inline-block' },
  lockerRow: { display: 'flex', gap: 8, marginBottom: 8 },
  btnAddLocker: { background: 'var(--bg)', border: 'none', borderRadius: 10, boxShadow: 'var(--shadow-out)', color: 'var(--gold)', width: 42, fontSize: 18, fontWeight: 700, cursor: 'pointer', flexShrink: 0 },
  chip: { display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--bg)', boxShadow: 'var(--shadow-out)', borderRadius: 20, padding: '5px 8px 5px 12px', fontSize: 12, color: 'var(--gold)', fontWeight: 600 },
  chipRemove: { background: 'transparent', border: 'none', color: 'var(--text-sub)', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 2 },
  credBox: { background: 'var(--bg)', borderRadius: 10, padding: '8px 12px', boxShadow: 'var(--shadow-in)', marginBottom: 12 },
  credTit: { color: 'var(--text-sub)', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  credLinea: { color: 'var(--text)', fontSize: 12, marginTop: 2 },
  guardadoOverlay: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', borderRadius: 16, zIndex: 10, pointerEvents: 'none' },
  guardadoBox: { display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg2)', border: '1px solid #4CAF7D', borderRadius: 12, padding: '10px 18px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', color: '#4CAF7D', fontSize: 14, fontWeight: 700 },
};

function FormularioModelo({ values, setValues, tab, setTab, fotoPreview, fotoURLActual, onFotoChange, paginas, setPaginas, onMonitorChange, onGuardar, onCancelar }) {
  const [lockerInput, setLockerInput] = useState('');

  const campo = (label, key, extra = {}) => (
    <div>
      <label style={s.label}>{label}</label>
      <input style={s.input} value={values[key] || ''} onChange={e => setValues(prev => ({ ...prev, [key]: e.target.value }))} {...extra} />
    </div>
  );

  const agregarLocker = () => {
    const val = lockerInput.trim();
    if (!val) return;
    const num = Number(val);
    const lockerVal = val !== '' && Number.isFinite(num) ? num : val;
    setValues(prev => {
      const actuales = prev.lockers || [];
      if (actuales.some(l => String(l) === String(lockerVal))) return prev; // sin duplicados
      return { ...prev, lockers: [...actuales, lockerVal] };
    });
    setLockerInput('');
  };

  const quitarLocker = (i) => {
    setValues(prev => ({ ...prev, lockers: (prev.lockers || []).filter((_, idx) => idx !== i) }));
  };

  return (
    <>
      <div style={s.fotoWrap}>
        {(fotoPreview || fotoURLActual)
          ? <img src={fotoPreview || fotoURLActual} alt="foto" style={s.fotoImg} />
          : <div style={s.fotoPlaceholder}>👤</div>
        }
        <label style={s.fotoBtn}>
          Cambiar foto
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onFotoChange} />
        </label>
      </div>

      <div style={s.tabs}>
        <button type="button" style={{ ...s.tabBtn, ...(tab === 'personal' ? s.tabBtnActivo : {}) }} onClick={() => setTab('personal')}>Datos personales</button>
        <button type="button" style={{ ...s.tabBtn, ...(tab === 'plataformas' ? s.tabBtnActivo : {}) }} onClick={() => setTab('plataformas')}>Plataformas</button>
      </div>

      {tab === 'personal' && (
        <div className="nm-form-grid2">
          {campo('Nombre real', 'nombreReal')}
          {campo('Nombre de modelo', 'nombreModelo')}
          {campo('Cédula', 'cedula')}
          <div>
            <label style={s.label}>Monitor</label>
            <select style={s.select} value={values.monitor || ''} onChange={e => onMonitorChange(e.target.value)}>
              <option value="">Seleccionar monitor</option>
              {MONITORES_LISTA.map(m => <option key={m.nombre} value={m.nombre}>{m.nombre} — {m.turno}</option>)}
            </select>
          </div>
          <div>
            <label style={s.label}>Turno</label>
            <input style={{ ...s.input, color: 'var(--text-sub)' }} value={values.turno || ''} readOnly placeholder="Se asigna con el monitor" />
          </div>
          <div>
            <label style={s.label}>Habitación asignada</label>
            <select style={s.select} value={values.habitacion || ''} onChange={e => setValues(prev => ({ ...prev, habitacion: e.target.value }))}>
              <option value="">Sin habitación</option>
              {Array.from({ length: 16 }, (_, i) => i + 1).map(n => <option key={n} value={n}>Habitación {n}</option>)}
            </select>
          </div>
          {campo('Fecha de nacimiento', 'nacimiento', { type: 'date' })}
          {campo('Fecha de inicio', 'fechaInicio', { type: 'date' })}
          {campo('Teléfono / contacto', 'contacto')}
          {campo('Dirección', 'direccion')}
          {campo('Correo personal', 'correo', { type: 'email' })}
          {campo('Cuenta bancaria', 'cuentaBancaria')}
          {campo('Entidad bancaria', 'entidadBancaria')}
          <div>
            <label style={s.label}>Lockers asignados</label>
            <div style={s.lockerRow}>
              <input
                style={{ ...s.input, marginBottom: 0, flex: 1 }}
                type="number"
                placeholder="Número de locker"
                value={lockerInput}
                onChange={e => setLockerInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregarLocker(); } }}
              />
              <button type="button" style={s.btnAddLocker} onClick={agregarLocker}>+</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {(values.lockers || []).map((n, i) => (
                <span key={i} style={s.chip}>
                  {n}
                  <button type="button" style={s.chipRemove} onClick={() => quitarLocker(i)}>✕</button>
                </span>
              ))}
            </div>
          </div>
          <div>
            <label style={s.label}>Contrato</label>
            <select style={s.select} value={values.contrato || ''} onChange={e => setValues(prev => ({ ...prev, contrato: e.target.value }))}>
              <option value="">Seleccionar</option>
              <option value="Si">Sí</option>
              <option value="No">No</option>
            </select>
          </div>
          {campo('Clave de acceso', 'clave')}
        </div>
      )}

      {tab === 'plataformas' && (
        <>
          <div style={s.credBox}>
            <div style={s.credTit}>Clave de acceso</div>
            {values.clave
              ? <div style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 600 }}>{values.clave}</div>
              : <div style={{ color: 'var(--text-sub)', fontSize: 13, fontWeight: 600 }}>Sin asignar</div>
            }
          </div>

          <div className="nm-form-grid2">
            {campo('Correo de trabajo', 'correoTrabajo', { type: 'email' })}
            {campo('Contraseña correo trabajo', 'claveCorreoTrabajo')}
          </div>

          <div style={s.secTit}>Chaturbate</div>
          <div className="nm-form-grid2">
            {campo('Usuario', 'chaturbateUser')}
            {campo('Contraseña', 'chaturbatePass')}
          </div>
          {campo('Link', 'chaturbateLink')}

          <div style={s.secTit}>Camsoda</div>
          <div className="nm-form-grid2">
            {campo('Usuario', 'camsodaUser')}
            {campo('Contraseña', 'camsodaPass')}
          </div>
          {campo('Link', 'camsodaLink')}

          <div style={s.secTit}>Stripchat</div>
          <div className="nm-form-grid2">
            {campo('Usuario', 'stripchatUser')}
            {campo('Contraseña', 'stripchatPass')}
          </div>
          {campo('Link', 'stripchatLink')}

          <div style={s.secTit}>Lovense</div>
          <div className="nm-form-grid2">
            {campo('Correo', 'lovenseCorreo', { type: 'email' })}
            {campo('Contraseña', 'lovenseClave')}
          </div>

          <div style={s.secTit}>Amazon</div>
          <div className="nm-form-grid2">
            {campo('Correo', 'amazonCorreo', { type: 'email' })}
            {campo('Contraseña', 'amazonClave')}
          </div>

          <label style={s.label}>Otras plataformas</label>
          {paginas.map((p, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 6, marginBottom: 8 }}>
              <input style={{ ...s.input, marginBottom: 0 }} placeholder="Plataforma" value={p.nombre} onChange={e => setPaginas(ps => ps.map((x, idx) => idx === i ? { ...x, nombre: e.target.value } : x))} />
              <input style={{ ...s.input, marginBottom: 0 }} placeholder="Usuario" value={p.usuario} onChange={e => setPaginas(ps => ps.map((x, idx) => idx === i ? { ...x, usuario: e.target.value } : x))} />
              <input style={{ ...s.input, marginBottom: 0 }} placeholder="Clave" value={p.clave} onChange={e => setPaginas(ps => ps.map((x, idx) => idx === i ? { ...x, clave: e.target.value } : x))} />
              <button style={{ background: 'transparent', border: 'none', color: '#d85a30', cursor: 'pointer', fontSize: 16, padding: '0 4px' }} onClick={() => setPaginas(ps => ps.filter((_, idx) => idx !== i))}>✕</button>
            </div>
          ))}
          <button style={{ ...s.btnCancelar, color: 'var(--gold)', marginBottom: 14, display: 'block', padding: '4px 0' }} onClick={() => setPaginas(ps => [...ps, { nombre: '', usuario: '', clave: '' }])}>+ Agregar página</button>
        </>
      )}

      <div style={s.btnRow}>
        <button style={s.btnGuardar} onClick={onGuardar}>Guardar</button>
        <button style={s.btnCancelar} onClick={onCancelar}>Cancelar</button>
      </div>
    </>
  );
}

export default function GestionModelos() {
  const [modelos, setModelos] = useState([]);
  const [monitores, setMonitores] = useState([]);
  const [modo, setModo] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [tabForm, setTabForm] = useState('personal');
  const [paginas, setPaginas] = useState([]);
  const [confirmEliminar, setConfirmEliminar] = useState(null);
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [vistaGrid, setVistaGrid] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroMonitor, setFiltroMonitor] = useState({});
  const [vistaRetiradas, setVistaRetiradas] = useState(false);
  const [editando, setEditando] = useState(null);
  const [cerrandoEdicion, setCerrandoEdicion] = useState(null);
  const [guardadoOkId, setGuardadoOkId] = useState(null);
  const [formEdit, setFormEdit] = useState(FORM_VACIO);
  const [tabFormEdit, setTabFormEdit] = useState('personal');
  const [paginasEdit, setPaginasEdit] = useState([]);
  const [fotoFileEdit, setFotoFileEdit] = useState(null);
  const [fotoPreviewEdit, setFotoPreviewEdit] = useState(null);

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
    const id = Date.now().toString();
    let fotoURL = '';
    if (fotoFile) {
      const storageRef = ref(storage, `fotos/${id}`);
      await uploadBytes(storageRef, fotoFile);
      fotoURL = await getDownloadURL(storageRef);
    }

    const guardarUsuario = httpsCallable(functions, 'guardarUsuario');
    await guardarUsuario({
      coleccion: 'modelos',
      id: id,
      clave: form.clave || '',
      datos: {
        nombreReal: form.nombreReal,
        nombreModelo: form.nombreModelo,
        cedula: form.cedula || '',
        monitor: form.monitor,
        turno: form.turno,
        activa: true,
        habitacion: form.habitacion || '',
        nacimiento: form.nacimiento || '',
        fechaInicio: form.fechaInicio || '',
        contacto: form.contacto || '',
        direccion: form.direccion || '',
        correo: form.correo || '',
        cuentaBancaria: form.cuentaBancaria || '',
        entidadBancaria: form.entidadBancaria || '',
        lockers: form.lockers || [],
        contrato: form.contrato || '',
        correoTrabajo: form.correoTrabajo || '',
        claveCorreoTrabajo: form.claveCorreoTrabajo || '',
        chaturbateUser: form.chaturbateUser || '',
        chaturbatePass: form.chaturbatePass || '',
        chaturbateLink: form.chaturbateLink || '',
        camsodaUser: form.camsodaUser || '',
        camsodaPass: form.camsodaPass || '',
        camsodaLink: form.camsodaLink || '',
        stripchatUser: form.stripchatUser || '',
        stripchatPass: form.stripchatPass || '',
        stripchatLink: form.stripchatLink || '',
        lovenseCorreo: form.lovenseCorreo || '',
        lovenseClave: form.lovenseClave || '',
        amazonCorreo: form.amazonCorreo || '',
        amazonClave: form.amazonClave || '',
        paginas: paginas,
        fotoURL: fotoURL,
        claveVisible: form.clave || ''
      }
    });

    const monDoc = monitores.find(m => m.nombre === form.monitor);
    if (monDoc) await updateDoc(doc(db, 'monitores', monDoc.id), { modelas: arrayUnion(form.nombreReal) });

    setModo(null);
    setForm(FORM_VACIO);
    setTabForm('personal');
    setPaginas([]);
    setFotoFile(null);
    setFotoPreview(null);
  };

  const guardarEdicion = async () => {
    if (!formEdit.nombreReal || !formEdit.monitor) return;
    const id = editando;
    // Se capturan en variables locales antes de cerrar el formulario: el cierre es
    // inmediato (no espera al guardado async) y por lo tanto ya resetea formEdit/paginasEdit,
    // así que el resto de esta función no puede seguir leyendo esos estados.
    const datosForm = formEdit;
    const paginasForm = paginasEdit;
    const fotoFileForm = fotoFileEdit;
    const modeloActual = modelos.find(m => m.id === editando);

    // Cierre inmediato: el formulario se anima hacia afuera (fade-out/slide-up, ver
    // .nm-form-cerrando en App.css) y la tarjeta vuelve a modo lectura ya mismo, sin
    // esperar la respuesta de Firestore.
    setCerrandoEdicion(id);
    setTimeout(() => {
      setEditando(null);
      setFormEdit(FORM_VACIO);
      setTabFormEdit('personal');
      setPaginasEdit([]);
      setFotoFileEdit(null);
      setFotoPreviewEdit(null);
      setCerrandoEdicion(null);
    }, 200);

    let fotoURL = datosForm.fotoURL || '';
    if (fotoFileForm) {
      const storageRef = ref(storage, `fotos/${id}`);
      await uploadBytes(storageRef, fotoFileForm);
      fotoURL = await getDownloadURL(storageRef);
    }

    const guardarUsuario = httpsCallable(functions, 'guardarUsuario');
    await guardarUsuario({
      coleccion: 'modelos',
      id: id,
      clave: datosForm.clave || '',
      datos: {
        nombreReal: datosForm.nombreReal,
        nombreModelo: datosForm.nombreModelo,
        cedula: datosForm.cedula || '',
        monitor: datosForm.monitor,
        turno: datosForm.turno,
        activa: true,
        habitacion: datosForm.habitacion || '',
        nacimiento: datosForm.nacimiento || '',
        fechaInicio: datosForm.fechaInicio || '',
        contacto: datosForm.contacto || '',
        direccion: datosForm.direccion || '',
        correo: datosForm.correo || '',
        cuentaBancaria: datosForm.cuentaBancaria || '',
        entidadBancaria: datosForm.entidadBancaria || '',
        lockers: datosForm.lockers || [],
        contrato: datosForm.contrato || '',
        correoTrabajo: datosForm.correoTrabajo || '',
        claveCorreoTrabajo: datosForm.claveCorreoTrabajo || '',
        chaturbateUser: datosForm.chaturbateUser || '',
        chaturbatePass: datosForm.chaturbatePass || '',
        chaturbateLink: datosForm.chaturbateLink || '',
        camsodaUser: datosForm.camsodaUser || '',
        camsodaPass: datosForm.camsodaPass || '',
        camsodaLink: datosForm.camsodaLink || '',
        stripchatUser: datosForm.stripchatUser || '',
        stripchatPass: datosForm.stripchatPass || '',
        stripchatLink: datosForm.stripchatLink || '',
        lovenseCorreo: datosForm.lovenseCorreo || '',
        lovenseClave: datosForm.lovenseClave || '',
        amazonCorreo: datosForm.amazonCorreo || '',
        amazonClave: datosForm.amazonClave || '',
        paginas: paginasForm,
        fotoURL: fotoURL,
        claveVisible: datosForm.clave || ''
      }
    });

    if (modeloActual) {
      const oldMonitor = modeloActual.monitor;
      const oldNombreReal = modeloActual.nombreReal;
      if (oldMonitor !== datosForm.monitor) {
        const oldMon = monitores.find(m => m.nombre === oldMonitor);
        if (oldMon) await updateDoc(doc(db, 'monitores', oldMon.id), { modelas: arrayRemove(oldNombreReal) });
        const newMon = monitores.find(m => m.nombre === datosForm.monitor);
        if (newMon) await updateDoc(doc(db, 'monitores', newMon.id), { modelas: arrayUnion(datosForm.nombreReal) });
      } else if (oldNombreReal !== datosForm.nombreReal) {
        const monDoc = monitores.find(m => m.nombre === datosForm.monitor);
        if (monDoc) {
          await updateDoc(doc(db, 'monitores', monDoc.id), { modelas: arrayRemove(oldNombreReal) });
          await updateDoc(doc(db, 'monitores', monDoc.id), { modelas: arrayUnion(datosForm.nombreReal) });
        }
      }
    }

    // Confirmación visual: check verde "Guardado ✓" sobre la tarjeta, se desvanece solo en 1.5s
    setGuardadoOkId(id);
    setTimeout(() => setGuardadoOkId(prev => (prev === id ? null : prev)), 1500);
  };

  const editar = (modelo) => {
    setModo(null);
    setEditando(modelo.id);
    setTabFormEdit('personal');
    setFormEdit({
      nombreReal: modelo.nombreReal,
      nombreModelo: modelo.nombreModelo || '',
      cedula: modelo.cedula || '',
      monitor: modelo.monitor,
      turno: modelo.turno,
      clave: modelo.claveVisible || '',
      habitacion: modelo.habitacion || '',
      nacimiento: modelo.nacimiento || '',
      fechaInicio: modelo.fechaInicio || '',
      contacto: modelo.contacto || '',
      direccion: modelo.direccion || '',
      correo: modelo.correo || '',
      cuentaBancaria: modelo.cuentaBancaria || '',
      entidadBancaria: modelo.entidadBancaria || '',
      lockers: lockersDeModelo(modelo),
      contrato: modelo.contrato || '',
      correoTrabajo: modelo.correoTrabajo || '',
      claveCorreoTrabajo: modelo.claveCorreoTrabajo || '',
      chaturbateUser: modelo.chaturbateUser || '',
      chaturbatePass: modelo.chaturbatePass || '',
      chaturbateLink: modelo.chaturbateLink || '',
      camsodaUser: modelo.camsodaUser || '',
      camsodaPass: modelo.camsodaPass || '',
      camsodaLink: modelo.camsodaLink || '',
      stripchatUser: modelo.stripchatUser || '',
      stripchatPass: modelo.stripchatPass || '',
      stripchatLink: modelo.stripchatLink || '',
      lovenseCorreo: modelo.lovenseCorreo || '',
      lovenseClave: modelo.lovenseClave || '',
      amazonCorreo: modelo.amazonCorreo || '',
      amazonClave: modelo.amazonClave || '',
      fotoURL: modelo.fotoURL || ''
    });
    setFotoFileEdit(null);
    setFotoPreviewEdit(null);
    setPaginasEdit(modelo.paginas || []);
  };

  const eliminar = async (id) => {
    const modelo = modelos.find(m => m.id === id);
    await updateDoc(doc(db, 'modelos', id), { activa: false, fechaRetiro: new Date().toISOString() });
    if (modelo) {
      const monDoc = monitores.find(m => m.nombre === modelo.monitor);
      if (monDoc) await updateDoc(doc(db, 'monitores', monDoc.id), { modelas: arrayRemove(modelo.nombreReal) });
    }
    setConfirmEliminar(null);
  };

  const restaurar = async (id) => {
    const modelo = modelos.find(m => m.id === id);
    await updateDoc(doc(db, 'modelos', id), { activa: true, fechaRetiro: deleteField() });
    if (modelo) {
      const monDoc = monitores.find(m => m.nombre === modelo.monitor);
      if (monDoc) await updateDoc(doc(db, 'monitores', monDoc.id), { modelas: arrayUnion(modelo.nombreReal) });
    }
  };

  const seleccionarMonitor = (nombre) => {
    const m = MONITORES_LISTA.find(m => m.nombre === nombre);
    setForm(prev => ({ ...prev, monitor: nombre, turno: m?.turno || '' }));
  };

  const seleccionarMonitorEdit = (nombre) => {
    const m = MONITORES_LISTA.find(m => m.nombre === nombre);
    setFormEdit(prev => ({ ...prev, monitor: nombre, turno: m?.turno || '' }));
  };

  const retiradas = modelos.filter(m => m.activa === false);

  return (
    <div style={s.wrap}>
      {modo === null && (
        <button style={s.btnNuevo} onClick={() => { setModo('nuevo'); setEditando(null); setForm(FORM_VACIO); setTabForm('personal'); setPaginas([]); setFotoFile(null); setFotoPreview(null); }}>
          + Agregar modelo
        </button>
      )}

      {modo === 'nuevo' && (
        <div style={s.form} className="nm-form-inline nm-card-elevated">
          <FormularioModelo
            values={form}
            setValues={setForm}
            tab={tabForm}
            setTab={setTabForm}
            fotoPreview={fotoPreview}
            fotoURLActual={form.fotoURL}
            onFotoChange={e => { const file = e.target.files[0]; if (file) { setFotoFile(file); setFotoPreview(URL.createObjectURL(file)); } }}
            paginas={paginas}
            setPaginas={setPaginas}
            onMonitorChange={seleccionarMonitor}
            onGuardar={guardar}
            onCancelar={() => { setModo(null); setPaginas([]); setFotoFile(null); setFotoPreview(null); }}
          />
        </div>
      )}

      {modelos.filter(m => m.activa !== false).length === 0 && modo === null && !vistaRetiradas && (
        <p style={s.vacio}>No hay modelos registradas</p>
      )}

      {modo === null && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 4, alignItems: 'center' }}>
          {!vistaRetiradas && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 10, padding: '9px 14px', flex: 1 }}>
              <i className="ti ti-search" style={{ color: 'var(--text-dim)', fontSize: 16 }} />
              <input style={{ background: 'transparent', border: 'none', color: 'var(--text)', fontSize: 13, outline: 'none', flex: 1 }} placeholder="Buscar modelo..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
            </div>
          )}
          {!vistaRetiradas && (
            <div style={{ display: 'flex', gap: 4, background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 8, padding: 3 }}>
              <button style={{ background: vistaGrid ? 'var(--bg3)' : 'transparent', border: 'none', borderRadius: 6, color: vistaGrid ? 'var(--gold)' : 'var(--text-sub)', padding: '6px 10px', cursor: 'pointer', fontSize: 16 }} onClick={() => setVistaGrid(true)}>⊞</button>
              <button style={{ background: !vistaGrid ? 'var(--bg3)' : 'transparent', border: 'none', borderRadius: 6, color: !vistaGrid ? 'var(--gold)' : 'var(--text-sub)', padding: '6px 10px', cursor: 'pointer', fontSize: 16 }} onClick={() => setVistaGrid(false)}>☰</button>
            </div>
          )}
          <button
            style={{ background: vistaRetiradas ? 'rgba(216,90,48,0.1)' : 'var(--bg2)', border: vistaRetiradas ? '1px solid rgba(216,90,48,0.5)' : '1px solid var(--border2)', borderRadius: 8, color: vistaRetiradas ? '#d85a30' : 'var(--text-sub)', padding: '8px 12px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
            onClick={() => setVistaRetiradas(v => !v)}>
            {vistaRetiradas ? '← Volver a activas' : 'Retiradas'}
            {retiradas.length > 0 && <span style={{ background: '#d85a30', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>{retiradas.length}</span>}
          </button>
        </div>
      )}

      {vistaRetiradas && modo === null && (
        <div style={{ background: 'var(--bg2)', borderRadius: 14, border: '1px solid var(--border2)', overflow: 'hidden', marginTop: 8 }}>
          {retiradas.length === 0 ? (
            <p style={s.vacio}>No hay modelos retiradas</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={s.tabla}>
                <thead>
                  <tr>
                    <th style={s.th}>Nombre real</th>
                    <th style={s.th}>Nombre modelo</th>
                    <th style={s.th}>Monitor</th>
                    <th style={s.th}>Turno</th>
                    <th style={s.th}>Correo</th>
                    <th style={s.th}>Nacimiento</th>
                    <th style={s.th}>Fecha retiro</th>
                    <th style={s.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {retiradas.map(m => (
                    <tr key={m.id}>
                      <td style={s.td}>{m.nombreReal}</td>
                      <td style={s.td}>{m.nombreModelo || '—'}</td>
                      <td style={s.td}>{m.monitor}</td>
                      <td style={s.td}>{m.turno}</td>
                      <td style={s.td}>{m.correo || '—'}</td>
                      <td style={s.td}>{m.nacimiento || '—'}</td>
                      <td style={s.td}>{m.fechaRetiro ? m.fechaRetiro.split('T')[0] : '—'}</td>
                      <td style={s.td}>
                        <button style={{ background: 'var(--bg)', border: 'none', borderRadius: 8, boxShadow: 'var(--shadow-out)', color: '#4CAF7D', padding: '6px 12px', fontSize: 12, cursor: 'pointer' }} onClick={() => restaurar(m.id)}>Restaurar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!vistaRetiradas && ['Manana', 'Tarde', 'Noche'].map(turno => {
        const modelosTurno = modelos
          .filter(m => m.activa !== false && m.turno === turno && (!filtroMonitor[turno] || m.monitor === filtroMonitor[turno]) && (m.nombreReal.toLowerCase().includes(busqueda.toLowerCase()) || (m.nombreModelo || '').toLowerCase().includes(busqueda.toLowerCase())))
          .sort((a, b) => (parseInt(a.habitacion) || 99) - (parseInt(b.habitacion) || 99));
        if (modelosTurno.length === 0) return null;
        return (
          <div key={turno} style={{ marginBottom: 16, marginTop: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, paddingBottom: 10, borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 18 }}>{TURNO_ICONO[turno]}</span>
              <span style={{ color: 'var(--gold)', fontSize: 15, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>Turno {turno}</span>
              <span style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 20, color: 'var(--text-sub)', fontSize: 11, padding: '4px 12px' }}>{modelosTurno.length} modelos</span>
              <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                <button style={{ background: !filtroMonitor[turno] ? 'var(--gold)' : 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 20, color: !filtroMonitor[turno] ? '#141414' : 'var(--text-sub)', fontSize: 11, padding: '5px 14px', cursor: 'pointer', fontWeight: !filtroMonitor[turno] ? 700 : 400 }}
                  onClick={() => setFiltroMonitor(prev => ({ ...prev, [turno]: null }))}>Todos</button>
                {MONITORES_LISTA.filter(mon => mon.turno === turno).map(mon => (
                  <button key={mon.nombre} style={{ background: filtroMonitor[turno] === mon.nombre ? 'var(--gold)' : 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 20, color: filtroMonitor[turno] === mon.nombre ? '#141414' : 'var(--text-sub)', fontSize: 11, padding: '5px 14px', cursor: 'pointer', fontWeight: filtroMonitor[turno] === mon.nombre ? 700 : 400 }}
                    onClick={() => setFiltroMonitor(prev => ({ ...prev, [turno]: mon.nombre }))}>{mon.nombre}</button>
                ))}
              </div>
            </div>
            <div className={vistaGrid ? 'nm-grid-cards' : ''} style={!vistaGrid ? { display: 'flex', flexDirection: 'column', gap: 10 } : {}}>
            {modelosTurno.map(m => (
              <div key={m.id} style={{ position: 'relative' }}>
                <div className={`nm-card-elevated${editando === m.id ? (cerrandoEdicion === m.id ? ' nm-form-cerrando' : ' nm-form-inline') : ''}`}>
                  {editando === m.id ? (
                    <FormularioModelo
                      values={formEdit}
                      setValues={setFormEdit}
                      tab={tabFormEdit}
                      setTab={setTabFormEdit}
                      fotoPreview={fotoPreviewEdit}
                      fotoURLActual={formEdit.fotoURL}
                      onFotoChange={e => { const file = e.target.files[0]; if (file) { setFotoFileEdit(file); setFotoPreviewEdit(URL.createObjectURL(file)); } }}
                      paginas={paginasEdit}
                      setPaginas={setPaginasEdit}
                      onMonitorChange={seleccionarMonitorEdit}
                      onGuardar={guardarEdicion}
                      onCancelar={() => { setEditando(null); setPaginasEdit([]); setFotoFileEdit(null); setFotoPreviewEdit(null); }}
                    />
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          {m.fotoURL
                            ? <img src={m.fotoURL} alt={m.nombreReal} style={{ width: 48, height: 48, borderRadius: 24, objectFit: 'cover', border: '1px solid var(--border2)' }} />
                            : <div style={{ width: 48, height: 48, borderRadius: 24, background: 'var(--bg3)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', fontSize: 18 }}>👤</div>
                          }
                          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, background: '#4CAF7D', border: '2px solid var(--bg2)' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: 'var(--text)', fontSize: 14, fontWeight: 600 }}>{m.nombreReal}</div>
                          <div style={{ color: 'var(--text-sub)', fontSize: 11, marginTop: 2 }}>{m.nombreModelo ? `${m.nombreModelo} · ` : ''}{m.monitor}</div>
                          <span style={{ display: 'inline-block', marginTop: 6, background: 'rgba(201,146,74,0.15)', color: 'var(--gold)', fontSize: 10, padding: '2px 10px', borderRadius: 20, fontWeight: 500 }}>{m.turno}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                        <button style={{ flex: 1, background: 'var(--bg)', border: 'none', borderRadius: 8, boxShadow: 'var(--shadow-out)', color: 'var(--gold)', padding: '7px 12px', fontSize: 12, cursor: 'pointer' }} onClick={() => editar(m)}>✎ Editar</button>
                        <button style={{ flex: 1, background: 'var(--bg)', border: 'none', borderRadius: 8, boxShadow: 'var(--shadow-out)', color: '#d85a30', padding: '7px 12px', fontSize: 12, cursor: 'pointer' }} onClick={() => setConfirmEliminar(m.id)}>Retirar</button>
                      </div>
                    </>
                  )}
                </div>
                {guardadoOkId === m.id && (
                  <div className="nm-guardado-badge" style={s.guardadoOverlay}>
                    <div style={s.guardadoBox}>
                      <span style={{ fontSize: 18 }}>✓</span>
                      <span>Guardado</span>
                    </div>
                  </div>
                )}
                {confirmEliminar === m.id && (
                  <div style={s.confirmBox}>
                    <div style={s.confirmText}>¿Retirar a {m.nombreReal}? Se puede restaurar después.</div>
                    <div style={s.btnRow}>
                      <button style={{ ...s.btnEliminar, boxShadow: 'var(--shadow-out)' }} onClick={() => eliminar(m.id)}>Sí, retirar</button>
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
