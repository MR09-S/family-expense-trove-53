import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useExpense, Expense } from "@/contexts/ExpenseContext";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  ArrowRight, 
  PlusCircle,
  AlertCircle 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/lib/utils";

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { getUserExpenses, getUserBudget, expenses, budgets, fetchExpenses, fetchBudgets } = useExpense();
  const navigate = useNavigate();
  
  const [userExpenses, setUserExpenses] = useState<Expense[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [budget, setBudget] = useState(0);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // For children monitored by this parent
  const [childrenExpenses, setChildrenExpenses] = useState<{
    childId: string;
    childName: string;
    total: number;
    budget: number;
    percentage: number;
  }[]>([]);

  // Force refresh data when component loads
  useEffect(() => {
    const loadData = async () => {
      if (currentUser) {
        setIsLoading(true);
        setError(null);
        console.log("Dashboard: Fetching expenses and budgets");
        
        try {
          // Force refresh expenses and budgets
          await fetchExpenses();
          await fetchBudgets();
          console.log("Dashboard: Data refreshed");
        } catch (error) {
          console.error("Dashboard: Error refreshing data", error);
          setError("Failed to load data. Please try again.");
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    loadData();
  }, [currentUser, fetchExpenses, fetchBudgets]);

  // Process data when expenses or budgets change
  useEffect(() => {
    if (currentUser && expenses.length >= 0 && budgets.length >= 0) {
      // Get user expenses
      const userExpenseList = getUserExpenses(currentUser.id);
      setUserExpenses(userExpenseList);
      console.log("Dashboard: User expenses loaded:", userExpenseList.length);
      
      // Get recent expenses
      const sorted = [...userExpenseList].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setRecentExpenses(sorted.slice(0, 5));
      
      // Calculate total spent this month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthExpenses = userExpenseList.filter(
        (expense) => new Date(expense.date) >= startOfMonth
      );
      const total = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      setTotalSpent(total);
      
      // Get budget
      const userBudget = getUserBudget(currentUser.id);
      setBudget(userBudget?.amount || 0);
      
      // Calculate category distribution
      const categories: Record<string, number> = {};
      userExpenseList.forEach((expense) => {
        categories[expense.category] = (categories[expense.category] || 0) + expense.amount;
      });
      
      const catData = Object.entries(categories).map(([name, value]) => ({
        name,
        value
      }));
      
      setCategoryData(catData);
      
      // Get data for children if user is a parent
      if (currentUser.role === 'parent' && currentUser.children?.length) {
        const childrenData = currentUser.children.map((childId) => {
          // Find the child user - in a real app we might fetch more data
          const childName = `Child ${childId.substring(0, 4)}`;
          
          // Get child's expenses
          const childExpenses = getUserExpenses(childId);
          const childTotal = childExpenses.reduce((sum, expense) => sum + expense.amount, 0);
          
          // Get child's budget
          const childBudget = getUserBudget(childId);
          const budgetAmount = childBudget?.amount || 0;
          
          // Calculate percentage of budget used
          const percentage = budgetAmount > 0 ? (childTotal / budgetAmount) * 100 : 0;
          
          return {
            childId,
            childName,
            total: childTotal,
            budget: budgetAmount,
            percentage
          };
        });
        
        setChildrenExpenses(childrenData);
      }
    }
  }, [currentUser, getUserExpenses, getUserBudget, expenses, budgets]);

  // Generate weekly spending data for the chart
  const getWeeklyData = () => {
    const today = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(today.getDate() - 7);
    
    // Group expenses by day
    const dailyExpenses: Record<string, number> = {};
    for (let i = 0; i <= 6; i++) {
      const date = new Date();
      date.setDate(today.getDate() - (6 - i));
      const dateStr = date.toISOString().split('T')[0];
      dailyExpenses[dateStr] = 0;
    }
    
    // Add expenses to their respective days
    userExpenses.forEach((expense) => {
      const expenseDate = expense.date.split('T')[0];
      if (dailyExpenses[expenseDate] !== undefined) {
        dailyExpenses[expenseDate] += expense.amount;
      }
    });
    
    // Convert to chart data format
    return Object.entries(dailyExpenses).map(([date, amount]) => ({
      date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      amount
    }));
  };

  // Colors for the pie chart
  const COLORS = ['#4361EE', '#3DDBD9', '#2EC4B6', '#FF9F1C', '#E71D36', '#7B61FF', '#FCBF49'];

  // If there's an error, show it
  if (error) {
    return (
      <div className="animate-fade-in">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()}>Reload Page</Button>
      </div>
    );
  }
  
  // If loading, show a spinner
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {currentUser?.name}
            </p>
          </div>
          <Button onClick={() => navigate('/expenses')} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Add Expense
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Spent */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                This Month
              </CardTitle>
              <div className="p-2 bg-primary/10 rounded-full">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
              <p className="text-xs text-muted-foreground">
                Total spent this month
              </p>
            </CardContent>
          </Card>

          {/* Budget */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Budget
              </CardTitle>
              <div className="p-2 bg-accent/10 rounded-full">
                <Calendar className="h-4 w-4 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(budget)}</div>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full ${totalSpent <= budget ? 'bg-accent' : 'bg-destructive'}`}
                  style={{ width: `${Math.min((totalSpent / budget) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {budget > 0 
                  ? `${((totalSpent / budget) * 100).toFixed(0)}% of monthly budget used`
                  : 'No budget set'}
              </p>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Status
              </CardTitle>
              {totalSpent <= budget ? (
                <div className="p-2 bg-green-100 rounded-full">
                  <TrendingDown className="h-4 w-4 text-green-600" />
                </div>
              ) : (
                <div className="p-2 bg-red-100 rounded-full">
                  <TrendingUp className="h-4 w-4 text-red-600" />
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                totalSpent <= budget ? 'text-green-600' : 'text-red-600'
              }`}>
                {totalSpent <= budget 
                  ? `${formatCurrency(budget - totalSpent)} left` 
                  : `${formatCurrency(totalSpent - budget)} over`}
              </div>
              <p className="text-xs text-muted-foreground">
                {totalSpent <= budget 
                  ? 'Under budget - you\'re doing great!' 
                  : 'Over budget - try to reduce expenses'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Spending */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Weekly Spending</CardTitle>
              <CardDescription>Your spending trend for the last 7 days</CardDescription>
            </CardHeader>
            <CardContent className="chart-appear">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={getWeeklyData()}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="hsl(var(--primary))"
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
              <CardDescription>How your money is distributed</CardDescription>
            </CardHeader>
            <CardContent className="chart-appear">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
            <CardDescription>Your latest spending activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentExpenses.length > 0 ? (
                recentExpenses.map((expense) => (
                  <div 
                    key={expense.id}
                    className="flex items-center justify-between p-3 bg-background border rounded-md expense-item-appear"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-xs font-medium">
                          {expense.category.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{expense.description}</p>
                        <p className="text-xs text-muted-foreground">{expense.category} • {new Date(expense.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className="font-medium">{formatCurrency(expense.amount)}</span>
                  </div>
                ))
              ) : (
                <p className="text-center py-4 text-muted-foreground">No recent expenses</p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" className="w-full" onClick={() => navigate('/expenses')}>
              View All Expenses
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>

        {/* Children section (for parents only) */}
        {currentUser?.role === 'parent' && (
          <Card>
            <CardHeader>
              <CardTitle>Family Overview</CardTitle>
              <CardDescription>Monitor your family's spending</CardDescription>
            </CardHeader>
            <CardContent>
              {childrenExpenses.length > 0 ? (
                <div className="space-y-4">
                  {childrenExpenses.map((child) => (
                    <div key={child.childId} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{child.childName}</p>
                        <span className="text-sm font-medium">
                          {formatCurrency(child.total)} / {formatCurrency(child.budget)}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            child.percentage <= 100 ? 'bg-accent' : 'bg-destructive'
                          }`}
                          style={{ width: `${Math.min(child.percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-4 text-muted-foreground">No children accounts connected</p>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="w-full" onClick={() => navigate('/family')}>
                Manage Family
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
