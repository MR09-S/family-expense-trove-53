
import React, { createContext, useContext, useState, useEffect } from 'react';
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
  updateProfile: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users database for demo purposes
const USERS_STORAGE_KEY = 'family-expense-tracker-users';
const CURRENT_USER_KEY = 'family-expense-tracker-current-user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize or load users from localStorage
  useEffect(() => {
    // Load saved users or create initial database
    const savedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    if (!savedUsers) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([]));
    }

    // Check if user is already logged in
    const savedUser = localStorage.getItem(CURRENT_USER_KEY);
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    
    setIsLoading(false);
  }, []);

  const getUsers = (): User[] => {
    const users = localStorage.getItem(USERS_STORAGE_KEY);
    return users ? JSON.parse(users) : [];
  };

  const saveUsers = (users: User[]) => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  };

  const login = async (email: string, password: string) => {
    // In a real app, you would validate credentials against a backend
    // For demo, we just check if the email exists in our mock database
    setIsLoading(true);
    
    try {
      const users = getUsers();
      const user = users.find(u => u.email === email);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // In a real app, you would hash and compare passwords
      // For demo, we skip password validation
      
      setCurrentUser(user);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      toast.success('Logged in successfully');
    } catch (error) {
      toast.error('Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole, parentId?: string) => {
    setIsLoading(true);
    
    try {
      const users = getUsers();
      
      // Check if user already exists
      if (users.some(user => user.email === email)) {
        throw new Error('User already exists');
      }
      
      // Create new user
      const newUser: User = {
        id: Date.now().toString(),
        name,
        email,
        role,
        ...(role === 'child' && parentId ? { parentId } : {}),
        ...(role === 'parent' ? { children: [] } : {})
      };
      
      // If this is a child account, update the parent's children array
      if (role === 'child' && parentId) {
        const parentIndex = users.findIndex(user => user.id === parentId);
        if (parentIndex >= 0) {
          users[parentIndex].children = [
            ...(users[parentIndex].children || []),
            newUser.id
          ];
        }
      }
      
      // Add user to database
      saveUsers([...users, newUser]);
      
      // Log in the new user
      setCurrentUser(newUser);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
      
      toast.success('Registration successful');
    } catch (error) {
      toast.error('Registration failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
    toast.info('Logged out');
  };

  const updateProfile = (updatedInfo: Partial<User>) => {
    if (!currentUser) return;

    const updatedUser = { ...currentUser, ...updatedInfo };
    setCurrentUser(updatedUser);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));

    // Also update in the users database
    const users = getUsers();
    const updatedUsers = users.map(user => 
      user.id === currentUser.id ? { ...user, ...updatedInfo } : user
    );
    saveUsers(updatedUsers);

    toast.success('Profile updated');
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
