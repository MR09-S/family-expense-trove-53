
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const Register = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"parent" | "child">("parent");
  const [parentId, setParentId] = useState("");
  const [step, setStep] = useState(1);
  const [parentIdLoading, setParentIdLoading] = useState(false);
  const [parentIdError, setParentIdError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    
    try {
      if (role === "child" && parentId) {
        // Verify parent ID exists and is a parent
        const isValidParent = await verifyParentId(parentId);
        
        if (!isValidParent) {
          toast.error("Invalid parent ID. Please check with your parent.");
          return;
        }
      }
      
      await register(name, email, password, role, role === "child" ? parentId : undefined);
      toast.success("Account created successfully!");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Registration failed. Please try again.");
      }
    }
  };

  const verifyParentId = async (id: string) => {
    setParentIdLoading(true);
    setParentIdError("");
    
    try {
      const parentRef = query(
        collection(db, "users"),
        where("role", "==", "parent")
      );
      
      const querySnapshot = await getDocs(parentRef);
      const parentExists = querySnapshot.docs.some(doc => doc.id === id);
      
      if (!parentExists) {
        setParentIdError("Parent ID not found or is not a parent account");
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error verifying parent ID:", error);
      setParentIdError("Error verifying parent ID");
      return false;
    } finally {
      setParentIdLoading(false);
    }
  };

  const handleNextStep = () => {
    if (!name || !email || !password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    setStep(2);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold">FamilyFinance</CardTitle>
          <CardDescription>
            Create an account to manage your family expenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 6 characters long
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="button" className="w-full" onClick={handleNextStep}>
                  Next
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <Label>I am a:</Label>
                  <RadioGroup 
                    value={role} 
                    onValueChange={(value) => setRole(value as "parent" | "child")}
                    className="flex flex-col space-y-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="parent" id="parent" />
                      <Label htmlFor="parent" className="cursor-pointer">Parent (I manage the finances)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="child" id="child" />
                      <Label htmlFor="child" className="cursor-pointer">Child (I report to a parent)</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                {role === "child" && (
                  <div className="space-y-2">
                    <Label htmlFor="parentId">Parent's ID</Label>
                    <Input
                      id="parentId"
                      placeholder="Ask your parent for their ID"
                      value={parentId}
                      onChange={(e) => {
                        setParentId(e.target.value);
                        setParentIdError("");
                      }}
                    />
                    {parentIdError && (
                      <p className="text-xs text-red-500">{parentIdError}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      This connects your account to your parent's account
                    </p>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1" 
                    disabled={isLoading || (role === "child" && !parentId) || parentIdLoading}
                  >
                    {isLoading || parentIdLoading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </span>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </div>
              </>
            )}
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Register;
