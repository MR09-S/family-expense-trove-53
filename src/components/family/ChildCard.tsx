
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IndianRupee, Edit, User, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ChildCardProps {
  child: {
    id: string;
    name: string;
    email: string;
    totalSpent: number;
    budget: number;
    recentExpenses: any[];
  };
  onEdit: (child: any) => void;
}

export const ChildCard = ({ child, onEdit }: ChildCardProps) => {
  return (
    <Card>
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
          <Button variant="ghost" size="icon" onClick={() => onEdit(child)}>
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
  );
};
