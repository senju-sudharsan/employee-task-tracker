import { initializeApp, getApps } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDBodax2CnB8MS8m_gyFFIPyVJwzfkvkb0",
  authDomain: "workflow-hub-5ac3f.firebaseapp.com",
  projectId: "workflow-hub-5ac3f",
  storageBucket: "workflow-hub-5ac3f.firebasestorage.app",
  messagingSenderId: "713226827208",
  appId: "1:713226827208:web:2eebc29de6353991a6fcfd"
};

/* ===========================
   PRIMARY APP (Main session)
=========================== */
const app = initializeApp(firebaseConfig);

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

export const auth = getAuth(app);

/* ===========================
   SECONDARY APP (User creation only)
=========================== */
let secondaryApp;

if (!getApps().some(a => a.name === "secondary")) {
  secondaryApp = initializeApp(firebaseConfig, "secondary");
} else {
  secondaryApp = getApps().find(a => a.name === "secondary");
}

export const secondaryAuth = getAuth(secondaryApp);