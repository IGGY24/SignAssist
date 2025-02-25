import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
//import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyD1xThQ6sPRlRU7ncBjb1Ct10cGJQjB_bE",
  authDomain: "signassist1.firebaseapp.com",
  projectId: "signassist1",
  storageBucket: "signassist1.firebasestorage.app",
  messagingSenderId: "415528392922",
  appId: "1:415528392922:web:9851c9f71367b2e2982de3"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth()
export const db = getFirestore()
//export const storage = getStorage()