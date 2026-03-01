importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyA-xldRxhFqOsxv3xnjWsaOmcFG-nqG1n4",
  authDomain: "jamb-cbt-8fa5d.firebaseapp.com",
  projectId: "jamb-cbt-8fa5d",
  storageBucket: "jamb-cbt-8fa5d.firebasestorage.app",
  messagingSenderId: "136310165119",
  appId: "1:136310165119:web:9549495df4da9ceda5b94a",
  databaseURL: "https://jamb-cbt-8fa5d-default-rtdb.firebaseio.com",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "JAMB CBT Update!";
  const body = payload.notification?.body || "New features available!";
  
  // Set badge on app icon
  if (navigator.setAppBadge) {
    navigator.setAppBadge(1);
  }

  self.registration.showNotification(title, {
    body,
    icon: '/logo.png',
    badge: '/logo.png',
    vibrate: [200, 100, 200],
    data: payload.data,
    actions: [
      { action: 'update', title: '🔄 Update Now' },
      { action: 'dismiss', title: 'Later' }
    ]
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'update') {
    clients.openWindow('/');
  }
});
