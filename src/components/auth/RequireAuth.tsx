
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useExpense } from "@/contexts/ExpenseContext";

const RequireAuth = () => {
  const { isAuthenticated, isLoading, currentUser } = useAuth();
  const { fetchExpenses, fetchBudgets } = useExpense();
  const location = useLocation();

  // Log authentication state for debugging
  useEffect(() => {
    console.log("Auth state:", { isAuthenticated, isLoading, userId: currentUser?.id });
  }, [isAuthenticated, isLoading, currentUser]);

  // Fetch data when authentication completes successfully
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      console.log("RequireAuth: User authenticated, fetching data");
      try {
        fetchExpenses();
        fetchBudgets();
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    }
  }, [isAuthenticated, currentUser, fetchExpenses, fetchBudgets]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
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
