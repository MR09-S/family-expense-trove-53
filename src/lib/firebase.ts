
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB8zxXGK3BiH4jHswT5yOYU01pzK7n840U",
  authDomain: "famxp-9f59a.firebaseapp.com",
  projectId: "famxp-9f59a",
  storageBucket: "famxp-9f59a.appspot.com",
  messagingSenderId: "65159984804",
  appId: "1:65159984804:web:8780c106c88f169916d831"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable offline persistence (helps with intermittent connection issues)
try {
  enableIndexedDbPersistence(db).catch((err) => {
    console.error("Firebase offline persistence error:", err);
  });
} catch (error) {
  console.error("Error enabling offline persistence:", error);
}

// Firestore Rules for reference (add these in Firebase Console)
/*
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Always allow read operations when authenticated
    match /{document=**} {
      allow read: if request.auth != null;
    }
    
    // User document rules
    match /users/{userId} {
      // Users can read/write only their own documents
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Expense document rules
    match /expenses/{expenseId} {
      // Users can read/write their own expenses
      allow read, write: if request.auth != null && 
                         (resource == null || resource.data.userId == request.auth.uid);
    }
    
    // Budget document rules
    match /budgets/{budgetId} {
      // Users can read/write their own budgets
      allow read, write: if request.auth != null && 
                         (resource == null || resource.data.userId == request.auth.uid);
    }
  }
}
*/

// Note for the missing index:
// - Create composite index on expenses collection
// - Index fields: userId Ascending, date Descending, __name__ Descending
// - Use the following URL to create the index:
// https://console.firebase.google.com/v1/r/project/famxp-9f59a/firestore/indexes?create_composite=Ckxwcm9qZWN0cy9mYW14cC05ZjU5YS9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvZXhwZW5zZXMvaW5kZXhlcy9fEAEaCgoGdXNlcklkEAEaCAoEZGF0ZRACGgwKCF9fbmFtZV9fEAI

export default app;
