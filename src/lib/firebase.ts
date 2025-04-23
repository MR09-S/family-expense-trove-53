
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
    // Helper function to check if the user is authenticated
    function isAuth() {
      return request.auth != null;
    }
    
    // Helper function to check if user is accessing their own data
    function isUserOwned(userId) {
      return request.auth.uid == userId;
    }
    
    // Helper function to check if the user is a parent
    function isParent(userId) {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "parent";
    }
    
    // Helper function to check if the user is a child of the parent
    function isChild(parentId) {
      return request.auth.uid in get(/databases/$(database)/documents/users/$(parentId)).data.children;
    }
    
    // User document rules
    match /users/{userId} {
      // Users can read their own data
      // Parents can read their children's data
      allow read: if isAuth() && (
        isUserOwned(userId) || 
        (isParent(request.auth.uid) && isChild(request.auth.uid))
      );
      
      // Users can create their own data
      allow create: if isAuth() && isUserOwned(userId);
      
      // Users can update their own data
      // Parents can update their children's data
      allow update: if isAuth() && (
        isUserOwned(userId) || 
        (isParent(request.auth.uid) && isChild(request.auth.uid))
      );
      
      // Users cannot delete their accounts directly
      allow delete: if false;
    }
    
    // Expense document rules
    match /expenses/{expenseId} {
      // Users can read their own expenses
      // Parents can read their children's expenses
      allow read: if isAuth() && (
        isUserOwned(resource.data.userId) ||
        (isParent(request.auth.uid) && isChild(resource.data.userId))
      );
      
      // Users can create expenses for themselves
      // Parents can create expenses for their children
      allow create: if isAuth() && (
        isUserOwned(request.resource.data.userId) ||
        (isParent(request.auth.uid) && isChild(request.resource.data.userId))
      );
      
      // Users can update their own expenses
      // Parents can update their children's expenses
      allow update: if isAuth() && (
        isUserOwned(resource.data.userId) ||
        (isParent(request.auth.uid) && isChild(resource.data.userId))
      );
      
      // Users can delete their own expenses
      // Parents can delete their children's expenses
      allow delete: if isAuth() && (
        isUserOwned(resource.data.userId) ||
        (isParent(request.auth.uid) && isChild(resource.data.userId))
      );
    }
    
    // Budget document rules
    match /budgets/{budgetId} {
      // Users can read their own budgets
      // Parents can read their children's budgets
      allow read: if isAuth() && (
        isUserOwned(resource.data.userId) ||
        (isParent(request.auth.uid) && isChild(resource.data.userId))
      );
      
      // Users can create budgets for themselves
      // Parents can create budgets for their children
      allow create: if isAuth() && (
        isUserOwned(request.resource.data.userId) ||
        (isParent(request.auth.uid) && isChild(request.resource.data.userId))
      );
      
      // Users can update their own budgets
      // Parents can update their children's budgets
      allow update: if isAuth() && (
        isUserOwned(resource.data.userId) ||
        (isParent(request.auth.uid) && isChild(resource.data.userId))
      );
      
      // Users can delete their own budgets
      // Parents can delete their children's budgets
      allow delete: if isAuth() && (
        isUserOwned(resource.data.userId) ||
        (isParent(request.auth.uid) && isChild(resource.data.userId))
      );
    }
  }
}
*/

export default app;
