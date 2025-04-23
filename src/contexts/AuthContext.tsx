
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  UserCredential,
  updateProfile as firebaseUpdateProfile
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { toast } from 'sonner';

export type UserRole = 'parent' | 'child';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  parentId?: string; // Used for children to reference their parent
  children?: string[]; // Used for parents to reference their children
}

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole, parentId?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (user: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Get additional user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Set current user with combined data
            setCurrentUser({
              id: user.uid,
              name: user.displayName || userData.name,
              email: user.email || userData.email,
              role: userData.role,
              avatar: user.photoURL || userData.avatar,
              parentId: userData.parentId,
              children: userData.children || []
            });
          } else {
            // This would be unusual, as we should have created a user document during registration
            console.error("User document doesn't exist in Firestore");
            await signOut(auth);
            setCurrentUser(null);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          toast.error("Error loading user data");
        }
      } else {
        setCurrentUser(null);
      }
      
      setIsLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      await signInWithEmailAndPassword(auth, email.toLowerCase(), password);
      // User state will be updated by the auth state observer
      return Promise.resolve();
    } catch (error: any) {
      let errorMessage = "Login failed. Please try again.";
      
      if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email address.";
      } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
        errorMessage = "Invalid email or password.";
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = "Incorrect password.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many failed login attempts. Please try again later.";
      }
      
      console.error("Login error:", error);
      return Promise.reject(new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole, parentId?: string) => {
    setIsLoading(true);
    
    try {
      console.log("Registering new user:", { name, email, role, parentId });
      
      // Create Firebase auth user
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        auth, 
        email.toLowerCase(),
        password
      );
      
      const { user } = userCredential;
      console.log("Firebase user created:", user.uid);
      
      // Set display name
      await firebaseUpdateProfile(user, { displayName: name });
      
      // Create user document in Firestore
      const userData: any = {
        name,
        email: email.toLowerCase(),
        role,
        createdAt: new Date().toISOString()
      };
      
      if (role === 'child' && parentId) {
        userData.parentId = parentId;
      } else if (role === 'parent') {
        userData.children = [];
      }
      
      await setDoc(doc(db, 'users', user.uid), userData);
      console.log("User document created in Firestore");
      
      // If this is a child account, update the parent's children array
      if (role === 'child' && parentId) {
        console.log("Updating parent's children array");
        const parentRef = doc(db, 'users', parentId);
        const parentDoc = await getDoc(parentRef);
        
        if (parentDoc.exists()) {
          const parentData = parentDoc.data();
          const children = [...(parentData.children || []), user.uid];
          await updateDoc(parentRef, { children });
          console.log("Parent's children array updated");
          
          // Update current user if this parent is the logged-in user
          if (currentUser && currentUser.id === parentId) {
            setCurrentUser(prev => prev ? {...prev, children} : null);
          }
        } else {
          console.error("Parent document not found");
        }
      }
      
      return Promise.resolve();
      // Auth state observer will handle updating the current user
    } catch (error: any) {
      let errorMessage = "Registration failed. Please try again.";
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "Email is already in use. Please use a different email.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email address.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password is too weak. Please use a stronger password.";
      }
      
      console.error("Registration error:", error);
      return Promise.reject(new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      // Auth state observer will handle setting currentUser to null
      toast.info('Logged out');
    } catch (error) {
      console.error("Logout error:", error);
      toast.error('Error logging out');
    }
  };

  const updateProfile = async (userData: Partial<User>) => {
    if (!currentUser || !auth.currentUser) return;
    
    try {
      const userRef = doc(db, 'users', currentUser.id);
      
      // We'll skip avatar handling since we're not using Firebase Storage
      const updatedData = { ...userData };
      delete updatedData.avatar;
      
      // Update Firebase display name if name is being updated
      if (userData.name) {
        await firebaseUpdateProfile(auth.currentUser, { displayName: userData.name });
      }
      
      // Update user doc in Firestore
      await updateDoc(userRef, updatedData);
      
      // Update local state
      setCurrentUser(prevUser => prevUser ? { ...prevUser, ...updatedData } : null);
      
      toast.success('Profile updated');
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error('Failed to update profile');
      throw error;
    }
  };

  const authValue = {
    currentUser,
    isAuthenticated: !!currentUser,
    isLoading,
    login,
    register,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
