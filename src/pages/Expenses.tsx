
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useExpense, Expense, EXPENSE_CATEGORIES } from "@/contexts/ExpenseContext";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Plus, FileText, Download, MoreVertical, Edit, Trash, Calendar, Filter } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const Expenses = () => {
  const { currentUser } = useAuth();
  const { 
    expenses, 
    addExpense, 
    updateExpense, 
    deleteExpense, 
    getUserExpenses,
    exportToCsv,
    exportToPdf,
    getCategories 
  } = useExpense();

  const [userExpenses, setUserExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentExpense, setCurrentExpense] = useState<Expense | null>(null);
  
  // Form states
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Categories 
  const categories = getCategories();

  // Load user's expenses
  useEffect(() => {
    if (currentUser) {
      const fetchedExpenses = getUserExpenses(currentUser.id);
      setUserExpenses(fetchedExpenses);
      setFilteredExpenses(fetchedExpenses);
    }
  }, [currentUser, getUserExpenses, expenses]);

  // Apply filters
  useEffect(() => {
    if (!userExpenses.length) return;
    
    let result = [...userExpenses];
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(exp => 
        exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply category filter
    if (categoryFilter && categoryFilter !== "all") {
      result = result.filter(exp => exp.category === categoryFilter);
    }
    
    // Apply date filter
    if (dateFilter) {
      const today = new Date();
      const startDate = new Date();
      
      switch (dateFilter) {
        case "today":
          result = result.filter(exp => 
            new Date(exp.date).toDateString() === today.toDateString()
          );
          break;
        case "week":
          startDate.setDate(today.getDate() - 7);
          result = result.filter(exp => 
            new Date(exp.date) >= startDate && new Date(exp.date) <= today
          );
          break;
        case "month":
          startDate.setMonth(today.getMonth() - 1);
          result = result.filter(exp => 
            new Date(exp.date) >= startDate && new Date(exp.date) <= today
          );
          break;
        case "year":
          startDate.setFullYear(today.getFullYear() - 1);
          result = result.filter(exp => 
            new Date(exp.date) >= startDate && new Date(exp.date) <= today
          );
          break;
      }
    }
    
    // Sort by date (newest first)
    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    setFilteredExpenses(result);
  }, [userExpenses, searchTerm, categoryFilter, dateFilter]);

  // Reset form fields
  const resetForm = () => {
    setAmount("");
    setCategory(EXPENSE_CATEGORIES[0]);
    setDescription("");
    setDate(new Date().toISOString().split('T')[0]);
  };

  // Handle new expense submission
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !category || !description || !date) {
      toast.error("Please fill all fields");
      return;
    }
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    addExpense({
      userId: currentUser!.id,
      amount: amountNum,
      category,
      description,
      date
    });
    
    setShowAddDialog(false);
    resetForm();
  };

  // Open edit dialog for an expense
  const handleEditClick = (expense: Expense) => {
    setCurrentExpense(expense);
    setAmount(expense.amount.toString());
    setCategory(expense.category);
    setDescription(expense.description);
    setDate(expense.date.split('T')[0]);
    setShowEditDialog(true);
  };

  // Handle expense update
  const handleUpdateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentExpense || !amount || !category || !description || !date) {
      toast.error("Please fill all fields");
      return;
    }
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    updateExpense(currentExpense.id, {
      amount: amountNum,
      category,
      description,
      date
    });
    
    setShowEditDialog(false);
    resetForm();
    setCurrentExpense(null);
  };

  // Handle expense deletion
  const handleDeleteExpense = (id: string) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      deleteExpense(id);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Expenses</h1>
            <p className="text-muted-foreground">
              Manage and track your spending
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button onClick={() => setShowAddDialog(true)} className="w-full sm:w-auto gap-2">
              <Plus className="h-4 w-4" />
              Add Expense
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto gap-2">
                  <FileText className="h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => exportToCsv(currentUser!.id)}>
                  <Download className="h-4 w-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportToPdf(currentUser!.id)}>
                  <Download className="h-4 w-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Filter Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search expenses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex-1 flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-1/2">
                  <Select
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                  >
                    <SelectTrigger className="w-full">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        <SelectValue placeholder="Category" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="w-full sm:w-1/2">
                  <Select
                    value={dateFilter}
                    onValueChange={setDateFilter}
                  >
                    <SelectTrigger className="w-full">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <SelectValue placeholder="Time Period" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">Last 7 Days</SelectItem>
                      <SelectItem value="month">Last 30 Days</SelectItem>
                      <SelectItem value="year">Last Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expenses Table */}
        <Card>
          <CardContent className="p-0">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.length > 0 ? (
                    filteredExpenses.map((expense) => (
                      <TableRow key={expense.id} className="expense-item-appear">
                        <TableCell>
                          {new Date(expense.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {expense.description}
                        </TableCell>
                        <TableCell>{expense.category}</TableCell>
                        <TableCell className="text-right font-medium">
                          ${expense.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditClick(expense)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteExpense(expense.id)}>
                                <Trash className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No expenses found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Expense Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
            <DialogDescription>
              Add a new expense to your tracker.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddExpense}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2">$</span>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-7"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="What did you spend on?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowAddDialog(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Add Expense</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Expense Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>
              Update the expense details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateExpense}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-amount">Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2">$</span>
                  <Input
                    id="edit-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-7"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger id="edit-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  placeholder="What did you spend on?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowEditDialog(false);
                  resetForm();
                  setCurrentExpense(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Update Expense</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Expenses;
