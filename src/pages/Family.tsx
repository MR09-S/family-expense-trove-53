import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useExpense } from "@/contexts/ExpenseContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IndianRupee, Edit, User, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ChildData {
  id: string;
  name: string;
  email: string;
  totalSpent: number;
  budget: number;
  recentExpenses: any[];
}

const Family = () => {
  const { currentUser, updateProfile } = useAuth();
  const { getUserExpenses, getUserBudget, expenses, budgets, fetchExpenses, fetchBudgets } = useExpense();
  
  const [childrenData, setChildrenData] = useState<ChildData[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildData | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBudget, setEditBudget] = useState("");

  // Fetch and process children data
  useEffect(() => {
    const loadChildrenData = () => {
      if (currentUser?.role !== 'parent' || !currentUser.children) return;

      const childrenInfo = currentUser.children.map(childId => {
        const childExpenses = getUserExpenses(childId);
        const childBudget = getUserBudget(childId);
        const totalSpent = childExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const recentExpenses = [...childExpenses]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5);

        return {
          id: childId,
          name: `Child ${childId.substring(0, 4)}`, // This should be replaced with actual child name
          email: "child@example.com", // This should be replaced with actual child email
          totalSpent,
          budget: childBudget?.amount || 0,
          recentExpenses
        };
      });

      setChildrenData(childrenInfo);
    };

    loadChildrenData();
  }, [currentUser, getUserExpenses, getUserBudget, expenses, budgets]);

  const handleEditChild = (child: ChildData) => {
    setSelectedChild(child);
    setEditName(child.name);
    setEditBudget(child.budget.toString());
    setShowEditDialog(true);
  };

  const handleUpdateChild = async () => {
    if (!selectedChild) return;

    try {
      // Here you would update the child's information
      // For now we'll just show a success message
      toast.success("Child information updated successfully");
      setShowEditDialog(false);
    } catch (error) {
      console.error("Error updating child:", error);
      toast.error("Failed to update child information");
    }
  };

  if (!currentUser || currentUser.role !== 'parent') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Only parent accounts can access this page.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold">Family Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage your family's expenses
          </p>
        </div>

        {/* Children Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {childrenData.map((child) => (
            <Card key={child.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{child.name}</CardTitle>
                      <CardDescription>{child.email}</CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleEditChild(child)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Monthly Budget</span>
                    <span className="font-medium">{formatCurrency(child.budget)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Spent</span>
                    <span className="font-medium">{formatCurrency(child.totalSpent)}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        child.totalSpent <= child.budget ? 'bg-primary' : 'bg-destructive'
                      }`}
                      style={{ 
                        width: `${Math.min((child.totalSpent / (child.budget || 1)) * 100, 100)}%` 
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Recent Expenses</h4>
                  {child.recentExpenses.length > 0 ? (
                    <div className="space-y-2">
                      {child.recentExpenses.map((expense, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-muted-foreground truncate max-w-[180px]">
                            {expense.description}
                          </span>
                          <span className="font-medium">{formatCurrency(expense.amount)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No recent expenses</p>
                  )}
                </div>
              </CardContent>

              <CardFooter>
                <Button variant="ghost" className="w-full" asChild>
                  <a href={`/expenses?child=${child.id}`}>
                    View All Expenses
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Edit Child Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Child Information</DialogTitle>
              <DialogDescription>
                Update your child's details and budget settings.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="budget">Monthly Budget</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="budget"
                    type="number"
                    value={editBudget}
                    onChange={(e) => setEditBudget(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateChild}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        
      </div>
    </div>
  );
};

export default Family;
