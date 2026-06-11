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

function turnoDeModelo(nombre) {
  for (const [turno, lista] of Object.entries(MODELOS_POR_TURNO)) {
    if (lista.includes(nombre)) return turno;
  }
  return 'Sin turno';
}
const QUINCENA_ACTUAL = () => {
  const hoy = new Date();
  const dia = hoy.getDate();
  const mes = hoy.getMonth();
  const anio = hoy.getFullYear();
  if (dia <= 15) return `${anio}-${mes + 1}-Q1`;
  return `${anio}-${mes + 1}-Q2`;
};

const s = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: { background: 'var(--bg)', borderRadius: 14, padding: 16, boxShadow: 'var(--shadow-out)' },
  titulo: { color: 'var(--gold)', fontSize: 14, fontWeight: 500, letterSpacing: 1, marginBottom: 12 },
  label: { color: 'var(--text-sub)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6, display: 'block' },
  input: { width: '100%', background: 'var(--bg)', border: 'none', borderRadius: 10, boxShadow: 'var(--shadow-in)', color: 'var(--gold)', padding: '10px 12px', fontSize: 13, outline: 'none', marginBottom: 14 },
  btnEnviar: { width: '100%', background: 'var(--bg)', border: 'none', borderRadius: 10, boxShadow: 'var(--shadow-out)', color: 'var(--gold)', padding: '12px', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer' },
  fila: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' },
  filaLabel: { color: 'var(--text-sub)', fontSize: 13 },
  filaValor: { color: 'var(--text)', fontSize: 13 },
  badge: { padding: '3px 10px', borderRadius: 20, fontSize: 11, letterSpacing: 1, fontWeight: 500 },
  btnRow: { display: 'flex', gap: 8, marginTop: 10 },
  btn: { background: 'var(--bg)', border: 'none', borderRadius: 8, boxShadow: 'var(--shadow-out)', padding: '7px 14px', fontSize: 12, letterSpacing: 1, cursor: 'pointer' },
  vacio: { color: 'var(--text-dim)', textAlign: 'center', padding: 24, fontSize: 13 },
  nombre: { color: 'var(--gold)', fontSize: 13, fontWeight: 500, marginBottom: 4 },
  sub: { color: 'var(--text-sub)', fontSize: 12 },
  exito: { background: '#1d9e7522', borderRadius: 12, padding: 12, border: '1px solid #1d9e75', color: '#1d9e75', fontSize: 13, marginBottom: 12 },
  turnoLabel: { color: 'var(--gold)', fontSize: 18, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12, marginTop: 10, paddingBottom: 8, borderBottom: '1px solid var(--border)' }
};

const ESTADO_COLOR = {
  pendiente: { bg: '#C9A84C22', color: '#C9A84C' },
  aprobado: { bg: '#1d9e7522', color: '#1d9e75' },
  rechazado: { bg: '#d85a3022', color: '#d85a30' }
};

export function DiasLibresModelo({ nombreModelo }) {
  const [solicitud, setSolicitud] = useState(null);
  const [fecha1, setFecha1] = useState('');
  const [fecha2, setFecha2] = useState('');
  const [enviado, setEnviado] = useState(false);
  const quincena = QUINCENA_ACTUAL();
  const id = `${nombreModelo}_${quincena}_1`;

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'diasLibres', id), snap => {
      if (snap.exists()) setSolicitud(snap.data());
      else setSolicitud(null);
    });
    return unsub;
  }, [id]);

  const solicitar = async () => {
    if (!fecha1) return;
    await setDoc(doc(db, 'diasLibres', id), {
      modelo: nombreModelo,
      tipo: 'modelo',
      fecha1,
      fecha2: fecha2 || '',
      quincena,
      estado: 'pendiente',
      creado: new Date().toISOString()
    });
    setEnviado(true);
    setTimeout(() => setEnviado(false), 3000);
  };

  return (
    <div style={s.wrap}>
      {enviado && <div style={s.exito}>Solicitud enviada correctamente</div>}
      <div style={s.card}>
        <div style={s.titulo}>Mis dias de descanso</div>
        {solicitud?.estado === 'aprobado' ? (
          <div>
            <div style={s.fila}>
              <div style={s.filaLabel}>Dia 1</div>
              <div style={s.filaValor}>{solicitud.fecha1}</div>
            </div>
            {solicitud.fecha2 && <div style={s.fila}><div style={s.filaLabel}>Dia 2</div><div style={s.filaValor}>{solicitud.fecha2}</div></div>}
            <div style={{ ...s.fila, borderBottom: 'none' }}>
              <div style={s.filaLabel}>Estado</div>
              <div style={{ ...s.badge, background: '#1d9e7522', color: '#1d9e75' }}>Aprobado</div>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ color: 'var(--text-sub)', fontSize: 13, marginBottom: 16 }}>
              {solicitud ? 'Puedes cambiar las fechas hasta que el monitor las apruebe.' : 'Tienes 2 dias de descanso esta quincena.'}
              {solicitud && <span style={{ ...s.badge, background: ESTADO_COLOR[solicitud.estado]?.bg, color: ESTADO_COLOR[solicitud.estado]?.color, marginLeft: 8 }}>{solicitud.estado}</span>}
            </div>
            <label style={s.label}>Dia de descanso 1</label>
            <input style={s.input} type="date" value={fecha1 || solicitud?.fecha1 || ''} onChange={e => setFecha1(e.target.value)} />
            <label style={s.label}>Dia de descanso 2 (opcional)</label>
            <input style={s.input} type="date" value={fecha2 || solicitud?.fecha2 || ''} onChange={e => setFecha2(e.target.value)} />
            <button style={s.btnEnviar} onClick={solicitar}>
              {solicitud ? 'Actualizar dias de descanso' : 'Solicitar dias de descanso'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function DiasLibresMonitor({ nombreMonitor, modelasMonitor }) {
  const [solicitudesModelas, setSolicitudesModelas] = useState([]);
  const [miSolicitud, setMiSolicitud] = useState(null);
  const [fecha1, setFecha1] = useState('');
  const [fecha2, setFecha2] = useState('');
  const [enviado, setEnviado] = useState(false);
  const quincena = QUINCENA_ACTUAL();
  const idMonitor = `monitor_${nombreMonitor}_${quincena}`;

  useEffect(() => {
    const unsub1 = onSnapshot(doc(db, 'diasLibres', idMonitor), snap => {
      if (snap.exists()) setMiSolicitud(snap.data());
      else setMiSolicitud(null);
    });
    const unsub2 = onSnapshot(collection(db, 'diasLibres'), snap => {
      const data = [];
      snap.forEach(d => {
        const item = { id: d.id, ...d.data() };
        if (item.tipo === 'modelo' && modelasMonitor.includes(item.modelo)) data.push(item);
      });
      setSolicitudesModelas(data);
    });
    return () => { unsub1(); unsub2(); };
  }, [idMonitor, modelasMonitor]);

  const enviarSolicitud = async () => {
    if (!fecha1) return;
    await setDoc(doc(db, 'diasLibres', idMonitor), {
      monitor: nombreMonitor,
      tipo: 'monitor',
      fecha1,
      fecha2: fecha2 || '',
      quincena,
      estado: 'pendiente',
      creado: new Date().toISOString()
    });
    setEnviado(true);
    setTimeout(() => setEnviado(false), 3000);
  };

  const aprobarModela = async (sol, estado) => {
    await setDoc(doc(db, 'diasLibres', sol.id), { ...sol, estado });
  };

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.titulo}>Mis dias libres</div>
        {enviado && <div style={s.exito}>Solicitud enviada</div>}
        {miSolicitud?.estado === 'aprobado' ? (
          <div>
            <div style={s.fila}><div style={s.filaLabel}>Dia 1</div><div style={s.filaValor}>{miSolicitud.fecha1}</div></div>
            {miSolicitud.fecha2 && <div style={s.fila}><div style={s.filaLabel}>Dia 2</div><div style={s.filaValor}>{miSolicitud.fecha2}</div></div>}
            <div style={{ ...s.fila, borderBottom: 'none' }}>
              <div style={s.filaLabel}>Estado</div>
              <div style={{ ...s.badge, background: '#1d9e7522', color: '#1d9e75' }}>Aprobado</div>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ color: 'var(--text-sub)', fontSize: 13, marginBottom: 16 }}>
              {miSolicitud ? 'Puedes cambiar las fechas hasta que el jefe las apruebe.' : 'Tienes 2 dias libres esta quincena.'}
              {miSolicitud && <span style={{ ...s.badge, background: ESTADO_COLOR[miSolicitud.estado]?.bg, color: ESTADO_COLOR[miSolicitud.estado]?.color, marginLeft: 8 }}>{miSolicitud.estado}</span>}
            </div>
            <label style={s.label}>Dia libre 1</label>
            <input style={s.input} type="date" value={fecha1 || miSolicitud?.fecha1 || ''} onChange={e => setFecha1(e.target.value)} />
            <label style={s.label}>Dia libre 2 (opcional)</label>
            <input style={s.input} type="date" value={fecha2 || miSolicitud?.fecha2 || ''} onChange={e => setFecha2(e.target.value)} />
            <button style={s.btnEnviar} onClick={enviarSolicitud}>
              {miSolicitud ? 'Actualizar dias libres' : 'Solicitar dias libres'}
            </button>
          </div>
        )}
      </div>

      <div style={s.card}>
        <div style={s.titulo}>Descansos de mis modelos</div>
        {solicitudesModelas.length === 0 && <p style={s.vacio}>Ninguna modelo ha solicitado descanso</p>}
        {solicitudesModelas.map(sol => (
          <div key={sol.id} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
            <div style={s.nombre}>{sol.modelo}</div>
            <div style={s.sub}>Dia 1: {sol.fecha1}{sol.fecha2 && ` · Dia 2: ${sol.fecha2}`}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <div style={{ ...s.badge, background: ESTADO_COLOR[sol.estado]?.bg, color: ESTADO_COLOR[sol.estado]?.color }}>{sol.estado}</div>
              {sol.estado === 'pendiente' && (
                <div style={s.btnRow}>
                  <button style={{ ...s.btn, color: '#1d9e75' }} onClick={() => aprobarModela(sol, 'aprobado')}>Aprobar</button>
                  <button style={{ ...s.btn, color: '#d85a30' }} onClick={() => aprobarModela(sol, 'rechazado')}>Rechazar</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DiasLibresJefe() {
  const [solicitudes, setSolicitudes] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'diasLibres'), snap => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      setSolicitudes(data);
    });
    return unsub;
  }, []);

  const cambiarEstado = async (sol, estado) => {
    await setDoc(doc(db, 'diasLibres', sol.id), { ...sol, estado });
  };

  const monitores = solicitudes.filter(s => s.tipo === 'monitor');
  const modelos = solicitudes.filter(s => s.tipo === 'modelo');

  const renderSolicitud = (sol, puedeAprobar) => {
    const estadoColor = ESTADO_COLOR[sol.estado] || ESTADO_COLOR.pendiente;
    return (
      <div key={sol.id} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
        <div style={s.nombre}>{sol.monitor || sol.modelo}</div>
        <div style={s.sub}>Dia 1: {sol.fecha1}{sol.fecha2 && ` · Dia 2: ${sol.fecha2}`}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <div style={{ ...s.badge, background: estadoColor.bg, color: estadoColor.color }}>{sol.estado}</div>
          {sol.estado === 'pendiente' && puedeAprobar && (
            <div style={s.btnRow}>
              <button style={{ ...s.btn, color: '#1d9e75' }} onClick={() => cambiarEstado(sol, 'aprobado')}>Aprobar</button>
              <button style={{ ...s.btn, color: '#d85a30' }} onClick={() => cambiarEstado(sol, 'rechazado')}>Rechazar</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.titulo}>Dias libres de monitores</div>
        {monitores.length === 0 && <p style={s.vacio}>No hay solicitudes de monitores</p>}
        {monitores.map(sol => renderSolicitud(sol, true))}
      </div>
      <div style={s.card}>
        <div style={s.titulo}>Descansos de modelos</div>
        {modelos.length === 0 && <p style={s.vacio}>No hay solicitudes de modelos</p>}
        {['Manana', 'Tarde', 'Noche'].map(turno => {
          const modelosTurno = modelos.filter(sol => turnoDeModelo(sol.modelo) === turno);
          if (modelosTurno.length === 0) return null;
          return (
            <div key={turno} style={{ marginBottom: 8 }}>
              <div style={s.turnoLabel}>Turno {turno}</div>
              <div className="nm-grid-cards">
                {modelosTurno.map(sol => renderSolicitud(sol, false))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}