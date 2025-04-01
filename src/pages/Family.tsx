
import { useEffect, useState } from "react";
import { useAuth, User } from "@/contexts/AuthContext";
import { useExpense } from "@/contexts/ExpenseContext";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { UserPlus, ChevronRight, User as UserIcon, DollarSign } from "lucide-react";

const Family = () => {
  const { currentUser } = useAuth();
  const { setBudget, getUserExpenses, getUserBudget } = useExpense();

  // If the user is not a parent, redirect them or show access denied
  if (currentUser?.role !== 'parent') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground">
          This page is only available to parent accounts.
        </p>
      </div>
    );
  }

  const [children, setChildren] = useState<User[]>([]);
  const [showAddChildDialog, setShowAddChildDialog] = useState(false);
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  const [selectedChild, setSelectedChild] = useState<User | null>(null);

  // Form states for adding a child
  const [childName, setChildName] = useState('');
  const [childEmail, setChildEmail] = useState('');
  const [childPassword, setChildPassword] = useState('');
  
  // Form states for setting budget
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetPeriod, setBudgetPeriod] = useState<'weekly' | 'monthly'>('monthly');
  const [limitByCategory, setLimitByCategory] = useState(false);
  const [categoryLimits, setCategoryLimits] = useState<Record<string, string>>({
    Food: '',
    Transportation: '',
    Entertainment: '',
    Education: '',
    Shopping: ''
  });

  // Load children accounts from localStorage (mock database)
  useEffect(() => {
    if (!currentUser?.children?.length) return;
    
    // In a real app, we would fetch child user data from the database
    // For the demo, we'll simulate this using localStorage
    
    const usersStr = localStorage.getItem('family-expense-tracker-users');
    if (usersStr) {
      const users: User[] = JSON.parse(usersStr);
      const childUsers = users.filter(user => 
        user.role === 'child' && 
        currentUser.children?.includes(user.id)
      );
      setChildren(childUsers);
    }
  }, [currentUser]);

  const handleAddChild = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!childName || !childEmail || !childPassword) {
      toast.error("Please fill all fields");
      return;
    }
    
    // In a real app, this would create a new user account linked to the parent
    // For this demo, we'll simulate by adding a user to localStorage
    
    const usersStr = localStorage.getItem('family-expense-tracker-users');
    if (usersStr) {
      const users: User[] = JSON.parse(usersStr);
      
      // Check if email is already in use
      if (users.some(user => user.email === childEmail)) {
        toast.error("Email already in use");
        return;
      }
      
      // Create new child user
      const newChild: User = {
        id: Date.now().toString(),
        name: childName,
        email: childEmail,
        role: 'child',
        parentId: currentUser.id
      };
      
      // Add child to users array
      users.push(newChild);
      localStorage.setItem('family-expense-tracker-users', JSON.stringify(users));
      
      // Update parent user to include child
      const parentIndex = users.findIndex(user => user.id === currentUser.id);
      if (parentIndex >= 0) {
        users[parentIndex].children = [
          ...(users[parentIndex].children || []),
          newChild.id
        ];
        localStorage.setItem('family-expense-tracker-users', JSON.stringify(users));
        
        // Update current user in session
        const updatedCurrentUser = { 
          ...currentUser, 
          children: [...(currentUser.children || []), newChild.id] 
        };
        localStorage.setItem('family-expense-tracker-current-user', JSON.stringify(updatedCurrentUser));
      }
      
      // Add child to local state
      setChildren(prev => [...prev, newChild]);
      
      toast.success(`Added ${childName} to your family`);
      setShowAddChildDialog(false);
      resetChildForm();
    }
  };

  const handleSetBudget = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedChild || !budgetAmount) {
      toast.error("Please enter a budget amount");
      return;
    }
    
    const amount = parseFloat(budgetAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    // Set category limits if enabled
    let catLimits: Record<string, number> | undefined = undefined;
    if (limitByCategory) {
      catLimits = {};
      for (const [category, value] of Object.entries(categoryLimits)) {
        if (value) {
          const limit = parseFloat(value);
          if (!isNaN(limit) && limit > 0) {
            catLimits[category] = limit;
          }
        }
      }
    }
    
    // Set budget for the child
    setBudget(selectedChild.id, amount, budgetPeriod, catLimits);
    
    setShowBudgetDialog(false);
    resetBudgetForm();
  };

  const openBudgetDialog = (child: User) => {
    setSelectedChild(child);
    
    // Load current budget if exists
    const budget = getUserBudget(child.id);
    if (budget) {
      setBudgetAmount(budget.amount.toString());
      setBudgetPeriod(budget.period);
      
      if (budget.categoryLimits) {
        setLimitByCategory(true);
        const limits: Record<string, string> = {};
        for (const [category, limit] of Object.entries(budget.categoryLimits)) {
          limits[category] = limit.toString();
        }
        setCategoryLimits(prev => ({ ...prev, ...limits }));
      }
    }
    
    setShowBudgetDialog(true);
  };

  const resetChildForm = () => {
    setChildName('');
    setChildEmail('');
    setChildPassword('');
  };

  const resetBudgetForm = () => {
    setBudgetAmount('');
    setBudgetPeriod('monthly');
    setLimitByCategory(false);
    setCategoryLimits({
      Food: '',
      Transportation: '',
      Entertainment: '',
      Education: '',
      Shopping: ''
    });
    setSelectedChild(null);
  };

  const getChildDetails = (child: User) => {
    const expenses = getUserExpenses(child.id);
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    const budget = getUserBudget(child.id);
    const budgetAmount = budget?.amount || 0;
    
    const percentage = budgetAmount > 0 ? (totalSpent / budgetAmount) * 100 : 0;
    
    return {
      totalSpent,
      budgetAmount,
      percentage
    };
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Family Management</h1>
            <p className="text-muted-foreground">
              Add and manage your family members
            </p>
          </div>
          
          <Button onClick={() => setShowAddChildDialog(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add Family Member
          </Button>
        </div>

        {/* Family Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {children.length > 0 ? (
            children.map((child) => {
              const details = getChildDetails(child);
              
              return (
                <Card key={child.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle>{child.name}</CardTitle>
                          <CardDescription className="truncate max-w-[200px]">
                            {child.email}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant={details.budgetAmount > 0 ? "outline" : "secondary"}>
                        {details.budgetAmount > 0 ? "Budget Set" : "No Budget"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Spent</span>
                        <span className="font-medium">${details.totalSpent.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Budget</span>
                        <span className="font-medium">${details.budgetAmount.toFixed(2)}</span>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Usage</span>
                          <span>{details.percentage.toFixed(0)}%</span>
                        </div>
                        <Progress 
                          value={details.percentage} 
                          className={
                            details.percentage > 100 
                              ? "bg-muted [&>*]:bg-destructive" 
                              : "bg-muted [&>*]:bg-accent"
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      className="w-full gap-2"
                      onClick={() => openBudgetDialog(child)}
                    >
                      <DollarSign className="h-4 w-4" />
                      Set Budget
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })
          ) : (
            <Card className="col-span-full py-8">
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-4">
                  You haven't added any family members yet.
                </p>
                <Button onClick={() => setShowAddChildDialog(true)} className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Add First Family Member
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Child Dialog */}
      <Dialog open={showAddChildDialog} onOpenChange={setShowAddChildDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Family Member</DialogTitle>
            <DialogDescription>
              Add a new child account to your family.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddChild}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="child-name">Name</Label>
                <Input
                  id="child-name"
                  placeholder="Enter name"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="child-email">Email</Label>
                <Input
                  id="child-email"
                  type="email"
                  placeholder="Enter email"
                  value={childEmail}
                  onChange={(e) => setChildEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="child-password">Password</Label>
                <Input
                  id="child-password"
                  type="password"
                  placeholder="Create a password"
                  value={childPassword}
                  onChange={(e) => setChildPassword(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Share these login details with your family member.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowAddChildDialog(false);
                  resetChildForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Add Family Member</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Set Budget Dialog */}
      <Dialog open={showBudgetDialog} onOpenChange={setShowBudgetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Budget</DialogTitle>
            <DialogDescription>
              {selectedChild && `Set a spending budget for ${selectedChild.name}`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSetBudget}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="budget-amount">Budget Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2">$</span>
                  <Input
                    id="budget-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                    className="pl-7"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="budget-period">Budget Period</Label>
                <Select 
                  value={budgetPeriod} 
                  onValueChange={(value) => setBudgetPeriod(value as 'weekly' | 'monthly')}
                >
                  <SelectTrigger id="budget-period">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between space-y-0 pt-2">
                <Label htmlFor="limit-by-category">Limit by Category</Label>
                <Switch
                  id="limit-by-category"
                  checked={limitByCategory}
                  onCheckedChange={setLimitByCategory}
                />
              </div>
              
              {limitByCategory && (
                <div className="space-y-4 pt-2">
                  <p className="text-sm text-muted-foreground">
                    Set spending limits for specific categories:
                  </p>
                  
                  {Object.entries(categoryLimits).map(([category, value]) => (
                    <div key={category} className="grid grid-cols-2 gap-2 items-center">
                      <Label>{category}</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="0.00"
                          value={value}
                          onChange={(e) => setCategoryLimits(prev => ({
                            ...prev,
                            [category]: e.target.value
                          }))}
                          className="pl-7"
                        />
                      </div>
                    </div>
                  ))}
                  
                  <p className="text-xs text-muted-foreground">
                    Leave fields empty for no limit on that category.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowBudgetDialog(false);
                  resetBudgetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Set Budget</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Family;
