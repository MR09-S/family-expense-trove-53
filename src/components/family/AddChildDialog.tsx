
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

interface AddChildDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  email: string;
  password: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
}

export const AddChildDialog = ({
  open,
  onOpenChange,
  name,
  email,
  password,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: AddChildDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Child Account</DialogTitle>
          <DialogDescription>
            Create a new child account linked to your family.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="childName">Name</Label>
            <Input
              id="childName"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Child's name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="childEmail">Email</Label>
            <Input
              id="childEmail"
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="Child's email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="childPassword">Password</Label>
            <Input
              id="childPassword"
              type="password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="Create a password"
            />
            <p className="text-xs text-muted-foreground">
              Password must be at least 6 characters long
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={onSubmit}
            disabled={!name || !email || password.length < 6}
          >
            Create Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
