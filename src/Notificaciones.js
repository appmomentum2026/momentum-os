import React, { useState, useEffect, useRef } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { db } from './firebase';
import { doc, setDoc, collection, addDoc, updateDoc, writeBatch, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { playNotifSound } from './notifSound';

const firebaseConfig = {
  apiKey: "AIzaSyB_dhmq881XJJ6TI-i1-_zM2wh4-EUcOd4",
  authDomain: "studiosos.firebaseapp.com",
  projectId: "studiosos",
  storageBucket: "studiosos.firebasestorage.app",
  messagingSenderId: "1084355546469",
  appId: "1:1084355546469:web:da20010a9a645ff09b258c"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const messaging = getMessaging(app);

const VAPID_KEY = 'BEdcEdu2jzaH186-jxZ_Ta8vpCkAKjL0E5Mmesw9x1RXIlTafURivmw0xSxN6W762pQdTEJFRMiH34ag8pws8z4';

export async function solicitarPermiso(usuario, id) {
  if (!('Notification' in window)) {
    console.warn('Este navegador no soporta la API de Notification; no se puede pedir permiso.');
    return;
  }

  // Si el permiso ya fue decidido antes (granted o denied), el navegador NO vuelve a mostrar
  // el popup — Notification.requestPermission() se resuelve al toque sin preguntar nada.
  // Esto es la causa más común de "el popup no aparece": hay que resetear el permiso del sitio
  // desde la configuración del navegador (candado en la barra de direcciones) para volver a verlo.
  console.log('Permiso de notificación actual antes de pedir:', Notification.permission);

  try {
    const permiso = await Notification.requestPermission();
    console.log('Resultado de Notification.requestPermission():', permiso);
    if (permiso !== 'granted') return;
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (token) {
      await setDoc(doc(db, 'tokens_notificacion', id), {
        token,
        usuario,
        id,
        actualizado: new Date().toISOString()
      });
      console.log('Token FCM guardado para', usuario, id);
    }
  } catch (error) {
    console.error('Error solicitando permiso:', error);
  }
}

export function escucharNotificaciones(callback) {
  return onMessage(messaging, (payload) => {
    callback(payload);
  });
}

// ────────────────────────────────────────────────────────────────────────
// Panel de notificaciones dentro de la app (campanita + dropdown), separado
// del push de FCM de arriba: estas se guardan y se leen de la colección
// Firestore "notificaciones" en tiempo real.
// ────────────────────────────────────────────────────────────────────────

const ICONOS_TIPO = { pedido: 'shopping-bag', novedad: 'alert-circle' };

function tiempoRelativo(fecha) {
  const ms = fecha?.toMillis ? fecha.toMillis() : (fecha ? new Date(fecha).getTime() : Date.now());
  const diffSeg = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (diffSeg < 60) return 'hace un momento';
  const diffMin = Math.round(diffSeg / 60);
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `hace ${diffHr} h`;
  const diffDias = Math.round(diffHr / 24);
  return `hace ${diffDias} d`;
}

// Crea una notificación por cada destinatario (destinatarios repetidos/vacíos se ignoran)
export async function crearNotificacion({ tipo, mensaje, destinatarios, extra = {} }) {
  const unicos = [...new Set((destinatarios || []).filter(Boolean))];
  await Promise.all(unicos.map(destinatario => addDoc(collection(db, 'notificaciones'), {
    tipo, mensaje, destinatario, leida: false, fecha: serverTimestamp(), ...extra
  })));
}

// Escucha en tiempo real las notificaciones de un destinatario. Se llama una sola vez
// (desde NavLayout) para que el sonido/toast de "notificación nueva" no se dispare por
// duplicado aunque la campanita se muestre tanto en el sidebar de escritorio como en la
// barra móvil.
export function useNotificaciones(destinatario, onNuevaNotificacion) {
  const [notificaciones, setNotificaciones] = useState([]);
  const primeraCargaRef = useRef(true);
  const vistosRef = useRef(new Set());

  useEffect(() => {
    primeraCargaRef.current = true;
    vistosRef.current = new Set();
    if (!destinatario) { setNotificaciones([]); return; }

    const unsub = onSnapshot(collection(db, 'notificaciones'), snap => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      const mias = data.filter(n => n.destinatario === destinatario);
      mias.sort((a, b) => {
        const ta = a.fecha?.toMillis ? a.fecha.toMillis() : 0;
        const tb = b.fecha?.toMillis ? b.fecha.toMillis() : 0;
        return tb - ta;
      });

      if (!primeraCargaRef.current) {
        mias.forEach(n => {
          if (!n.leida && !vistosRef.current.has(n.id)) {
            playNotifSound();
            if (onNuevaNotificacion) onNuevaNotificacion(n);
          }
        });
      }
      mias.forEach(n => vistosRef.current.add(n.id));
      primeraCargaRef.current = false;
      setNotificaciones(mias);
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destinatario]);

  const noLeidas = notificaciones.filter(n => !n.leida).length;

  const marcarLeida = async (id) => {
    await updateDoc(doc(db, 'notificaciones', id), { leida: true });
  };

  const marcarTodasLeidas = async () => {
    const pendientes = notificaciones.filter(n => !n.leida);
    if (pendientes.length === 0) return;
    const batch = writeBatch(db);
    pendientes.forEach(n => batch.update(doc(db, 'notificaciones', n.id), { leida: true }));
    await batch.commit();
  };

  return { notificaciones, noLeidas, marcarLeida, marcarTodasLeidas };
}

const s = {
  btnBell: { position: 'relative', background: 'var(--bg)', border: 'none', borderRadius: 10, boxShadow: 'var(--shadow-out)', color: 'var(--text-sub)', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, cursor: 'pointer', flexShrink: 0 },
  badge: { position: 'absolute', top: -4, right: -4, background: '#d85a30', color: '#fff', fontSize: 10, fontWeight: 700, minWidth: 16, height: 16, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', border: '2px solid var(--bg2)', lineHeight: 1 },
  // Estructura base del panel (posición se decide aparte según variant, ver panelPos*)
  panelBase: { display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', zIndex: 1000 },
  // Desktop (sidebar): la campana vive en un sidebar angosto (210px) pegado al borde
  // izquierdo — anclar el panel con "right: 0" lo hace crecer hacia la izquierda y se
  // sale de la pantalla. Se ancla con "left: 0" para que crezca hacia el contenido.
  panelPosSidebar: { position: 'absolute', top: 'calc(100% + 8px)', left: 0, width: 340, maxWidth: 'calc(100vw - 32px)', maxHeight: 400 },
  // Mobile (bottombar): fijo y centrado en el viewport, no depende de dónde caiga el botón
  panelPosBottombar: { position: 'fixed', top: 76, left: '50%', transform: 'translateX(-50%)', width: 'calc(100vw - 32px)', maxWidth: 420, maxHeight: '70vh' },
  panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 },
  panelTitulo: { color: 'var(--text)', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' },
  btnMarcarTodas: { background: 'transparent', border: 'none', color: 'var(--gold)', fontSize: 11, cursor: 'pointer', padding: 0, whiteSpace: 'nowrap' },
  panelBody: { overflowY: 'auto', flex: 1 },
  vacio: { color: 'var(--text-dim)', textAlign: 'center', padding: 30, fontSize: 12 },
  item: { display: 'flex', gap: 10, padding: '14px', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' },
  itemIcono: { width: 32, height: 32, borderRadius: 16, background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', fontSize: 14, flexShrink: 0 },
  itemMensaje: { color: 'var(--text)', fontSize: 12, lineHeight: 1.4, whiteSpace: 'normal', overflowWrap: 'break-word', wordBreak: 'break-word' },
  itemTiempo: { color: 'var(--text-dim)', fontSize: 10, marginTop: 4 },
  btnLeida: { background: 'transparent', border: 'none', color: 'var(--text-sub)', fontSize: 11, cursor: 'pointer', padding: 0, marginTop: 6, textDecoration: 'underline' },
};

export default function Notificaciones({ notifState, variant = 'sidebar' }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);
  const { notificaciones, noLeidas, marcarLeida, marcarTodasLeidas } = notifState || { notificaciones: [], noLeidas: 0, marcarLeida: () => {}, marcarTodasLeidas: () => {} };

  useEffect(() => {
    if (!abierto) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setAbierto(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [abierto]);

  if (!notifState) return null;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {variant === 'bottombar' ? (
        <button type="button" className={`nm-bottom-btn${abierto ? ' activo' : ''}`} onClick={() => setAbierto(v => !v)} style={{ position: 'relative' }}>
          <i className="ti ti-bell" aria-hidden="true"></i>
          <span>Avisos</span>
          {noLeidas > 0 && <span style={s.badge}>{noLeidas > 9 ? '9+' : noLeidas}</span>}
        </button>
      ) : (
        <button type="button" style={s.btnBell} onClick={() => setAbierto(v => !v)} aria-label="Notificaciones">
          <i className="ti ti-bell" aria-hidden="true"></i>
          {noLeidas > 0 && <span style={s.badge}>{noLeidas > 9 ? '9+' : noLeidas}</span>}
        </button>
      )}

      {abierto && (
        <div
          className="nm-card-elevated"
          style={{ ...s.panelBase, ...(variant === 'bottombar' ? s.panelPosBottombar : s.panelPosSidebar) }}
        >
          <div style={s.panelHeader}>
            <span style={s.panelTitulo}>Notificaciones</span>
            {noLeidas > 0 && <button type="button" style={s.btnMarcarTodas} onClick={marcarTodasLeidas}>Marcar todas como leídas</button>}
          </div>
          <div style={s.panelBody}>
            {notificaciones.length === 0 ? (
              <div style={s.vacio}>No tienes notificaciones</div>
            ) : (
              notificaciones.map(n => (
                <div key={n.id} style={{ ...s.item, opacity: n.leida ? 0.55 : 1 }}>
                  <div style={s.itemIcono}><i className={`ti ti-${ICONOS_TIPO[n.tipo] || 'bell'}`} aria-hidden="true"></i></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={s.itemMensaje}>{n.mensaje}</div>
                    <div style={s.itemTiempo}>{tiempoRelativo(n.fecha)}</div>
                    {!n.leida && <button type="button" style={s.btnLeida} onClick={() => marcarLeida(n.id)}>Marcar como leída</button>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}