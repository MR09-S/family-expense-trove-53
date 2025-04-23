
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB8zxXGK3BiH4jHswT5yOYU01pzK7n840U",
  authDomain: "famxp-9f59a.firebaseapp.com",
  projectId: "famxp-9f59a",
  storageBucket: "famxp-9f59a.firebasestorage.app",
  messagingSenderId: "65159984804",
  appId: "1:65159984804:web:8780c106c88f169916d831"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
