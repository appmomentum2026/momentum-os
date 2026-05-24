import React, { useState, useEffect } from 'react';
import './App.css';
import { db } from './firebase';
import { collection, doc, setDoc, onSnapshot, getDocs } from 'firebase/firestore';
import Asistencia from './Asistencia';
import Novedades from './Novedades';
import CierreTurno from './CierreTurno';
import Nomina from './Nomina';
import Metas from './Metas';
import ResumenJefe from './ResumenJefe';
import GestionModelos from './GestionModelos';
import ImportarModelos from './ImportarModelos';
import Inventario2 from './Inventario2';
import Pedidos from './Pedidos';

const CLAVES = { jefe: '1234', monitor: '5678', operativo: 'oper1234', administrativo: 'admin1234' };
const HABITACIONES = Array.from({ length: 16 }, (_, i) => i + 1);
const ESTADOS = {
  libre: { color: '#1d9e75', label: 'Libre' },
  ocupada: { color: '#d85a30', label: 'Ocupada' },
  fuera: { color: '#444466', label: 'Fuera de servicio' }
};

function MapaHabitaciones({ rol }) {
  const [habitaciones, setHabitaciones] = useState({});
  const [menuAbierto, setMenuAbierto] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'habitaciones'), snap => {
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
      <div className="nm-leyenda">
        {Object.entries(ESTADOS).map(([key, val]) => (
          <div key={key} className="nm-leyenda-item">
            <div className="nm-leyenda-dot" style={{ background: val.color }}></div>
            {val.label}
          </div>
        ))}
      </div>
      <div className="nm-hab-grid">
        {HABITACIONES.map(num => {
          const estado = habitaciones[num]?.estado || 'libre';
          const info = ESTADOS[estado];
          const abierto = menuAbierto === num;
          return (
            <div key={num} className={`nm-hab${abierto ? ' abierto' : ''}`}
              onClick={() => rol === 'monitor' && setMenuAbierto(abierto ? null : num)}>
              <div className="nm-hab-num">{num}</div>
              <div className="nm-hab-dot" style={{ background: info.color }}></div>
              <div className="nm-hab-label" style={{ color: info.color }}>{info.label}</div>
              {rol === 'monitor' && abierto && (
                <div className="nm-menu-flotante">
                  {Object.entries(ESTADOS).map(([key, val]) => (
                    <button key={key}
                      onClick={e => { e.stopPropagation(); cambiarEstado(num, key); }}
                      className="nm-menu-btn" style={{ background: val.color }}>
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
    <button className={`nm-nav-btn${activo ? ' activo' : ''}`} onClick={onClick}>
      <i className={`ti ti-${icon}`} aria-hidden="true"></i>
      {label}
    </button>
  );
}

function Login({ onLogin, temaOscuro, toggleTema }) {
  const [rol, setRol] = useState(null);
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [mostrarJefes, setMostrarJefes] = useState(false);

  const handleLogin = async () => {
    if (rol === 'modelo') {
      const snap = await getDocs(collection(db, 'modelos'));
      let encontrada = null;
      snap.forEach(d => {
        if (d.data().clave === clave) encontrada = { id: d.id, ...d.data() };
      });
      if (encontrada) onLogin('modelo', encontrada);
      else setError('Clave incorrecta');
    } else if (CLAVES[rol] && clave === CLAVES[rol]) {
      onLogin(rol);
    } else {
      setError('Clave incorrecta');
    }
  };

  return (
    <div className="nm-login-wrap">
      <div className="nm-logo-ring">
        <div className="nm-logo-inner">M</div>
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
          <button className="nm-tema-btn" onClick={toggleTema}>
            {temaOscuro ? '☀️ Modo claro' : '🌙 Modo oscuro'}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%', maxWidth: 260 }}>
          <div style={{ color: 'var(--gold)', fontSize: 16, fontWeight: 500, letterSpacing: 3, textTransform: 'uppercase' }}>{rol}</div>
          <input className="nm-input" type="password" placeholder="••••" value={clave}
            onChange={e => { setClave(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          {error && <div style={{ color: '#d85a30', fontSize: 13 }}>{error}</div>}
          <button className="nm-btn-entrar" onClick={handleLogin}>Entrar</button>
          <button className="nm-btn-volver" onClick={() => { setRol(null); setClave(''); setError(''); }}>Volver</button>
        </div>
      )}
      <div className="nm-divider"></div>
      <div className="nm-version">v1.0 · 2025</div>
    </div>
  );
}

function AppJefe({ onLogout, temaOscuro, toggleTema }) {
  const [vista, setVista] = useState('mapa');
  return (
    <div className="nm-wrap">
      <div className="nm-header">
        <div>
          <div className="nm-header-title">Jefe</div>
          <div className="nm-header-sub">Panel de control</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="nm-tema-btn" onClick={toggleTema}>{temaOscuro ? '☀️' : '🌙'}</button>
          <button className="nm-exit-btn" onClick={onLogout}>
            <i className="ti ti-logout" aria-hidden="true"></i> Salir
          </button>
        </div>
      </div>
      <div className="nm-nav">
        <NavBtn label="Mapa" icon="layout-grid" activo={vista === 'mapa'} onClick={() => setVista('mapa')} />
        <NavBtn label="Novedades" icon="alert-circle" activo={vista === 'novedades'} onClick={() => setVista('novedades')} />
        <NavBtn label="Cierres" icon="clipboard-check" activo={vista === 'cierre'} onClick={() => setVista('cierre')} />
        <NavBtn label="Metas" icon="target" activo={vista === 'metas'} onClick={() => setVista('metas')} />
        <NavBtn label="Nomina" icon="report-money" activo={vista === 'resumen'} onClick={() => setVista('resumen')} />
          <NavBtn label="Modelos" icon="user-plus" activo={vista === 'modelos'} onClick={() => setVista('modelos')} />
            <NavBtn label="Inventario" icon="package" activo={vista === 'inventario'} onClick={() => setVista('inventario')} />
              <NavBtn label="Pedidos" icon="shopping-bag" activo={vista === 'pedidos'} onClick={() => setVista('pedidos')} />
      </div>
      <div className="nm-section-label">
        {vista === 'mapa' ? 'Mapa de habitaciones — en vivo' :
         vista === 'novedades' ? 'Novedades del turno' :
         vista === 'cierre' ? 'Cierres de turno' :
         vista === 'metas' ? 'Metas por modelo' : vista === 'resumen' ? 'Resumen quincenal' : vista === 'modelos' ? 'Gestion de modelos' : 'Inventario'}
      </div>
      {vista === 'mapa' && <MapaHabitaciones rol="jefe" />}
      {vista === 'novedades' && <Novedades rol="jefe" />}
      {vista === 'cierre' && <CierreTurno rol="jefe" />}
      {vista === 'metas' && <Metas rol="jefe" />}
      {vista === 'resumen' && <ResumenJefe />}
      {vista === 'modelos' && <GestionModelos />}
{vista === 'modelos' && <ImportarModelos />}
{vista === 'inventario' && <Inventario2 rol="jefe" />}
{vista === 'pedidos' && <Pedidos rol="jefe" />}
    </div>
  );
}

function AppMonitor({ onLogout, temaOscuro, toggleTema }) {
  const [vista, setVista] = useState('mapa');
  return (
    <div className="nm-wrap">
      <div className="nm-header">
        <div>
          <div className="nm-header-title">Monitor</div>
          <div className="nm-header-sub">Gestion del turno</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="nm-tema-btn" onClick={toggleTema}>{temaOscuro ? '☀️' : '🌙'}</button>
          <button className="nm-exit-btn" onClick={onLogout}>
            <i className="ti ti-logout" aria-hidden="true"></i> Salir
          </button>
        </div>
      </div>
      <div className="nm-nav">
        <NavBtn label="Mapa" icon="layout-grid" activo={vista === 'mapa'} onClick={() => setVista('mapa')} />
        <NavBtn label="Asistencia" icon="users" activo={vista === 'asistencia'} onClick={() => setVista('asistencia')} />
        <NavBtn label="Novedades" icon="alert-circle" activo={vista === 'novedades'} onClick={() => setVista('novedades')} />
        <NavBtn label="Cierre" icon="clipboard-check" activo={vista === 'cierre'} onClick={() => setVista('cierre')} />
          <NavBtn label="Pedidos" icon="shopping-bag" activo={vista === 'pedidos'} onClick={() => setVista('pedidos')} />
      </div>
      <div className="nm-section-label">
        {vista === 'mapa' ? 'Mapa de habitaciones' :
         vista === 'asistencia' ? 'Registro de asistencia' :
         vista === 'novedades' ? 'Novedades del turno' : 'Cierre de turno'}
      </div>
      {vista === 'mapa' && <MapaHabitaciones rol="monitor" />}
      {vista === 'asistencia' && <Asistencia rol="monitor" />}
      {vista === 'novedades' && <Novedades rol="monitor" />}
      {vista === 'cierre' && <CierreTurno rol="monitor" />}
      {vista === 'pedidos' && <Pedidos rol="monitor" />}
    </div>
  );
}

function AppModelo({ onLogout, temaOscuro, toggleTema, modelaData }) {
  const [vista, setVista] = useState('mapa');
  const nombreModelo = modelaData?.nombreReal || '';
  return (
    <div className="nm-wrap">
      <div className="nm-header">
        <div>
          <div className="nm-header-title">Mi panel</div>
          <div className="nm-header-sub">{modelaData?.nombreReal || 'Momentum Studio'}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="nm-tema-btn" onClick={toggleTema}>{temaOscuro ? '☀️' : '🌙'}</button>
          <button className="nm-exit-btn" onClick={onLogout}>
            <i className="ti ti-logout" aria-hidden="true"></i> Salir
          </button>
        </div>
      </div>
      <div className="nm-nav">
        <NavBtn label="Habitaciones" icon="layout-grid" activo={vista === 'mapa'} onClick={() => setVista('mapa')} />
        <NavBtn label="Mi quincena" icon="coin" activo={vista === 'nomina'} onClick={() => setVista('nomina')} />
        <NavBtn label="Mi meta" icon="target" activo={vista === 'metas'} onClick={() => setVista('metas')} />
          <NavBtn label="Tienda" icon="shopping-cart" activo={vista === 'tienda'} onClick={() => setVista('tienda')} />
      </div>
      <div className="nm-section-label">
        {vista === 'mapa' ? 'Habitaciones disponibles' :
         vista === 'nomina' ? 'Mi nomina en vivo' : 'Mi meta quincenal'}
      </div>
      {vista === 'mapa' && <MapaHabitaciones rol="modelo" />}
      {vista === 'nomina' && <Nomina nombreModelo={nombreModelo} />}
      {vista === 'metas' && <Metas rol="modelo" nombreModelo={nombreModelo} />}
      {vista === 'tienda' && <Inventario2 rol="tienda" nombreModelo={nombreModelo} />}
    </div>
  );
}

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [modelaData, setModelaData] = useState(null);
  const [temaOscuro, setTemaOscuro] = useState(true);

  useEffect(() => {
    document.body.className = temaOscuro ? 'oscuro' : 'claro';
  }, [temaOscuro]);

  useEffect(() => {
    document.body.className = 'oscuro';
  }, []);

  const toggleTema = () => setTemaOscuro(prev => !prev);

  if (!usuario) return <Login onLogin={(rol, data) => { setUsuario(rol); if (data) setModelaData(data); }} temaOscuro={temaOscuro} toggleTema={toggleTema} />;
  if (usuario === 'jefe') return <AppJefe onLogout={() => setUsuario(null)} temaOscuro={temaOscuro} toggleTema={toggleTema} />;
  if (usuario === 'operativo') return <AppJefe onLogout={() => setUsuario(null)} temaOscuro={temaOscuro} toggleTema={toggleTema} soloLectura={true} />;
  if (usuario === 'administrativo') return <AppJefe onLogout={() => setUsuario(null)} temaOscuro={temaOscuro} toggleTema={toggleTema} soloAdmin={true} />;
  if (usuario === 'monitor') return <AppMonitor onLogout={() => setUsuario(null)} temaOscuro={temaOscuro} toggleTema={toggleTema} />;
  if (usuario === 'modelo') return <AppModelo onLogout={() => setUsuario(null)} temaOscuro={temaOscuro} toggleTema={toggleTema} modelaData={modelaData} />;
}
  