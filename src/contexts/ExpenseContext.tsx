import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { db } from '@/lib/firebase';
import { 
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
  getDoc,
  setDoc,
  DocumentData,
  limit
} from 'firebase/firestore';

export interface Budget {
  id: string;
  userId: string;
  amount: number;
  period: 'weekly' | 'monthly';
  categoryLimits?: Record<string, number>;
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: string;
  description: string;
  date: string; // ISO date string
  createdAt: string | Timestamp; // ISO date string or Firestore timestamp
  updatedAt: string | Timestamp; // ISO date string or Firestore timestamp
}

// Define types for our Firestore document data
interface ExpenseDoc extends DocumentData {
  userId: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface BudgetDoc extends DocumentData {
  userId: string;
  amount: number;
  period: 'weekly' | 'monthly';
  categoryLimits?: Record<string, number>;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

interface ExpenseContextType {
  expenses: Expense[];
  budgets: Budget[];
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Omit<Expense, 'id' | 'userId'>>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  setBudget: (userId: string, amount: number, period: 'weekly' | 'monthly', categoryLimits?: Record<string, number>) => Promise<void>;
  getUserExpenses: (userId: string) => Expense[];
  getUserBudget: (userId: string) => Budget | undefined;
  getCategories: () => string[];
  exportToCsv: (userId: string) => void;
  exportToPdf: (userId: string) => void;
  fetchExpenses: () => Promise<void>;
  fetchBudgets: () => Promise<void>;
}

// Predefined expense categories
export const EXPENSE_CATEGORIES = [
  'Food',
  'Transportation',
  'Entertainment',
  'Shopping',
  'Utilities',
  'Education',
  'Health',
  'Other'
];

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [dataFetchAttempted, setDataFetchAttempted] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);

  // Fetch expenses from Firestore with retry logic
  const fetchExpenses = useCallback(async () => {
    if (!currentUser) {
      console.log("fetchExpenses: No user, skipping fetch");
      return;
    }
    
    // Implement a simple throttling to avoid too many consecutive calls
    const now = Date.now();
    if (lastFetchTime && now - lastFetchTime < 2000) {
      console.log("fetchExpenses: Throttling fetch request");
      return;
    }
    setLastFetchTime(now);

    const maxRetries = 3;
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        console.log("fetchExpenses: Starting fetch for user", currentUser.id);
        let expensesQuery;
        
        if (currentUser.role === 'parent' && currentUser.children && currentUser.children.length > 0) {
          // For parents, get their expenses and their children's expenses
          const userIds = [currentUser.id, ...currentUser.children].slice(0, 10); // Firestore IN has a limit
          console.log("Fetching expenses for parent and children:", userIds);
          
          // Use a simpler query to avoid index issues
          expensesQuery = query(
            collection(db, 'expenses'),
            where('userId', 'in', userIds),
            limit(100)
          );
        } else {
          // For children or parents without children, just get their expenses
          console.log("Fetching expenses for single user:", currentUser.id);
          expensesQuery = query(
            collection(db, 'expenses'),
            where('userId', '==', currentUser.id),
            limit(100)
          );
        }
        
        const querySnapshot = await getDocs(expensesQuery);
        const fetchedExpenses: Expense[] = [];
        
        querySnapshot.forEach((doc) => {
          try {
            const data = doc.data() as ExpenseDoc;
            
            fetchedExpenses.push({
              id: doc.id,
              userId: data.userId,
              amount: data.amount,
              category: data.category,
              description: data.description,
              date: data.date,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt
            });
          } catch (error) {
            console.error(`Error processing expense doc ${doc.id}:`, error);
            // Skip this document but continue with others
          }
        });
        
        console.log(`fetchExpenses: Fetched ${fetchedExpenses.length} expenses`);
        
        // Sort expenses by date (newest first) since we're not using orderBy in the query
        const sortedExpenses = fetchedExpenses.sort((a, b) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        
        setExpenses(sortedExpenses);
        break; // Successful, exit retry loop
      } catch (error) {
        retries++;
        console.error(`Error fetching expenses (attempt ${retries}):`, error);
        
        if (retries >= maxRetries) {
          console.error("Max retries reached for fetching expenses");
          toast.error("Error loading expenses");
          // Return empty array in case of error
          setExpenses([]);
          throw error;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }, [currentUser, lastFetchTime]);

  // Fetch budgets from Firestore with retry logic
  const fetchBudgets = useCallback(async () => {
    if (!currentUser) {
      console.log("fetchBudgets: No user, skipping fetch");
      return;
    }
    
    const maxRetries = 3;
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        console.log("fetchBudgets: Starting fetch for user", currentUser.id);
        let budgetsQuery;
        
        if (currentUser.role === 'parent' && currentUser.children && currentUser.children.length > 0) {
          // For parents, get their budget and their children's budgets
          const userIds = [currentUser.id, ...currentUser.children].slice(0, 10); // Firestore IN has a limit
          console.log("Fetching budgets for parent and children:", userIds);
          budgetsQuery = query(
            collection(db, 'budgets'),
            where('userId', 'in', userIds)
          );
        } else {
          // For children or parents without children, just get their budget
          console.log("Fetching budgets for single user:", currentUser.id);
          budgetsQuery = query(
            collection(db, 'budgets'),
            where('userId', '==', currentUser.id)
          );
        }
        
        const querySnapshot = await getDocs(budgetsQuery);
        const fetchedBudgets: Budget[] = [];
        
        querySnapshot.forEach((doc) => {
          try {
            const data = doc.data() as BudgetDoc;
            
            fetchedBudgets.push({
              id: doc.id,
              userId: data.userId,
              amount: data.amount,
              period: data.period,
              categoryLimits: data.categoryLimits
            });
          } catch (error) {
            console.error(`Error processing budget doc ${doc.id}:`, error);
            // Skip this document but continue with others
          }
        });
        
        console.log(`fetchBudgets: Fetched ${fetchedBudgets.length} budgets`);
        setBudgets(fetchedBudgets);
        break; // Successful, exit retry loop
      } catch (error) {
        retries++;
        console.error(`Error fetching budgets (attempt ${retries}):`, error);
        
        if (retries >= maxRetries) {
          console.error("Max retries reached for fetching budgets");
          toast.error("Error loading budgets");
          // Return empty array in case of error
          setBudgets([]);
          throw error;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }, [currentUser]);

  useEffect(() => {
    const loadData = async () => {
      if (currentUser && isAuthenticated) {
        console.log("ExpenseProvider: User authenticated, fetching data");
        try {
          await fetchExpenses();
          await fetchBudgets();
          setDataFetchAttempted(true);
        } catch (error) {
          console.error("Error fetching initial data:", error);
          // Even if there's an error, we mark fetch as attempted to avoid endless retries
          setDataFetchAttempted(true);
        }
      } else if (!currentUser && dataFetchAttempted) {
        console.log("ExpenseProvider: User logged out, clearing data");
        setExpenses([]);
        setBudgets([]);
      }
    };
    
    loadData();
  }, [currentUser, isAuthenticated, fetchExpenses, fetchBudgets, dataFetchAttempted]);

  const addExpense = async (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser) return;

    try {
      console.log("Adding expense:", expense);
      
      // Add expense to Firestore
      const expenseData = {
        ...expense,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'expenses'), expenseData);
      console.log("Expense added with ID:", docRef.id);
      
      // Add to local state to avoid re-fetching
      const newExpense: Expense = {
        id: docRef.id,
        ...expense,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setExpenses(prev => [newExpense, ...prev]);
      
      // Refresh expenses to ensure we have the latest data
      await fetchExpenses();
      
      toast.success('Expense added');
    } catch (error) {
      console.error("Error adding expense:", error);
      toast.error("Failed to add expense");
    }
  };

  const updateExpense = async (id: string, updatedFields: Partial<Omit<Expense, 'id' | 'userId'>>) => {
    if (!currentUser) return;

    try {
      const expenseRef = doc(db, 'expenses', id);
      
      // Update in Firestore
      await updateDoc(expenseRef, {
        ...updatedFields,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      setExpenses(prev => prev.map(expense => 
        expense.id === id ? { ...expense, ...updatedFields, updatedAt: new Date().toISOString() } : expense
      ));
      
      // Also refresh to ensure data consistency
      await fetchExpenses();
      
      toast.success('Expense updated');
    } catch (error) {
      console.error("Error updating expense:", error);
      toast.error("Failed to update expense");
    }
  };

  const deleteExpense = async (id: string) => {
    if (!currentUser) return;

    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'expenses', id));
      
      // Update local state
      setExpenses(prev => prev.filter(expense => expense.id !== id));
      
      toast.success('Expense deleted');
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error("Failed to delete expense");
    }
  };

  const setBudget = async (userId: string, amount: number, period: 'weekly' | 'monthly', categoryLimits?: Record<string, number>) => {
    if (!currentUser || (currentUser.role !== 'parent' && currentUser.id !== userId)) {
      toast.error('Not authorized to set budget');
      return;
    }

    try {
      // Check if budget already exists
      const budgetQuery = query(
        collection(db, 'budgets'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(budgetQuery);
      
      const budgetData = {
        userId,
        amount,
        period,
        ...(categoryLimits && { categoryLimits }),
        updatedAt: serverTimestamp()
      };
      
      if (!querySnapshot.empty) {
        // Update existing budget
        const budgetDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, 'budgets', budgetDoc.id), budgetData);
        
        // Update local state
        setBudgets(prev => prev.map(b => 
          b.userId === userId 
            ? { ...b, amount, period, ...(categoryLimits && { categoryLimits }) } 
            : b
        ));
      } else {
        // Create new budget
        const docRef = await addDoc(collection(db, 'budgets'), {
          ...budgetData,
          createdAt: serverTimestamp(),
        });
        
        // Update local state
        setBudgets(prev => [...prev, {
          id: docRef.id,
          userId,
          amount,
          period,
          ...(categoryLimits && { categoryLimits })
        }]);
      }
      
      // Refresh budgets to ensure data consistency
      await fetchBudgets();
      
      toast.success('Budget updated');
    } catch (error) {
      console.error("Error setting budget:", error);
      toast.error("Failed to update budget");
    }
  };

  const getUserExpenses = (userId: string) => {
    return expenses.filter(expense => expense.userId === userId);
  };

  const getUserBudget = (userId: string) => {
    return budgets.find(budget => budget.userId === userId);
  };

  const getCategories = () => {
    return EXPENSE_CATEGORIES;
  };

  const exportToCsv = (userId: string) => {
    const userExpenses = getUserExpenses(userId);
    
    if (userExpenses.length === 0) {
      toast.error('No expenses to export');
      return;
    }
    
    const headers = ['Date', 'Category', 'Description', 'Amount'];
    const rows = userExpenses.map(exp => [
      typeof exp.date === 'string' ? new Date(exp.date).toLocaleDateString() : 'N/A',
      exp.category,
      exp.description,
      exp.amount.toFixed(2)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `expenses-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('CSV downloaded');
  };

  const exportToPdf = (userId: string) => {
    toast.info('PDF export would be implemented with a library like jsPDF');
  };

  const expenseValue = {
    expenses,
    budgets,
    addExpense,
    updateExpense,
    deleteExpense,
    setBudget,
    getUserExpenses,
    getUserBudget,
    getCategories,
    exportToCsv,
    exportToPdf,
    fetchExpenses,
    fetchBudgets
  };

  return (
    <ExpenseContext.Provider value={expenseValue}>
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpense = () => {
  const context = useContext(ExpenseContext);
  if (context === undefined) {
    throw new Error('useExpense must be used within an ExpenseProvider');
  }
  return context;
};
