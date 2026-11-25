import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDojmRppc9ZnKexNIN4Zj_Psqaud2ww0CU",
  authDomain: "kapitrans-18951.firebaseapp.com",
  projectId: "kapitrans-18951",
  storageBucket: "kapitrans-18951.firebasestorage.app",
  messagingSenderId: "286370539477",
  appId: "1:286370539477:web:665927d55f8ce5aa0dff5c",
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(
  (value) => value && !value.startsWith("VOTRE_"),
);

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
