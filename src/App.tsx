
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ExpenseProvider } from "./contexts/ExpenseContext";
import RequireAuth from "./components/auth/RequireAuth";
import AppLayout from "./components/layout/AppLayout";

// Pages
import LoginPage from "./pages/auth/Login";
import RegisterPage from "./pages/auth/Register";
import DashboardPage from "./pages/Dashboard";
import ExpensesPage from "./pages/Expenses";
import AnalyticsPage from "./pages/Analytics";
import FamilyPage from "./pages/Family";
import ProfilePage from "./pages/Profile";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ExpenseProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              {/* Protected Routes */}
              <Route element={<RequireAuth />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                
                {/* App Routes */}
                <Route 
                  path="/dashboard" 
                  element={
                    <AppLayout>
                      <DashboardPage />
                    </AppLayout>
                  } 
                />
                <Route 
                  path="/expenses" 
                  element={
                    <AppLayout>
                      <ExpensesPage />
                    </AppLayout>
                  } 
                />
                <Route 
                  path="/analytics" 
                  element={
                    <AppLayout>
                      <AnalyticsPage />
                    </AppLayout>
                  } 
                />
                <Route 
                  path="/family" 
                  element={
                    <AppLayout>
                      <FamilyPage />
                    </AppLayout>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <AppLayout>
                      <ProfilePage />
                    </AppLayout>
                  } 
                />
                <Route 
                  path="/settings" 
                  element={
                    <AppLayout>
                      <SettingsPage />
                    </AppLayout>
                  } 
                />
              </Route>
              
              {/* Catch All */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ExpenseProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
