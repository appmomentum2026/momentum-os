import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot } from 'firebase/firestore';

function getQuincena() {
  const hoy = new Date();
  const dia = hoy.getDate();
  const mes = hoy.getMonth();
  const anio = hoy.getFullYear();
  if (dia <= 15) {
    return { inicio: new Date(anio, mes, 1).toISOString().split('T')[0], fin: new Date(anio, mes, 15).toISOString().split('T')[0], dias: 15 };
  }
  const ultimoDia = new Date(anio, mes + 1, 0).getDate();
  return { inicio: new Date(anio, mes, 16).toISOString().split('T')[0], fin: new Date(anio, mes, ultimoDia).toISOString().split('T')[0], dias: ultimoDia - 15 };
}

function obtenerMetaUsd(metaDoc) {
  if (!metaDoc) return 0;
  if (metaDoc.usd !== undefined) return Number(metaDoc.usd) || 0;
  if (metaDoc.tokens !== undefined) return (Number(metaDoc.tokens) || 0) / 20;
  return 0;
}

function tokensEnRango(cierres, nombreModelo, inicio, fin) {
  let total = 0;
  cierres.forEach(cierre => {
    const fechaCierre = cierre.fecha?.split('T')[0] || '';
    if (fechaCierre < inicio || fechaCierre > fin) return;
    if (!cierre.modelos) return;
    const modelaData = cierre.modelos.find(m => m.nombre === nombreModelo);
    if (!modelaData) return;
    ['Stripchat', 'Camsoda', 'Chaturbate', 'Streamate'].forEach(p => {
      total += Number(modelaData[p + '_tokens'] || 0);
    });
  });
  return total;
}

function contarDomingos(inicioISO, finISO) {
  let count = 0;
  let d = new Date(inicioISO + 'T00:00:00');
  const fin = new Date(finISO + 'T00:00:00');
  while (d <= fin) {
    if (d.getDay() === 0) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

function contarDiasLibresAprobados(diasLibresList, nombreModelo, inicioISO, finISO) {
  let count = 0;
  diasLibresList.forEach(d => {
    if (d.tipo !== 'modelo' || d.modelo !== nombreModelo || d.estado !== 'aprobado') return;
    if (d.fecha1 && d.fecha1 >= inicioISO && d.fecha1 <= finISO) count++;
    if (d.fecha2 && d.fecha2 >= inicioISO && d.fecha2 <= finISO) count++;
  });
  return count;
}

function calcularDiasLaborales(quincena, diasLibresList, nombreModelo) {
  const domingos = contarDomingos(quincena.inicio, quincena.fin);
  const libres = contarDiasLibresAprobados(diasLibresList, nombreModelo, quincena.inicio, quincena.fin);
  return Math.max(0, quincena.dias - domingos - libres);
}

const s = {
  card: { marginBottom: 10 },
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
  avanceFila: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12 },
  avanceLabel: { color: 'var(--text-sub)' },
  avanceValor: { color: 'var(--text)', fontWeight: 600 },
  avanceBarraWrap: { background: 'var(--bg)', boxShadow: 'var(--shadow-in)', borderRadius: 20, height: 8, margin: '4px 0 14px', overflow: 'hidden' },
  avanceBarraFill: { height: '100%', borderRadius: 20, transition: 'width 0.4s' },
};

export default function ModelasMonitor({ monitorData }) {
  const [modelos, setModelos] = useState([]);
  const [cierres, setCierres] = useState([]);
  const [metas, setMetas] = useState({});
  const [diasLibres, setDiasLibres] = useState([]);
  const [asistencia, setAsistencia] = useState({});
  const [vistaGrid, setVistaGrid] = useState(true);
  const [expandidas, setExpandidas] = useState(new Set());
  const [tabCard, setTabCard] = useState({});
  const quincena = getQuincena();

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

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'cierres'), snap => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      setCierres(data);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'metas'), snap => {
      const data = {};
      snap.forEach(d => { data[d.id] = d.data(); });
      setMetas(data);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'diasLibres'), snap => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      setDiasLibres(data);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'asistencia'), snap => {
      const data = {};
      snap.forEach(d => { data[d.id] = d.data(); });
      setAsistencia(data);
    });
    return unsub;
  }, []);

  const misModelos = modelos
    .filter(m => m.activa !== false && m.monitor === monitorData?.nombre)
    .sort((a, b) => (parseInt(a.habitacion) || 99) - (parseInt(b.habitacion) || 99));

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
      {misModelos.map(m => {
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

        const totalTokens = tokensEnRango(cierres, m.nombreReal, quincena.inicio, quincena.fin);
        const metaUsd = obtenerMetaUsd(metas[m.nombreReal]);
        const metaTokens = metaUsd * 20;
        const pctMeta = metaTokens > 0 ? Math.min(100, Math.round((totalTokens / metaTokens) * 100)) : 0;
        const colorAvance = pctMeta >= 100 ? 'var(--green)' : 'var(--gold)';
        const diasLabQuincena = calcularDiasLaborales(quincena, diasLibres, m.nombreReal);
        const diasTrabajados = Object.values(asistencia).filter(a =>
          a.modelo === m.nombreReal && a.presente === true &&
          a.fecha >= quincena.inicio && a.fecha <= quincena.fin
        ).length;

        return (
          <div key={m.id} style={s.card} className="nm-card-elevated">
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
                  <button type="button" style={{ ...s.tabBtn, ...(tab === 'avance' ? s.tabBtnActivo : {}) }} onClick={() => setTabCard(prev => ({ ...prev, [m.id]: 'avance' }))}>Avance Quincenal</button>
                </div>

                {tab === 'avance' && (
                  <>
                    <div style={s.avanceFila}>
                      <span style={s.avanceLabel}>Tokens acumulados</span>
                      <span style={s.avanceValor}>{totalTokens.toLocaleString()}</span>
                    </div>
                    <div style={s.avanceFila}>
                      <span style={s.avanceLabel}>Meta</span>
                      <span style={s.avanceValor}>{metaUsd > 0 ? `$${metaUsd.toLocaleString()} USD (${metaTokens.toLocaleString()} tokens)` : 'Sin asignar'}</span>
                    </div>
                    {metaTokens > 0 && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-sub)' }}>
                          <span>{totalTokens.toLocaleString()} / {metaTokens.toLocaleString()} tokens</span>
                          <span style={{ color: colorAvance, fontWeight: 700 }}>{pctMeta}%</span>
                        </div>
                        <div style={s.avanceBarraWrap}>
                          <div style={{ ...s.avanceBarraFill, width: `${pctMeta}%`, background: colorAvance }} />
                        </div>
                      </>
                    )}
                    <div style={{ ...s.avanceFila, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                      <span style={s.avanceLabel}>Días trabajados</span>
                      <span style={s.avanceValor}>{diasTrabajados} / {diasLabQuincena} días laborales</span>
                    </div>
                  </>
                )}

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
              </div>
            </div>
          </div>
        );
      })}
      </div>
      </>}
    </div>
  );
}
