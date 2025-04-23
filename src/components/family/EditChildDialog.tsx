
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
import { IndianRupee } from "lucide-react";

interface EditChildDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editName: string;
  editBudget: string;
  onNameChange: (value: string) => void;
  onBudgetChange: (value: string) => void;
  onUpdate: () => void;
}

export const EditChildDialog = ({
  open,
  onOpenChange,
  editName,
  editBudget,
  onNameChange,
  onBudgetChange,
  onUpdate,
}: EditChildDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              onChange={(e) => onNameChange(e.target.value)}
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
                onChange={(e) => onBudgetChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onUpdate}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
