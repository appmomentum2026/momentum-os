import { db } from './firebase';
import { collection, getDocs, doc, addDoc } from 'firebase/firestore';

async function obtenerTokens(rol) {
  const snap = await getDocs(collection(db, 'tokens_notificacion'));
  const tokens = [];
  snap.forEach(d => {
    if (d.data().usuario === rol) tokens.push(d.data().token);
  });
  return tokens;
}

export async function notificarJefe(titulo, cuerpo) {
  const tokens = await obtenerTokens('jefe');
  await addDoc(collection(db, 'notificaciones_pendientes'), {
    tokens,
    titulo,
    cuerpo,
    fecha: new Date().toISOString()
  });
}

export async function notificarMonitor(monitorNombre, titulo, cuerpo) {
  const snap = await getDocs(collection(db, 'tokens_notificacion'));
  const tokens = [];
  snap.forEach(d => {
    if (d.data().usuario === 'monitor' && d.data().id === monitorNombre) {
      tokens.push(d.data().token);
    }
  });
  await addDoc(collection(db, 'notificaciones_pendientes'), {
    tokens,
    titulo,
    cuerpo,
    fecha: new Date().toISOString()
  });
}

export async function notificarModelo(nombreModelo, titulo, cuerpo) {
  const snap = await getDocs(collection(db, 'tokens_notificacion'));
  const tokens = [];
  snap.forEach(d => {
    if (d.data().usuario === 'modelo' && d.data().id === nombreModelo) {
      tokens.push(d.data().token);
    }
  });
  await addDoc(collection(db, 'notificaciones_pendientes'), {
    tokens,
    titulo,
    cuerpo,
    fecha: new Date().toISOString()
  });
}