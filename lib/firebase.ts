import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

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
export default app;
