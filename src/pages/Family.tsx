
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useExpense } from "@/contexts/ExpenseContext";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { ChildCard } from "@/components/family/ChildCard";
import { EditChildDialog } from "@/components/family/EditChildDialog";
import { AddChildDialog } from "@/components/family/AddChildDialog";

interface ChildData {
  id: string;
  name: string;
  email: string;
  totalSpent: number;
  budget: number;
  recentExpenses: any[];
}

const Family = () => {
  const { currentUser, register, updateProfile } = useAuth();
  const { getUserExpenses, getUserBudget, expenses, budgets } = useExpense();
  
  const [childrenData, setChildrenData] = useState<ChildData[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildData | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBudget, setEditBudget] = useState("");
  const [showAddChildDialog, setShowAddChildDialog] = useState(false);
  const [newChildName, setNewChildName] = useState("");
  const [newChildEmail, setNewChildEmail] = useState("");
  const [newChildPassword, setNewChildPassword] = useState("");

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
          name: `Child ${childId.substring(0, 4)}`,
          email: "child@example.com",
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
      toast.success("Child information updated successfully");
      setShowEditDialog(false);
    } catch (error) {
      console.error("Error updating child:", error);
      toast.error("Failed to update child information");
    }
  };

  const handleCreateChild = async () => {
    if (!currentUser) return;
    
    try {
      await register(newChildName, newChildEmail, newChildPassword, 'child', currentUser.id);
      toast.success("Child account created successfully");
      setShowAddChildDialog(false);
      setNewChildName("");
      setNewChildEmail("");
      setNewChildPassword("");
    } catch (error: any) {
      toast.error(error.message || "Failed to create child account");
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Family Management</h1>
            <p className="text-muted-foreground">
              Monitor and manage your family's expenses
            </p>
          </div>
          <Button onClick={() => setShowAddChildDialog(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Child
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {childrenData.map((child) => (
            <ChildCard 
              key={child.id}
              child={child}
              onEdit={handleEditChild}
            />
          ))}
        </div>

        <EditChildDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          editName={editName}
          editBudget={editBudget}
          onNameChange={setEditName}
          onBudgetChange={setEditBudget}
          onUpdate={handleUpdateChild}
        />

        <AddChildDialog
          open={showAddChildDialog}
          onOpenChange={setShowAddChildDialog}
          name={newChildName}
          email={newChildEmail}
          password={newChildPassword}
          onNameChange={setNewChildName}
          onEmailChange={setNewChildEmail}
          onPasswordChange={setNewChildPassword}
          onSubmit={handleCreateChild}
        />
      </div>
    </div>
  );
};

export default Family;
