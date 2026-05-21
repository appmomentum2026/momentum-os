import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB_dhmq881XJJ6TI-i1-_zM2wh4-EUcOd4",
  authDomain: "studiosos.firebaseapp.com",
  projectId: "studiosos",
  storageBucket: "studiosos.firebasestorage.app",
  messagingSenderId: "1084355546469",
  appId: "1:1084355546469:web:da20010a9a645ff09b258c"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);