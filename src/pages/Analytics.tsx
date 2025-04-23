import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useExpense, Expense } from "@/contexts/ExpenseContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer
} from "recharts";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";

const Analytics = () => {
  const { currentUser } = useAuth();
  const { getUserExpenses, expenses, fetchExpenses } = useExpense();
  
  const [userExpenses, setUserExpenses] = useState<Expense[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [dailyData, setDailyData] = useState<any[]>([]);
  
  const COLORS = ['#4361EE', '#3DDBD9', '#2EC4B6', '#FF9F1C', '#E71D36', '#7B61FF', '#FCBF49'];

  useEffect(() => {
    if (currentUser) {
      console.log("Analytics: Fetching expenses");
      
      fetchExpenses().then(() => {
        console.log("Analytics: Expenses fetched");
      });
    }
  }, [currentUser, fetchExpenses]);

  useEffect(() => {
    if (currentUser) {
      const fetchedExpenses = getUserExpenses(currentUser.id);
      console.log("Analytics: User expenses loaded:", fetchedExpenses.length);
      setUserExpenses(fetchedExpenses);
      
      const monthlySpendings: Record<string, number> = {};
      const now = new Date();
      
      for (let i = 0; i < 12; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        monthlySpendings[monthStr] = 0;
      }
      
      fetchedExpenses.forEach(expense => {
        const date = new Date(expense.date);
        const monthStr = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        
        if (monthlySpendings[monthStr] !== undefined) {
          monthlySpendings[monthStr] += expense.amount;
        }
      });
      
      const monthlyChartData = Object.entries(monthlySpendings)
        .map(([month, amount]) => ({ month, amount }))
        .reverse();
      
      setMonthlyData(monthlyChartData);
      
      const categorySpendings: Record<string, number> = {};
      fetchedExpenses.forEach(expense => {
        categorySpendings[expense.category] = (categorySpendings[expense.category] || 0) + expense.amount;
      });
      
      const categoryChartData = Object.entries(categorySpendings)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
      
      setCategoryData(categoryChartData);
      
      const dailySpendings: Record<string, number> = {};
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(now.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dailySpendings[dateStr] = 0;
      }
      
      fetchedExpenses.forEach(expense => {
        const dateStr = expense.date.split('T')[0];
        if (dailySpendings[dateStr] !== undefined) {
          dailySpendings[dateStr] += expense.amount;
        }
      });
      
      const dailyChartData = Object.entries(dailySpendings)
        .map(([date, amount]) => ({
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          amount,
          fullDate: date,
        }))
        .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());
      
      setDailyData(dailyChartData);
    }
  }, [currentUser, getUserExpenses, expenses]);

  const totalSpending = categoryData.reduce((sum, item) => sum + item.value, 0);
  
  const topCategories = [...categoryData]
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Visualize your spending patterns
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Spending Overview</CardTitle>
            <CardDescription>
              {userExpenses.length
                ? `Based on ${userExpenses.length} expenses recorded`
                : "No expenses recorded yet"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="monthly">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="category">By Category</TabsTrigger>
                <TabsTrigger value="daily">Daily</TabsTrigger>
              </TabsList>
              
              <TabsContent value="monthly" className="pt-4 chart-appear">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Bar 
                        dataKey="amount" 
                        name="Total Spending" 
                        fill="hsl(var(--primary))"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
              
              <TabsContent value="category" className="pt-4 chart-appear">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="flex flex-col justify-center">
                    <h3 className="text-lg font-semibold mb-4">Category Breakdown</h3>
                    <div className="space-y-4">
                      {categoryData.map((category, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{category.name}</span>
                            <span>${category.value.toFixed(2)}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full"
                              style={{
                                width: `${(category.value / totalSpending) * 100}%`,
                                backgroundColor: COLORS[index % COLORS.length],
                              }}
                            ></div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {((category.value / totalSpending) * 100).toFixed(1)}% of total spending
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="daily" className="pt-4 chart-appear">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={dailyData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        interval={Math.ceil(dailyData.length / 10)}
                      />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="hsl(var(--accent))"
                        name="Daily Spending"
                        strokeWidth={2}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Top Spending Categories</CardTitle>
              <CardDescription>Where your money goes the most</CardDescription>
            </CardHeader>
            <CardContent>
              {topCategories.length > 0 ? (
                <div className="space-y-6">
                  {topCategories.map((category, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{category.name}</span>
                        <span className="font-medium">${category.value.toFixed(2)}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full"
                          style={{
                            width: `${(category.value / totalSpending) * 100}%`,
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{((category.value / totalSpending) * 100).toFixed(1)}% of total</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  No spending data available
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Spending Insights</CardTitle>
              <CardDescription>Average spending analysis</CardDescription>
            </CardHeader>
            <CardContent>
              {userExpenses.length > 0 ? (
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">Monthly Average</h3>
                      <span className="text-lg font-bold">
                        ${(monthlyData.reduce((sum, month) => sum + month.amount, 0) / monthlyData.filter(m => m.amount > 0).length || 1).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Average amount spent per month
                    </p>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">Daily Average</h3>
                      <span className="text-lg font-bold">
                        ${(userExpenses.reduce((sum, exp) => sum + exp.amount, 0) / 30).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Average amount spent per day (last 30 days)
                    </p>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">Average Transaction</h3>
                      <span className="text-lg font-bold">
                        ${(userExpenses.reduce((sum, exp) => sum + exp.amount, 0) / userExpenses.length).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Average amount per expense
                    </p>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">Highest Daily Spending</h3>
                      <span className="text-lg font-bold">
                        ${Math.max(...dailyData.map(day => day.amount)).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Maximum spent in a single day (last 30 days)
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  No spending data available
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
