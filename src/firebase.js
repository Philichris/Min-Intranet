import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD5Qhk8dntj3Y1msNMskwW3mtnVVSNQzgY",
  authDomain: "min-mareille---intranet.firebaseapp.com",
  projectId: "min-mareille---intranet",
  storageBucket: "min-mareille---intranet.firebasestorage.app",
  messagingSenderId: "935994535951",
  appId: "1:935994535951:web:117ddfea03510555ab337a",
  measurementId: "G-S1XXTT3WGR"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
