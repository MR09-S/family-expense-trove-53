
import { useState, useEffect } from "react";
import { useAuth, User, UserRole } from "@/contexts/AuthContext";
import { useExpense } from "@/contexts/ExpenseContext";
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from "@/lib/firebase";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Users, UserPlus, MoreVertical, Eye, Edit, Ban } from "lucide-react";

const Family = () => {
  const { currentUser, register } = useAuth();
  const { getUserExpenses, getUserBudget, setBudget } = useExpense();
  
  const [childAccounts, setChildAccounts] = useState<User[]>([]);
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [isSettingBudget, setIsSettingBudget] = useState(false);
  const [selectedChild, setSelectedChild] = useState<User | null>(null);
  
  // Form states
  const [childName, setChildName] = useState("");
  const [childEmail, setChildEmail] = useState("");
  const [childPassword, setChildPassword] = useState("");
  const [budgetAmount, setBudgetAmount] = useState<string>("");
  const [budgetPeriod, setBudgetPeriod] = useState<"weekly" | "monthly">("monthly");
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // Only applicable for parents
    if (currentUser?.role !== "parent") {
      return;
    }
    
    const fetchChildAccounts = async () => {
      try {
        if (!currentUser?.children || currentUser.children.length === 0) {
          setChildAccounts([]);
          return;
        }
        
        const fetchedChildren: User[] = [];
        
        // Fetch each child account
        for (const childId of currentUser.children) {
          try {
            const childDoc = await import('firebase/firestore').then(module => {
              return module.getDoc(module.doc(db, 'users', childId));
            });
            
            if (childDoc.exists()) {
              const childData = childDoc.data();
              fetchedChildren.push({
                id: childId,
                name: childData.name,
                email: childData.email,
                role: childData.role,
                avatar: childData.avatar,
                parentId: childData.parentId,
              });
            }
          } catch (err) {
            console.error(`Error fetching child ${childId}:`, err);
          }
        }
        
        setChildAccounts(fetchedChildren);
      } catch (error) {
        console.error("Error fetching child accounts:", error);
        toast.error("Failed to load family members");
      }
    };
    
    fetchChildAccounts();
  }, [currentUser]);
  
  // Calculate child's spending and budget
  const getChildExpenseData = (childId: string) => {
    const expenses = getUserExpenses(childId);
    const budget = getUserBudget(childId);
    
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const budgetAmount = budget?.amount || 0;
    
    const percentUsed = budgetAmount > 0 ? Math.min((totalSpent / budgetAmount) * 100, 100) : 0;
    
    return {
      totalSpent,
      budgetAmount,
      percentUsed,
      isOverBudget: totalSpent > budgetAmount && budgetAmount > 0,
    };
  };
  
  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast.error("You must be logged in to add a child account");
      return;
    }
    
    if (childPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Register child account
      await register(
        childName,
        childEmail,
        childPassword,
        "child",
        currentUser.id
      );
      
      toast.success("Child account created");
      setIsAddingChild(false);
      
      // Reset form
      setChildName("");
      setChildEmail("");
      setChildPassword("");
      
      // Force refresh of child accounts
      // This should happen automatically through the auth state change
      
    } catch (error: any) {
      toast.error(error.message || "Failed to create child account");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSetBudget = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedChild) {
      toast.error("No child selected");
      return;
    }
    
    const amount = parseFloat(budgetAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    try {
      setBudget(selectedChild.id, amount, budgetPeriod);
      setIsSettingBudget(false);
      setBudgetAmount("");
      
      toast.success(`Budget set for ${selectedChild.name}`);
    } catch (error) {
      toast.error("Failed to set budget");
    }
  };
  
  const openBudgetDialog = (child: User) => {
    setSelectedChild(child);
    const budget = getUserBudget(child.id);
    if (budget) {
      setBudgetAmount(budget.amount.toString());
      setBudgetPeriod(budget.period);
    } else {
      setBudgetAmount("");
      setBudgetPeriod("monthly");
    }
    setIsSettingBudget(true);
  };
  
  // Only parents can access this page
  if (currentUser?.role !== "parent") {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>This page is for parent accounts only.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              You need a parent account to access family management features.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="animate-fade-in">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Family Management</h1>
            <p className="text-muted-foreground">
              Manage your family's accounts and spending limits
            </p>
          </div>
          
          <Button onClick={() => setIsAddingChild(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add Child Account
          </Button>
        </div>
        
        {/* Family Members */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Family Members</CardTitle>
              <CardDescription>Manage child accounts and their spending limits</CardDescription>
            </div>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Parent Account (You) */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={currentUser?.avatar} />
                    <AvatarFallback>{currentUser?.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{currentUser?.name}</p>
                    <p className="text-sm text-muted-foreground">{currentUser?.email}</p>
                  </div>
                </div>
                <Badge>Parent Account</Badge>
              </div>
              
              {/* Child Accounts */}
              {childAccounts.length > 0 ? (
                childAccounts.map((child) => {
                  const { totalSpent, budgetAmount, percentUsed, isOverBudget } = getChildExpenseData(child.id);
                  
                  return (
                    <div 
                      key={child.id} 
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={child.avatar} />
                          <AvatarFallback>{child.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{child.name}</p>
                          <p className="text-sm text-muted-foreground">{child.email}</p>
                        </div>
                      </div>
                      
                      <div className="w-full sm:w-1/3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Budget Usage</span>
                          <span>
                            ${totalSpent.toFixed(2)} / ${budgetAmount.toFixed(2)}
                          </span>
                        </div>
                        <Progress value={percentUsed} className={isOverBudget ? "bg-red-200" : ""} />
                      </div>
                      
                      <div className="flex gap-2 ml-auto">
                        <Button variant="outline" size="sm" onClick={() => openBudgetDialog(child)}>
                          Set Budget
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Account
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Ban className="h-4 w-4 mr-2" />
                              Restrict Access
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>You haven't added any child accounts yet.</p>
                  <p className="mt-2">
                    <Button 
                      variant="link" 
                      onClick={() => setIsAddingChild(true)}
                      className="p-0"
                    >
                      Add a child account
                    </Button> to start managing your family's finances.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <p className="text-sm text-muted-foreground">
              As a parent, you can monitor your children's spending habits and set spending limits.
            </p>
          </CardFooter>
        </Card>
        
        {/* Add Child Dialog */}
        <Dialog open={isAddingChild} onOpenChange={setIsAddingChild}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Child Account</DialogTitle>
              <DialogDescription>
                Create a managed account for your child. You'll have access to their spending data.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddChild}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="childName">Child's Name</Label>
                  <Input
                    id="childName"
                    placeholder="Enter name"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="childEmail">Email</Label>
                  <Input
                    id="childEmail"
                    type="email"
                    placeholder="Enter email"
                    value={childEmail}
                    onChange={(e) => setChildEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="childPassword">Password</Label>
                  <Input
                    id="childPassword"
                    type="password"
                    placeholder="Create password"
                    value={childPassword}
                    onChange={(e) => setChildPassword(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 6 characters long.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddingChild(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Account"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Set Budget Dialog */}
        <Dialog open={isSettingBudget} onOpenChange={setIsSettingBudget}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set Budget</DialogTitle>
              <DialogDescription>
                {selectedChild && `Set a spending budget for ${selectedChild.name}.`}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSetBudget}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="budgetAmount">Budget Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2">$</span>
                    <Input
                      id="budgetAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={budgetAmount}
                      onChange={(e) => setBudgetAmount(e.target.value)}
                      className="pl-7"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Budget Period</Label>
                  <div className="flex gap-4">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="weekly"
                        name="period"
                        className="mr-2"
                        checked={budgetPeriod === "weekly"}
                        onChange={() => setBudgetPeriod("weekly")}
                      />
                      <Label htmlFor="weekly">Weekly</Label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="monthly"
                        name="period"
                        className="mr-2"
                        checked={budgetPeriod === "monthly"}
                        onChange={() => setBudgetPeriod("monthly")}
                      />
                      <Label htmlFor="monthly">Monthly</Label>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSettingBudget(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Set Budget</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Family;
