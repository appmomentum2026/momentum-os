import React, { useState, useEffect } from 'react';
import './App.css';
import { db, auth } from './firebase';
import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { signInAnonymously } from 'firebase/auth';
import { functions } from './firebase';
import Asistencia from './Asistencia';
import Novedades from './Novedades';
import CierreTurno from './CierreTurno';
import Nomina from './Nomina';
import Metas from './Metas';
import ResumenJefe from './ResumenJefe';
import GestionModelos from './GestionModelos';
import Inventario2 from './Inventario2';
import Pedidos from './Pedidos';
import { DiasLibresModelo, DiasLibresMonitor, DiasLibresJefe } from './DiasLibres';
import { solicitarPermiso, escucharNotificaciones } from './Notificaciones';
import GestionMonitores from './GestionMonitores';
import ResumenMonitores from './ResumenMonitores';
import ModelasMonitor from './ModelasMonitor';
import GoogleSheets from './GoogleSheets';
import PanelWidgets from './PanelWidgets';
import Finanzas from './Finanzas';


const HABITACIONES = Array.from({ length: 16 }, (_, i) => i + 1);
const ESTADOS = {
  libre: { color: '#4CAF7D', label: 'Libre', icono: 'circle-check' },
  ocupada: { color: '#C0614A', label: 'Ocupada', icono: 'lock' },
  fuera: { color: '#555566', label: 'Fuera de servicio', icono: 'tool' }
};

function MapaHabitaciones({ rol }) {
  const [habitaciones, setHabitaciones] = useState({});
  const [menuAbierto, setMenuAbierto] = useState(null);
  const [asistencia, setAsistencia] = useState({});
  const [modelos, setModelos] = useState([]);

  const hoy = new Date().toISOString().split('T')[0];

  useEffect(() => {
    signInAnonymously(auth).catch(err => console.error("Auth anónimo falló:", err));
    const unsub1 = onSnapshot(collection(db, 'habitaciones'), snap => {
      const data = {};
      snap.forEach(d => { data[d.id] = d.data(); });
      setHabitaciones(data);
    });
    const unsub2 = onSnapshot(collection(db, 'asistencia'), snap => {
      const data = {};
      snap.forEach(d => { data[d.id] = d.data(); });
      setAsistencia(data);
    });
    const unsub3 = onSnapshot(collection(db, 'modelos'), snap => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      setModelos(data);
    });
    return () => { unsub1(); unsub2(); unsub3(); };
  }, []);

  const cambiarEstado = async (num, estado) => {
    await setDoc(doc(db, 'habitaciones', String(num)), { estado, actualizado: new Date().toISOString() });
    setMenuAbierto(null);
  };

  const asistenciaHoy = Object.values(asistencia).filter(a => a.fecha === hoy);
  const presentes = asistenciaHoy.filter(a => a.presente === true).length;
  const ausentes = asistenciaHoy.filter(a => a.presente === false).length;
  const enLinea = Object.values(habitaciones).filter(h => h.estado === 'ocupada').length;

  // Modelo presente hoy en cada habitación
  const modeloEnHabitacion = (num) => {
    const modelo = modelos.find(m => String(m.habitacion) === String(num));
    if (!modelo) return null;
    const reg = asistencia[`${hoy}_${modelo.nombreReal}`];
    if (reg?.presente !== true) return null;
    return modelo;
  };

  // Stats para la dona
  const totalHabs = HABITACIONES.length;
  const libres = HABITACIONES.filter(n => (habitaciones[n]?.estado || 'libre') === 'libre').length;
  const ocupadas = HABITACIONES.filter(n => habitaciones[n]?.estado === 'ocupada').length;
  const fuera = HABITACIONES.filter(n => habitaciones[n]?.estado === 'fuera').length;
  const pctOcupacion = totalHabs > 0 ? Math.round((ocupadas / totalHabs) * 100) : 0;

  // Colores de fondo con contraste por estado
  const FONDOS = {
    libre: { bg: 'rgba(76,175,125,0.12)', borde: 'rgba(76,175,125,0.4)' },
    ocupada: { bg: 'rgba(192,97,74,0.14)', borde: 'rgba(192,97,74,0.45)' },
    fuera: { bg: 'rgba(120,120,140,0.12)', borde: 'rgba(120,120,140,0.35)' }
  };

  const LABELS = { libre: 'Libre', ocupada: 'Ocupada', fuera: 'Mantenimiento' };

  // Dona SVG
  const R = 40;
  const CIRC = 2 * Math.PI * R;
  const segLibre = (libres / totalHabs) * CIRC;
  const segOcupada = (ocupadas / totalHabs) * CIRC;
  const segFuera = (fuera / totalHabs) * CIRC;

  return (
    <div>
      

      {rol === 'jefe' && asistenciaHoy.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
          <div style={{ background: 'var(--bg2)', borderRadius: 12, padding: '12px 16px', border: '1px solid var(--border2)' }}>
            <div style={{ color: 'var(--text-sub)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Presentes hoy</div>
            <div style={{ color: '#4CAF7D', fontSize: 24, fontWeight: 600 }}>{presentes}</div>
          </div>
          <div style={{ background: 'var(--bg2)', borderRadius: 12, padding: '12px 16px', border: '1px solid var(--border2)' }}>
            <div style={{ color: 'var(--text-sub)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Ausentes hoy</div>
            <div style={{ color: '#d85a30', fontSize: 24, fontWeight: 600 }}>{ausentes}</div>
          </div>
          <div style={{ background: 'var(--bg2)', borderRadius: 12, padding: '12px 16px', border: '1px solid var(--border2)' }}>
            <div style={{ color: 'var(--text-sub)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>En línea ahora</div>
            <div style={{ color: 'var(--gold)', fontSize: 24, fontWeight: 600 }}>{enLinea}</div>
          </div>
        </div>
      )}

      <div className="nm-leyenda">
        {Object.entries(ESTADOS).map(([key, val]) => (
          <div key={key} className="nm-leyenda-item">
            <i className={`ti ti-${val.icono}`} style={{ color: val.color, fontSize: 15 }} aria-hidden="true"></i>
            {LABELS[key]}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: rol === 'jefe' ? '1fr 220px' : '1fr', gap: 16, alignItems: 'start' }} className="nm-mapa-layout">

        <div className="nm-hab-grid">
          {HABITACIONES.map(num => {
            const estado = habitaciones[num]?.estado || 'libre';
            const info = ESTADOS[estado];
            const fondo = FONDOS[estado];
            const abierto = menuAbierto === num;
            const modelo = estado === 'ocupada' ? modeloEnHabitacion(num) : null;
            return (
              <div key={num} className={`nm-hab${abierto ? ' abierto' : ''}`}
                style={{ background: fondo.bg, border: `1px solid ${fondo.borde}` }}
                onClick={() => rol === 'monitor' && setMenuAbierto(abierto ? null : num)}>
                <div className="nm-hab-num">{num}</div>
                {modelo && modelo.fotoURL ? (
                  <img src={modelo.fotoURL} alt={modelo.nombreReal}
                    style={{ width: 34, height: 34, borderRadius: 17, objectFit: 'cover', border: `2px solid ${info.color}`, margin: '2px auto' }} />
                ) : (
                  <div className="nm-hab-icono" style={{ color: info.color }}>
                    <i className={`ti ti-${info.icono}`} aria-hidden="true"></i>
                  </div>
                )}
                <div className="nm-hab-label" style={{ color: info.color }}>{LABELS[estado]}</div>
                {rol === 'monitor' && abierto && (
                  <div className="nm-menu-flotante">
                    {Object.entries(ESTADOS).map(([key, val]) => (
                      <button key={key}
                        onClick={e => { e.stopPropagation(); cambiarEstado(num, key); }}
                        className="nm-menu-btn" style={{ background: val.color }}>
                        {LABELS[key]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {rol === 'jefe' && (
          <div style={{ background: 'var(--bg2)', borderRadius: 16, padding: 18, border: '1px solid var(--border2)' }} className="nm-hide-mobile">
            <div style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Nivel de ocupación</div>
            <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 14px' }}>
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r={R} fill="none" stroke="var(--bg3)" strokeWidth="14" />
                <circle cx="60" cy="60" r={R} fill="none" stroke="#4CAF7D" strokeWidth="14"
                  strokeDasharray={`${segLibre} ${CIRC}`} strokeDashoffset="0"
                  transform="rotate(-90 60 60)" strokeLinecap="butt" />
                <circle cx="60" cy="60" r={R} fill="none" stroke="#C0614A" strokeWidth="14"
                  strokeDasharray={`${segOcupada} ${CIRC}`} strokeDashoffset={`-${segLibre}`}
                  transform="rotate(-90 60 60)" strokeLinecap="butt" />
                <circle cx="60" cy="60" r={R} fill="none" stroke="#787890" strokeWidth="14"
                  strokeDasharray={`${segFuera} ${CIRC}`} strokeDashoffset={`-${segLibre + segOcupada}`}
                  transform="rotate(-90 60 60)" strokeLinecap="butt" />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: 'var(--text)', fontSize: 18, fontWeight: 700 }}>{pctOcupacion}%</div>
                <div style={{ color: 'var(--text-sub)', fontSize: 7, textTransform: 'uppercase', letterSpacing: 0.5 }}>ocupación</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--text-sub)' }}><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: '#4CAF7D', marginRight: 6 }} />Libres</span>
                <span style={{ color: 'var(--text)' }}>{libres}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--text-sub)' }}><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: '#C0614A', marginRight: 6 }} />Ocupadas</span>
                <span style={{ color: 'var(--text)' }}>{ocupadas}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--text-sub)' }}><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: '#787890', marginRight: 6 }} />Mantenimiento</span>
                <span style={{ color: 'var(--text)' }}>{fuera}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


function BottomBar({ principales, vista, setVista, masItems }) {
  const [masAbierto, setMasAbierto] = useState(false);
  const hayMas = masItems && masItems.length > 0;

  return (
    <>
      {masAbierto && <div className="nm-mas-overlay" onClick={() => setMasAbierto(false)}></div>}
      <div className="nm-bottombar">
        {masAbierto && hayMas && (
          <div className="nm-mas-tray">
            <div className="nm-mas-tray-label">Más opciones</div>
            <div className="nm-mas-grid">
              {masItems.map(item => (
                <button key={item.id}
                  className={`nm-mas-item${vista === item.id ? ' activo' : ''}`}
                  onClick={() => { setVista(item.id); setMasAbierto(false); }}>
                  <i className={`ti ti-${item.icon}`} aria-hidden="true"></i>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="nm-bottombar-row">
          {principales.map(item => (
            <button key={item.id}
              className={`nm-bottom-btn${vista === item.id ? ' activo' : ''}`}
              onClick={() => { setVista(item.id); setMasAbierto(false); }}>
              <i className={`ti ti-${item.icon}`} aria-hidden="true"></i>
              <span>{item.label}</span>
            </button>
          ))}
          {hayMas && (
            <button className={`nm-bottom-btn${masAbierto ? ' activo' : ''}`}
              onClick={() => setMasAbierto(prev => !prev)}>
              <i className="ti ti-dots" aria-hidden="true"></i>
              <span>Más</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}

function Sidebar({ items, vista, setVista, titulo, sub, icono, onLogout, temaOscuro, toggleTema }) {
  return (
    <div className="nm-sidebar">
      <div className="nm-sidebar-header">
        <div className="nm-sidebar-icon"><i className={`ti ti-${icono}`} aria-hidden="true"></i></div>
        <div>
          <div className="nm-sidebar-title">{titulo}</div>
          <div className="nm-sidebar-sub">{sub}</div>
        </div>
      </div>
      {items.map(item => (
        <button key={item.id}
          className={`nm-side-btn${vista === item.id ? ' activo' : ''}`}
          onClick={() => setVista(item.id)}>
          <i className={`ti ti-${item.icon}`} aria-hidden="true"></i>
          <span>{item.label}</span>
        </button>
      ))}
      <div style={{ marginTop: 'auto', paddingTop: 12 }}>
        <div className="nm-tema-toggle" onClick={toggleTema} style={{ marginBottom: 8 }}>
          <div className={`nm-tema-switch${temaOscuro ? '' : ' on'}`}>
            <div className="nm-tema-switch-bola">{temaOscuro ? '🌙' : '☀️'}</div>
          </div>
          <span className="nm-tema-toggle-label">{temaOscuro ? 'Modo oscuro' : 'Modo claro'}</span>
        </div>
        <button className="nm-side-btn" onClick={onLogout}>
          <i className="ti ti-logout" aria-hidden="true"></i>
          <span>Salir</span>
        </button>
      </div>
    </div>
  );
}

function NavLayout({ todos, principales, masItems, vista, setVista, titulo, sub, icono, seccionLabel, onLogout, temaOscuro, toggleTema, userId, children }) {
  return (
    <>
      {/* ESCRITORIO: sidebar */}
      <div className="nm-layout-desktop">
        <div className="nm-layout">
          <Sidebar items={todos} vista={vista} setVista={setVista}
            titulo={titulo} sub={sub} icono={icono}
            onLogout={onLogout} temaOscuro={temaOscuro} toggleTema={toggleTema} />
          <div className="nm-content">
            <div className="nm-section-label">{seccionLabel}</div>
            {children}
          </div>
          <PanelWidgets userId={userId} />
        </div>
      </div>

      {/* MOVIL: barra inferior */}
      <div className="nm-layout-mobile">
        <div className="nm-wrap">
          <div className="nm-header">
            <div>
              <div className="nm-header-title">{titulo}</div>
              <div className="nm-header-sub">{sub}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="nm-tema-btn" onClick={toggleTema}>{temaOscuro ? '☀️' : '🌙'}</button>
              <button className="nm-exit-btn" onClick={onLogout}>
                <i className="ti ti-logout" aria-hidden="true"></i> Salir
              </button>
            </div>
          </div>
          <div className="nm-section-label">{seccionLabel}</div>
          {children}
          <BottomBar vista={vista} setVista={setVista}
            principales={principales} masItems={masItems} />
        </div>
      </div>
    </>
  );
}

function Login({ onLogin, temaOscuro, toggleTema }) {
  const [rol, setRol] = useState(null);
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [mostrarJefes, setMostrarJefes] = useState(false);

  const handleLogin = async () => {
    try {
      const verificar = httpsCallable(functions, 'verificarClave');
      const resultado = await verificar({ rol, clave });
      if (resultado.data.ok) {
        onLogin(rol, resultado.data.data);
      } else {
        setError('Clave incorrecta');
      }
    } catch (err) {
      setError('Clave incorrecta');
    }
  };

  return (
    <div className="nm-login-wrap">
      <div className="nm-logo-ring">
        <div className="nm-logo-inner">
          <img src="/logo.jpeg" alt="Momentum" style={{ width: 74, height: 74, objectFit: 'contain' }} />
        </div>
      </div>
      <div className="nm-title">Momentum</div>
      <div className="nm-sub">Studio OS</div>
      {!rol ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 260 }}>
          {!mostrarJefes ? (
            <>
              <button className="nm-role-btn" onClick={() => setMostrarJefes(true)}>
                <div className="nm-role-icon"><i className="ti ti-crown" aria-hidden="true"></i></div>
                Jefe
              </button>
              <button className="nm-role-btn" onClick={() => setRol('monitor')}>
                <div className="nm-role-icon"><i className="ti ti-device-desktop" aria-hidden="true"></i></div>
                Monitor
              </button>
              <button className="nm-role-btn" onClick={() => setRol('modelo')}>
                <div className="nm-role-icon"><i className="ti ti-star" aria-hidden="true"></i></div>
                Modelo
              </button>
            </>
          ) : (
            <>
              <div style={{ color: 'var(--text-sub)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Selecciona tu acceso</div>
              <button className="nm-role-btn" onClick={() => setRol('jefe')}>
                <div className="nm-role-icon"><i className="ti ti-crown" aria-hidden="true"></i></div>
                Jefe General
              </button>
              <button className="nm-role-btn" onClick={() => setRol('operativo')}>
                <div className="nm-role-icon"><i className="ti ti-shield" aria-hidden="true"></i></div>
                Jefe Operativo
              </button>
              <button className="nm-role-btn" onClick={() => setRol('administrativo')}>
                <div className="nm-role-icon"><i className="ti ti-calculator" aria-hidden="true"></i></div>
                Jefe Administrativo
              </button>
              <button className="nm-btn-volver" onClick={() => setMostrarJefes(false)}>← Volver</button>
            </>
          )}
          <div className="nm-tema-toggle" onClick={toggleTema} style={{ alignSelf: 'center', marginTop: 8 }}>
            <div className={`nm-tema-switch${temaOscuro ? '' : ' on'}`}>
              <div className="nm-tema-switch-bola">{temaOscuro ? '🌙' : '☀️'}</div>
            </div>
            <span className="nm-tema-toggle-label">{temaOscuro ? 'Modo oscuro' : 'Modo claro'}</span>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%', maxWidth: 260 }}>
          <div style={{ color: 'var(--gold)', fontSize: 16, fontWeight: 500, letterSpacing: 3, textTransform: 'uppercase' }}>{rol}</div>
          <input className="nm-input" type="password" placeholder="••••" value={clave}
            onChange={e => { setClave(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          {error && <div style={{ color: '#C0614A', fontSize: 13 }}>{error}</div>}
          <button className="nm-btn-entrar" onClick={handleLogin}>Entrar</button>
          <button className="nm-btn-volver" onClick={() => { setRol(null); setClave(''); setError(''); }}>Volver</button>
        </div>
      )}
      <div className="nm-divider"></div>
      <div className="nm-version">v1.0 · 2025</div>
    </div>
  );
}

function AppJefe({ onLogout, temaOscuro, toggleTema, userId }) {
  const [vista, setVista] = useState('mapa');

  const items = [
    { id: 'mapa', label: 'Mapa', icon: 'layout-grid' },
    { id: 'resumen', label: 'Nómina', icon: 'report-money' },
    { id: 'finanzas', label: 'Finanzas', icon: 'chart-bar' },
    { id: 'cierre', label: 'Cierres', icon: 'clipboard-check' },
    { id: 'metas', label: 'Metas', icon: 'target' },
    { id: 'inventario', label: 'Inventario', icon: 'package' },
    { id: 'pedidos', label: 'Pedidos', icon: 'shopping-bag' },
    { id: 'modelos', label: 'Modelos', icon: 'user-plus' },
    { id: 'monitores', label: 'Monitores', icon: 'users' },
    { id: 'diaslibres', label: 'Dias libres', icon: 'calendar' },
    { id: 'novedades', label: 'Novedades', icon: 'alert-circle' },
    { id: 'sheets', label: 'Sheets', icon: 'table' },
  ];

  const seccionLabel =
    vista === 'mapa' ? 'Mapa de habitaciones — en vivo' :
    vista === 'novedades' ? 'Novedades del turno' :
    vista === 'cierre' ? 'Cierres de turno' :
    vista === 'metas' ? 'Metas por modelo' :
    vista === 'resumen' ? 'Resumen quincenal' :
    vista === 'finanzas' ? 'Finanzas del estudio' :
    vista === 'sheets' ? 'Google Sheets — Nómina' :
    vista === 'modelos' ? 'Gestion de modelos' :
    vista === 'monitores' ? 'Gestion de monitores' :
    vista === 'inventario' ? 'Inventario' :
    vista === 'pedidos' ? 'Pedidos' :
    vista === 'diaslibres' ? 'Dias libres' : '';

  return (
    <NavLayout
      todos={items}
      principales={items.slice(0, 3)}
      masItems={items.slice(3)}
      vista={vista} setVista={setVista}
      titulo="Jefe" sub="Panel de control" icono="crown"
      seccionLabel={seccionLabel}
      onLogout={onLogout} temaOscuro={temaOscuro} toggleTema={toggleTema}
      userId={userId}
    >
      {vista === 'mapa' && <MapaHabitaciones rol="jefe" />}
      {vista === 'novedades' && <Novedades rol="jefe" />}
      {vista === 'cierre' && <CierreTurno rol="jefe" />}
      {vista === 'metas' && <Metas rol="jefe" />}
      {vista === 'resumen' && <ResumenJefe />}
      {vista === 'finanzas' && <Finanzas />}
      {vista === 'sheets' && <GoogleSheets />}
      {vista === 'modelos' && <GestionModelos />}
      {vista === 'monitores' && <ResumenMonitores />}
      {vista === 'monitores' && <GestionMonitores />}
      {vista === 'inventario' && <Inventario2 rol="jefe" />}
      {vista === 'pedidos' && <Pedidos rol="jefe" />}
      {vista === 'diaslibres' && <DiasLibresJefe />}
    </NavLayout>
  );
}

function AppMonitor({ onLogout, temaOscuro, toggleTema, monitorData }) {
  const [vista, setVista] = useState('mapa');


  const items = [
    { id: 'mapa', label: 'Mapa', icon: 'layout-grid' },
    { id: 'asistencia', label: 'Asistencia', icon: 'users' },
    { id: 'cierre', label: 'Cierre', icon: 'clipboard-check' },
    { id: 'novedades', label: 'Novedades', icon: 'alert-circle' },
    { id: 'modelos', label: 'Modelos', icon: 'id-badge' },
    { id: 'pedidos', label: 'Pedidos', icon: 'shopping-bag' },
    { id: 'diaslibres', label: 'Dias libres', icon: 'calendar' },
  ];

  const seccionLabel =
    vista === 'mapa' ? 'Mapa de habitaciones' :
    vista === 'asistencia' ? 'Registro de asistencia' :
    vista === 'novedades' ? 'Novedades del turno' :
    vista === 'cierre' ? 'Cierre de turno' :
    vista === 'modelos' ? 'Mis modelos' :
    vista === 'pedidos' ? 'Pedidos' : 'Dias libres';

  const userId = `monitor_${monitorData?.nombre || 'monitor'}`;

  return (
    <NavLayout
      todos={items}
      principales={items.slice(0, 3)}
      masItems={items.slice(3)}
      vista={vista} setVista={setVista}
      titulo="Monitor" sub={`${monitorData?.nombre || 'Monitor'} — ${monitorData?.turno || ''}`} icono="device-desktop"
      seccionLabel={seccionLabel}
      onLogout={onLogout} temaOscuro={temaOscuro} toggleTema={toggleTema}
      userId={userId}
    >
      {vista === 'mapa' && <MapaHabitaciones rol="monitor" />}
      {vista === 'asistencia' && <Asistencia rol="monitor" nombreMonitor={monitorData?.nombre || ''} modelasMonitor={monitorData?.modelas || []} />}
      {vista === 'novedades' && <Novedades rol="monitor" />}
      {vista === 'cierre' && <CierreTurno rol="monitor" nombreMonitor={monitorData?.nombre || ''} modelasMonitor={monitorData?.modelas || []} />}
      {vista === 'modelos' && <ModelasMonitor monitorData={monitorData} />}
      {vista === 'pedidos' && <Pedidos rol="monitor" />}
      {vista === 'diaslibres' && <DiasLibresMonitor nombreMonitor={monitorData?.nombre || ''} modelasMonitor={monitorData?.modelas || []} />}
    </NavLayout>
  );
}

function AppModelo({ onLogout, temaOscuro, toggleTema, modelaData }) {
  const [vista, setVista] = useState('mapa');
  const nombreModelo = modelaData?.nombreReal || '';

  const items = [
    { id: 'mapa', label: 'Habitaciones', icon: 'layout-grid' },
    { id: 'nomina', label: 'Mi quincena', icon: 'coin' },
    { id: 'tienda', label: 'Tienda', icon: 'shopping-cart' },
    { id: 'descanso', label: 'Descansos', icon: 'calendar' },
  ];

  const seccionLabel =
    vista === 'mapa' ? 'Habitaciones disponibles' :
    vista === 'nomina' ? 'Mi nomina en vivo' :
    vista === 'metas' ? 'Mi meta quincenal' :
    vista === 'tienda' ? 'Tienda de insumos' : 'Mis descansos';

  const userId = `modelo_${modelaData?.nombreReal || 'modelo'}`;

  return (
    <NavLayout
      todos={items}
      principales={items.slice(0, 3)}
      masItems={items.slice(3)}
      vista={vista} setVista={setVista}
      titulo="Mi panel" sub={modelaData?.nombreReal || 'Momentum Studio'} icono="star"
      seccionLabel={seccionLabel}
      onLogout={onLogout} temaOscuro={temaOscuro} toggleTema={toggleTema}
      userId={userId}
    >
      {vista === 'mapa' && <MapaHabitaciones rol="modelo" />}
      {vista === 'nomina' && <Nomina nombreModelo={nombreModelo} />}
      {vista === 'metas' && <Metas rol="modelo" nombreModelo={nombreModelo} />}
      {vista === 'tienda' && <Inventario2 rol="tienda" nombreModelo={nombreModelo} />}
      {vista === 'descanso' && <DiasLibresModelo nombreModelo={nombreModelo} />}
    </NavLayout>
  );
}

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [modelaData, setModelaData] = useState(null);
  const [monitorData, setMonitorData] = useState(null);
  const [temaOscuro, setTemaOscuro] = useState(true);
  const [notif, setNotif] = useState(null);

  useEffect(() => {
    document.body.className = temaOscuro ? 'oscuro' : 'claro';
  }, [temaOscuro]);

  useEffect(() => {
    document.body.className = 'oscuro';
  }, []);

  useEffect(() => {
    if (!usuario) return;
    const unsub = escucharNotificaciones((payload) => {
      setNotif(payload.notification);
      setTimeout(() => setNotif(null), 5000);
    });
    return unsub;
  }, [usuario]);

  const toggleTema = () => setTemaOscuro(prev => !prev);

  const handleLogin = (rol, data) => {
    setUsuario(rol);
    if (rol === 'modelo' && data) {
      setModelaData(data);
      solicitarPermiso('modelo', data.nombreReal);
    }
    if (rol === 'monitor' && data) {
      setMonitorData(data);
      solicitarPermiso('monitor', data.nombre);
    }
    if (rol === 'jefe' || rol === 'operativo' || rol === 'administrativo') {
      solicitarPermiso('jefe', rol);
    }
  };

  return (
    <>
      {notif && (
        <div style={{
          position: 'fixed', top: 16, right: 16, zIndex: 9999,
          background: 'var(--bg2)', border: '1px solid var(--border2)',
          borderRadius: 12, padding: '12px 16px', maxWidth: 280,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          <div style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{notif.title}</div>
          <div style={{ color: 'var(--text-sub)', fontSize: 12 }}>{notif.body}</div>
        </div>
      )}
      {!usuario && <Login onLogin={handleLogin} temaOscuro={temaOscuro} toggleTema={toggleTema} />}
      {usuario === 'jefe' && <AppJefe onLogout={() => setUsuario(null)} temaOscuro={temaOscuro} toggleTema={toggleTema} userId="jefe" />}
      {usuario === 'operativo' && <AppJefe onLogout={() => setUsuario(null)} temaOscuro={temaOscuro} toggleTema={toggleTema} soloLectura={true} userId="operativo" />}
      {usuario === 'administrativo' && <AppJefe onLogout={() => setUsuario(null)} temaOscuro={temaOscuro} toggleTema={toggleTema} soloAdmin={true} userId="administrativo" />}
      {usuario === 'monitor' && <AppMonitor onLogout={() => setUsuario(null)} temaOscuro={temaOscuro} toggleTema={toggleTema} monitorData={monitorData} userId={`monitor_${monitorData?.nombre}`} />}
      {usuario === 'modelo' && <AppModelo onLogout={() => setUsuario(null)} temaOscuro={temaOscuro} toggleTema={toggleTema} modelaData={modelaData} userId={`modelo_${modelaData?.nombreReal}`} />}
    </>
  );
}