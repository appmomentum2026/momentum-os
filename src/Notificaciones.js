import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';

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
  try {
    const permiso = await Notification.requestPermission();
    if (permiso !== 'granted') return;
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (token) {
      await setDoc(doc(db, 'tokens_notificacion', id), {
        token,
        usuario,
        id,
        actualizado: new Date().toISOString()
      });
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