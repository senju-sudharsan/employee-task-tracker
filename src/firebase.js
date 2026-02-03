import { initializeApp } from "firebase/app";
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

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

export const auth = getAuth(app);
