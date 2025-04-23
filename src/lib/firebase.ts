
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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

// Firestore Rules for reference (add these in Firebase Console)
/*
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Allow all authenticated requests to access the database
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // More specific rules can be added later
    
    // User document rules
    match /users/{userId} {
      // Anyone can read and write user documents if they're authenticated
      allow read, write: if request.auth != null;
    }
    
    // Expense document rules
    match /expenses/{expenseId} {
      // Anyone can read and write expense documents if they're authenticated
      allow read, write: if request.auth != null;
    }
    
    // Budget document rules
    match /budgets/{budgetId} {
      // Anyone can read and write budget documents if they're authenticated
      allow read, write: if request.auth != null;
    }
  }
}
*/

export default app;
