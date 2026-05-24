import React, { useState, useEffect } from 'react';
import './App.css';
import { db } from './firebase';
import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';
import Asistencia from './Asistencia';
import Novedades from './Novedades';
import CierreTurno from './CierreTurno';
import Nomina from './Nomina';
import Metas from './Metas';
const CLAVES = { jefe: '1234', monitor: '5678', modelo: '9012' };
const HABITACIONES = Array.from({ length: 16 }, (_, i) => i + 1);
const ESTADOS = {
  libre: { color: '#1d9e75', label: 'Libre' },
  ocupada: { color: '#d85a30', label: 'Ocupada' },
  fuera: { color: '#444466', label: 'Fuera de servicio' }
};

const nm = {
  wrap: { background: '#1a1a2e', minHeight: '100vh', padding: '1.5rem' },
  loginWrap: { background: '#1a1a2e', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' },
  logoRing: { width: 90, height: 90, borderRadius: '50%', background: '#1a1a2e', boxShadow: '6px 6px 12px #0d0d1a, -6px -6px 12px #272742', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' },
  logoInner: { width: 66, height: 66, borderRadius: '50%', background: '#1a1a2e', boxShadow: 'inset 3px 3px 6px #0d0d1a, inset -3px -3px 6px #272742', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 500, color: '#C9A84C' },
  title: { fontSize: 20, fontWeight: 500, color: '#C9A84C', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 4 },
  sub: { fontSize: 11, color: '#555577', letterSpacing: 3, textTransform: 'uppercase', marginBottom: '2.5rem' },
  roles: { display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 260 },
  roleBtn: { padding: '15px 20px', borderRadius: 14, border: 'none', background: '#1a1a2e', boxShadow: '5px 5px 10px #0d0d1a, -5px -5px 10px #272742', color: '#888899', fontSize: 13, fontWeight: 500, letterSpacing: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, textTransform: 'uppercase', width: '100%' },
  roleIcon: { width: 36, height: 36, borderRadius: '50%', background: '#1a1a2e', boxShadow: 'inset 2px 2px 5px #0d0d1a, inset -2px -2px 5px #272742', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#C9A84C88', flexShrink: 0 },
  claveWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%', maxWidth: 260 },
  rolSel: { color: '#C9A84C', fontSize: 16, fontWeight: 500, letterSpacing: 3, textTransform: 'uppercase' },
  input: { width: '100%', padding: '14px 16px', borderRadius: 12, border: 'none', background: '#1a1a2e', boxShadow: 'inset 3px 3px 6px #0d0d1a, inset -3px -3px 6px #272742', color: '#C9A84C', fontSize: 15, outline: 'none', letterSpacing: 2 },
  error: { color: '#d85a30', fontSize: 13 },
  entrarBtn: { width: '100%', padding: 14, borderRadius: 12, border: 'none', background: '#1a1a2e', boxShadow: '4px 4px 8px #0d0d1a, -4px -4px 8px #272742', color: '#C9A84C', fontSize: 14, fontWeight: 500, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer' },
  volverBtn: { background: 'transparent', border: 'none', color: '#555577', cursor: 'pointer', fontSize: 13, letterSpacing: 1 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  headerTitle: { fontSize: 15, fontWeight: 500, color: '#C9A84C', letterSpacing: 2, textTransform: 'uppercase' },
  headerSub: { fontSize: 11, color: '#555577', letterSpacing: 1, marginTop: 2 },
  exitBtn: { width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#1a1a2e', boxShadow: '3px 3px 6px #0d0d1a, -3px -3px 6px #272742', color: '#555577', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  nav: { display: 'flex', gap: 10, marginBottom: '1.5rem', flexWrap: 'wrap' },
  navBtn: { padding: '10px 16px', borderRadius: 12, border: 'none', background: '#1a1a2e', boxShadow: '4px 4px 8px #0d0d1a, -4px -4px 8px #272742', color: '#555577', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 },
  navBtnActive: { boxShadow: 'inset 3px 3px 6px #0d0d1a, inset -3px -3px 6px #272742', color: '#C9A84C' },
  sectionLabel: { fontSize: 11, color: '#555577', letterSpacing: 2, textTransform: 'uppercase', marginBottom: '1rem' },
  mapaGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 },
  habCard: { borderRadius: 12, padding: '14px 8px', background: '#1a1a2e', boxShadow: '4px 4px 8px #0d0d1a, -4px -4px 8px #272742', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' },
  habCardActive: { boxShadow: 'inset 3px 3px 6px #0d0d1a, inset -3px -3px 6px #272742' },
  habNum: { fontSize: 18, fontWeight: 500, color: '#C9A84C' },
  habDot: { width: 8, height: 8, borderRadius: '50%' },
  habLabel: { fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
  legend: { display: 'flex', gap: 16, marginBottom: '1rem', flexWrap: 'wrap' },
  legendItem: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#555577' },
  legendDot: { width: 8, height: 8, borderRadius: '50%' },
  menuFlotante: { display: 'flex', flexDirection: 'column', gap: 4, width: '100%', marginTop: 4 },
  menuBtn: { border: 'none', borderRadius: 8, color: '#fff', padding: '5px 8px', fontSize: 10, cursor: 'pointer', letterSpacing: 1, textTransform: 'uppercase' },
  divider: { width: 40, height: 1, background: '#C9A84C22', margin: '1.5rem auto' },
  version: { fontSize: 11, color: '#333355', letterSpacing: 1 }
};

function MapaHabitaciones({ rol }) {
  const [habitaciones, setHabitaciones] = useState({});
  const [menuAbierto, setMenuAbierto] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'habitaciones'), (snap) => {
      const data = {};
      snap.forEach(d => { data[d.id] = d.data(); });
      setHabitaciones(data);
    });
    return unsub;
  }, []);

  const cambiarEstado = async (num, estado) => {
    await setDoc(doc(db, 'habitaciones', String(num)), { estado, actualizado: new Date().toISOString() });
    setMenuAbierto(null);
  };

  return (
    <div>
      <div style={nm.legend}>
        {Object.entries(ESTADOS).map(([key, val]) => (
          <div key={key} style={nm.legendItem}>
            <div style={{ ...nm.legendDot, background: val.color }}></div>
            {val.label}
          </div>
        ))}
      </div>
      <div style={nm.mapaGrid}>
        {HABITACIONES.map(num => {
          const estado = habitaciones[num]?.estado || 'libre';
          const info = ESTADOS[estado];
          const abierto = menuAbierto === num;
          return (
            <div key={num}
              style={{ ...nm.habCard, ...(abierto ? nm.habCardActive : {}) }}
              onClick={() => rol === 'monitor' && setMenuAbierto(abierto ? null : num)}>
              <div style={nm.habNum}>{num}</div>
              <div style={{ ...nm.habDot, background: info.color }}></div>
              <div style={{ ...nm.habLabel, color: info.color }}>{info.label}</div>
              {rol === 'monitor' && abierto && (
                <div style={nm.menuFlotante}>
                  {Object.entries(ESTADOS).map(([key, val]) => (
                    <button key={key}
                      onClick={e => { e.stopPropagation(); cambiarEstado(num, key); }}
                      style={{ ...nm.menuBtn, background: val.color }}>
                      {val.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NavBtn({ label, icon, activo, onClick }) {
  return (
    <button style={{ ...nm.navBtn, ...(activo ? nm.navBtnActive : {}) }} onClick={onClick}>
      <i className={`ti ti-${icon}`} aria-hidden="true"></i>
      {label}
    </button>
  );
}

function Login({ onLogin }) {
  const [rol, setRol] = useState(null);
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (clave === CLAVES[rol]) onLogin(rol);
    else setError('Clave incorrecta');
  };

  return (
    <div style={nm.loginWrap}>
      <div style={nm.logoRing}>
        <div style={nm.logoInner}>M</div>
      </div>
      <div style={nm.title}>Momentum</div>
      <div style={nm.sub}>Studio OS</div>
      {!rol ? (
        <div style={nm.roles}>
          {[['jefe', 'crown', 'Jefe'], ['monitor', 'device-desktop', 'Monitor'], ['modelo', 'star', 'Modelo']].map(([r, icon, label]) => (
            <button key={r} style={nm.roleBtn} onClick={() => setRol(r)}>
              <div style={nm.roleIcon}><i className={`ti ti-${icon}`} aria-hidden="true"></i></div>
              {label}
            </button>
          ))}
        </div>
      ) : (
        <div style={nm.claveWrap}>
          <div style={nm.rolSel}>{rol}</div>
          <input style={nm.input} type="password" placeholder="••••" value={clave}
            onChange={e => { setClave(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          {error && <div style={nm.error}>{error}</div>}
          <button style={nm.entrarBtn} onClick={handleLogin}>Entrar</button>
          <button style={nm.volverBtn} onClick={() => { setRol(null); setClave(''); setError(''); }}>Volver</button>
        </div>
      )}
      <div style={nm.divider}></div>
      <div style={nm.version}>v1.0 · 2025</div>
    </div>
  );
}

function AppJefe({ onLogout }) {
  const [vista, setVista] = useState('mapa');
  return (
    <div style={nm.wrap}>
      <div style={nm.header}>
        <div>
          <div style={nm.headerTitle}>Jefe</div>
          <div style={nm.headerSub}>Panel de control</div>
        </div>
        <button style={{...nm.exitBtn, width: 'auto', padding: '8px 16px', borderRadius: 12, gap: 8, display: 'flex', alignItems: 'center', fontSize: 12, letterSpacing: 1}} onClick={onLogout}>
          <i className="ti ti-logout" aria-hidden="true"></i> Salir
        </button>
      </div>
      <div style={nm.nav}>
        <NavBtn label="Mapa" icon="layout-grid" activo={vista === 'mapa'} onClick={() => setVista('mapa')} />
        <NavBtn label="Novedades" icon="alert-circle" activo={vista === 'novedades'} onClick={() => setVista('novedades')} />
        <NavBtn label="Cierres" icon="clipboard-check" activo={vista === 'cierre'} onClick={() => setVista('cierre')} />
        <NavBtn label="Metas" icon="target" activo={vista === 'metas'} onClick={() => setVista('metas')} />
      </div>
      <div style={nm.sectionLabel}>
        {vista === 'mapa' ? 'Mapa de habitaciones — en vivo' : 
         vista === 'novedades' ? 'Novedades del turno' : 
         vista === 'cierre' ? 'Cierres de turno' : 'Metas por modelo'}
      </div>
      {vista === 'mapa' && <MapaHabitaciones rol="jefe" />}
      {vista === 'novedades' && <Novedades rol="jefe" />}
      {vista === 'cierre' && <CierreTurno rol="jefe" />}
      {vista === 'metas' && <Metas rol="jefe" />}
    </div>
  );
}
function AppMonitor({ onLogout }) {
  const [vista, setVista] = useState('mapa');
  return (
    <div style={nm.wrap}>
      <div style={nm.header}>
        <div>
          <div style={nm.headerTitle}>Monitor</div>
          <div style={nm.headerSub}>Gestion del turno</div>
        </div>
        <button style={{...nm.exitBtn, width: 'auto', padding: '8px 16px', borderRadius: 12, gap: 8, display: 'flex', alignItems: 'center', fontSize: 12, letterSpacing: 1}} onClick={onLogout}>
  <i className="ti ti-logout" aria-hidden="true"></i> Salir
</button>
      </div>
      <div style={nm.nav}>
        <NavBtn label="Mapa" icon="layout-grid" activo={vista === 'mapa'} onClick={() => setVista('mapa')} />
        <NavBtn label="Asistencia" icon="users" activo={vista === 'asistencia'} onClick={() => setVista('asistencia')} />
        <NavBtn label="Novedades" icon="alert-circle" activo={vista === 'novedades'} onClick={() => setVista('novedades')} />
        <NavBtn label="Cierre" icon="clipboard-check" activo={vista === 'cierre'} onClick={() => setVista('cierre')} />
      </div>
      <div style={nm.sectionLabel}>{vista === 'mapa' ? 'Mapa de habitaciones' : vista === 'asistencia' ? 'Registro de asistencia' : vista === 'novedades' ? 'Novedades del turno' : 'Cierre de turno'}</div>
      {vista === 'mapa' && <MapaHabitaciones rol="monitor" />}
      {vista === 'asistencia' && <Asistencia rol="monitor" />}
      {vista === 'novedades' && <Novedades rol="monitor" />}
      {vista === 'cierre' && <CierreTurno rol="monitor" />}
    </div>
  );
}

function AppModelo({ onLogout }) {
  const [vista, setVista] = useState('mapa');
  const nombreModelo = 'Ashly Naibel Burgos Machado';

  return (
    <div style={nm.wrap}>
      <div style={nm.header}>
        <div>
          <div style={nm.headerTitle}>Mi panel</div>
          <div style={nm.headerSub}>Momentum Studio</div>
        </div>
        <button style={{...nm.exitBtn, width: 'auto', padding: '8px 16px', borderRadius: 12, gap: 8, display: 'flex', alignItems: 'center', fontSize: 12, letterSpacing: 1}} onClick={onLogout}>
          <i className="ti ti-logout" aria-hidden="true"></i> Salir
        </button>
      </div>
      <div style={nm.nav}>
        <NavBtn label="Habitaciones" icon="layout-grid" activo={vista === 'mapa'} onClick={() => setVista('mapa')} />
        <NavBtn label="Mi quincena" icon="coin" activo={vista === 'nomina'} onClick={() => setVista('nomina')} />
        <NavBtn label="Mi meta" icon="target" activo={vista === 'metas'} onClick={() => setVista('metas')} />
      </div>
      <div style={nm.sectionLabel}>
        {vista === 'mapa' ? 'Habitaciones disponibles' : 
         vista === 'nomina' ? 'Mi nomina en vivo' : 'Mi meta quincenal'}
      </div>
      {vista === 'mapa' && <MapaHabitaciones rol="modelo" />}
      {vista === 'nomina' && <Nomina nombreModelo={nombreModelo} />}
      {vista === 'metas' && <Metas rol="modelo" nombreModelo={nombreModelo} />}
    </div>
  );
}

export default function App() {
  const [usuario, setUsuario] = useState(null);
  if (!usuario) return <Login onLogin={setUsuario} />;
  if (usuario === 'jefe') return <AppJefe onLogout={() => setUsuario(null)} />;
  if (usuario === 'monitor') return <AppMonitor onLogout={() => setUsuario(null)} />;
  if (usuario === 'modelo') return <AppModelo onLogout={() => setUsuario(null)} />;
}
