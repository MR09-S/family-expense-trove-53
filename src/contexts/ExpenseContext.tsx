
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

export interface Budget {
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
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

interface ExpenseContextType {
  expenses: Expense[];
  budgets: Budget[];
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateExpense: (id: string, expense: Partial<Omit<Expense, 'id' | 'userId'>>) => void;
  deleteExpense: (id: string) => void;
  setBudget: (userId: string, amount: number, period: 'weekly' | 'monthly', categoryLimits?: Record<string, number>) => void;
  getUserExpenses: (userId: string) => Expense[];
  getUserBudget: (userId: string) => Budget | undefined;
  getCategories: () => string[];
  exportToCsv: (userId: string) => void;
  exportToPdf: (userId: string) => void;
}

const EXPENSES_STORAGE_KEY = 'family-expense-tracker-expenses';
const BUDGETS_STORAGE_KEY = 'family-expense-tracker-budgets';

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

  // Load expenses and budgets from localStorage
  useEffect(() => {
    const savedExpenses = localStorage.getItem(EXPENSES_STORAGE_KEY);
    if (savedExpenses) {
      setExpenses(JSON.parse(savedExpenses));
    } else {
      localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify([]));
    }

    const savedBudgets = localStorage.getItem(BUDGETS_STORAGE_KEY);
    if (savedBudgets) {
      setBudgets(JSON.parse(savedBudgets));
    } else {
      localStorage.setItem(BUDGETS_STORAGE_KEY, JSON.stringify([]));
    }
  }, []);

  // Save expenses to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
  }, [expenses]);

  // Save budgets to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(BUDGETS_STORAGE_KEY, JSON.stringify(budgets));
  }, [budgets]);

  const addExpense = (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser) return;

    const now = new Date().toISOString();
    const newExpense: Expense = {
      ...expense,
      id: Date.now().toString(),
      createdAt: now,
      updatedAt: now
    };

    setExpenses(prev => [...prev, newExpense]);
    toast.success('Expense added');
  };

  const updateExpense = (id: string, updatedFields: Partial<Omit<Expense, 'id' | 'userId'>>) => {
    if (!currentUser) return;

    setExpenses(prev => 
      prev.map(expense => 
        expense.id === id ? 
        { 
          ...expense, 
          ...updatedFields, 
          updatedAt: new Date().toISOString() 
        } : 
        expense
      )
    );
    toast.success('Expense updated');
  };

  const deleteExpense = (id: string) => {
    if (!currentUser) return;

    setExpenses(prev => prev.filter(expense => expense.id !== id));
    toast.success('Expense deleted');
  };

  const setBudget = (userId: string, amount: number, period: 'weekly' | 'monthly', categoryLimits?: Record<string, number>) => {
    if (!currentUser || (currentUser.role !== 'parent' && currentUser.id !== userId)) {
      toast.error('Not authorized to set budget');
      return;
    }

    const budgetIndex = budgets.findIndex(b => b.userId === userId);
    
    if (budgetIndex >= 0) {
      // Update existing budget
      const updatedBudgets = [...budgets];
      updatedBudgets[budgetIndex] = {
        ...updatedBudgets[budgetIndex],
        amount,
        period,
        ...(categoryLimits && { categoryLimits })
      };
      setBudgets(updatedBudgets);
    } else {
      // Create new budget
      setBudgets([...budgets, { 
        userId, 
        amount, 
        period,
        ...(categoryLimits && { categoryLimits })
      }]);
    }
    
    toast.success('Budget updated');
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
      new Date(exp.date).toLocaleDateString(),
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
    exportToPdf
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
