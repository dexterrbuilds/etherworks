import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAiukoATGPdhkllu-D8qQmrgG8UGQDa5ng",
  authDomain: "seiearn.firebaseapp.com",
  projectId: "seiearn",
  storageBucket: "seiearn.firebasestorage.app",
  messagingSenderId: "843528688218",
  appId: "1:843528688218:web:5ca3cc4427961f00dabe63",
  measurementId: "G-13P9JRKWSH"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

