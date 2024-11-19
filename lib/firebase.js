
// lib/firebase.js

import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  "apiKey": "AIzaSyA53RVXxX27kWCRjlCjO6DV8fMbhPGInFw",
  "authDomain": "aibuster.firebaseapp.com",
  "projectId": "aibuster",
  "storageBucket": "aibuster.firebasestorage.app",
  "messagingSenderId": "898764578898",
  "appId": "1:898764578898:web:f43d63e0b02e2c075d3f8b",
  "measurementId": "G-NWNX4G63MW"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const firestore = getFirestore(app);
const auth = getAuth(app);

export { app, firestore, auth };
          