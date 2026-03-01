import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyA-xldRxhFqOsxv3xnjWsaOmcFG-nqG1n4",
  authDomain: "jamb-cbt-8fa5d.firebaseapp.com",
  projectId: "jamb-cbt-8fa5d",
  storageBucket: "jamb-cbt-8fa5d.firebasestorage.app",
  messagingSenderId: "136310165119",
  appId: "1:136310165119:web:9549495df4da9ceda5b94a",
  databaseURL: "https://jamb-cbt-8fa5d-default-rtdb.firebaseio.com",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getDatabase(app);

export const requestNotificationPermission = async () => {
  try {
    const supported = await isSupported();
    if (!supported) {
      alert("FCM not supported");
      return null;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    // Register FCM service worker manually
    const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    await navigator.serviceWorker.ready;

    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: "BLJQV-vgQ0waa_opMBNycIxeUEL2sTI-gim7Ip7rqQ7q_-Q00yIUoN9wA4hPDVgjdwz4Y5wSYHKxIl8g-Pxnw0E",
      serviceWorkerRegistration: swReg,
    });
    return token;
  } catch (err: any) {
    alert("FCM Error: " + err.message);
    return null;
  }
};

export const onForegroundMessage = async (callback: (payload: any) => void) => {
  const supported = await isSupported();
  if (!supported) return;
  const messaging = getMessaging(app);
  onMessage(messaging, (payload) => {
    // Set red badge on app icon
    if ('setAppBadge' in navigator) {
    (navigator as any).setAppBadge(1);
  }
    callback(payload);
  });
};

export const clearAppBadge = () => {
  if ('clearAppBadge' in navigator) {
    (navigator as any).clearAppBadge();
  }
};

export default app;
