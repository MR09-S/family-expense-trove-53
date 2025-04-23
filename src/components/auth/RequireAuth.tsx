
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useExpense } from "@/contexts/ExpenseContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const RequireAuth = () => {
  const { isAuthenticated, isLoading, currentUser } = useAuth();
  const { fetchExpenses, fetchBudgets } = useExpense();
  const location = useLocation();
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchAttempted, setFetchAttempted] = useState(false);

  // Log authentication state for debugging
  useEffect(() => {
    console.log("Auth state:", { isAuthenticated, isLoading, userId: currentUser?.id });
  }, [isAuthenticated, isLoading, currentUser]);

  // Fetch data when authentication completes successfully
  useEffect(() => {
    const loadData = async () => {
      if (isAuthenticated && currentUser && !fetchAttempted) {
        console.log("RequireAuth: User authenticated, fetching data");
        setDataLoading(true);
        setError(null);
        setFetchAttempted(true);
        
        try {
          // Add small delay to ensure Firebase auth is fully initialized
          await new Promise(resolve => setTimeout(resolve, 300));
          
          await fetchExpenses();
          await fetchBudgets();
          console.log("RequireAuth: Data fetched successfully");
        } catch (error) {
          console.error("Error fetching initial data:", error);
          setError("Failed to load your data. Please try refreshing the page.");
        } finally {
          setDataLoading(false);
        }
      }
    };
    
    loadData();
  }, [isAuthenticated, currentUser, fetchExpenses, fetchBudgets, fetchAttempted]);

  // Reset fetch attempted when route changes
  useEffect(() => {
    return () => {
      setFetchAttempted(false);
    };
  }, [location.pathname]);

  if (isLoading || dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">{isLoading ? "Authenticating..." : "Loading your data..."}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button 
            onClick={() => {
              setFetchAttempted(false);
              setError(null);
              window.location.reload();
            }}
            className="w-full"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page but save the current location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default RequireAuth;
