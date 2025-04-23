
import React, { createContext, useContext, useState, useEffect } from 'react';
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
  setDoc
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
  const { currentUser } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  // Fetch initial data when user changes
  useEffect(() => {
    if (currentUser) {
      fetchExpenses();
      fetchBudgets();
    } else {
      // Clear data when logged out
      setExpenses([]);
      setBudgets([]);
    }
  }, [currentUser]);

  // Fetch expenses from Firestore
  const fetchExpenses = async () => {
    if (!currentUser) return;
    
    try {
      let expensesQuery;
      
      if (currentUser.role === 'parent' && currentUser.children && currentUser.children.length > 0) {
        // For parents, get their expenses and their children's expenses
        expensesQuery = query(
          collection(db, 'expenses'),
          where('userId', 'in', [currentUser.id, ...currentUser.children]),
          orderBy('date', 'desc')
        );
      } else {
        // For children or parents without children, just get their expenses
        expensesQuery = query(
          collection(db, 'expenses'),
          where('userId', '==', currentUser.id),
          orderBy('date', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(expensesQuery);
      const fetchedExpenses: Expense[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
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
      });
      
      setExpenses(fetchedExpenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast.error("Error loading expenses");
    }
  };

  // Fetch budgets from Firestore
  const fetchBudgets = async () => {
    if (!currentUser) return;
    
    try {
      let budgetsQuery;
      
      if (currentUser.role === 'parent' && currentUser.children && currentUser.children.length > 0) {
        // For parents, get their budget and their children's budgets
        budgetsQuery = query(
          collection(db, 'budgets'),
          where('userId', 'in', [currentUser.id, ...currentUser.children])
        );
      } else {
        // For children or parents without children, just get their budget
        budgetsQuery = query(
          collection(db, 'budgets'),
          where('userId', '==', currentUser.id)
        );
      }
      
      const querySnapshot = await getDocs(budgetsQuery);
      const fetchedBudgets: Budget[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        fetchedBudgets.push({
          id: doc.id,
          userId: data.userId,
          amount: data.amount,
          period: data.period,
          categoryLimits: data.categoryLimits
        });
      });
      
      setBudgets(fetchedBudgets);
    } catch (error) {
      console.error("Error fetching budgets:", error);
      toast.error("Error loading budgets");
    }
  };

  const addExpense = async (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser) return;

    try {
      // Add expense to Firestore
      await addDoc(collection(db, 'expenses'), {
        ...expense,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Refresh expenses
      fetchExpenses();
      
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
      
      // Refresh expenses
      fetchExpenses();
      
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
      
      if (!querySnapshot.empty) {
        // Update existing budget
        const budgetDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, 'budgets', budgetDoc.id), {
          amount,
          period,
          ...(categoryLimits && { categoryLimits }),
          updatedAt: serverTimestamp()
        });
      } else {
        // Create new budget
        await addDoc(collection(db, 'budgets'), {
          userId,
          amount,
          period,
          ...(categoryLimits && { categoryLimits }),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      
      // Refresh budgets
      fetchBudgets();
      
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

  // Export functions
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
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create and download the file
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
    // In a real app, we'd use a library like jsPDF
    // For this demo, we'll just show a toast message
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
