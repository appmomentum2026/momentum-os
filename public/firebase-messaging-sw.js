importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyB_dhmq881XJJ6TI-i1-_zM2wh4-EUcOd4",
  authDomain: "studiosos.firebaseapp.com",
  projectId: "studiosos",
  storageBucket: "studiosos.firebasestorage.app",
  messagingSenderId: "1084355546469",
  appId: "1:1084355546469:web:da20010a9a645ff09b258c"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  const { title, body } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: '/momentum_logo.png'
  });
});