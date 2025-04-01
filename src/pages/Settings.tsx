
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, AlertTriangle, MoonIcon, SunIcon, Laptop } from "lucide-react";

const Settings = () => {
  const { currentUser, logout } = useAuth();
  
  // Placeholder preferences (in a real app, these would be stored in a database)
  const [currency, setCurrency] = useState('USD');
  const [theme, setTheme] = useState('system');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [showAccountDeleteDialog, setShowAccountDeleteDialog] = useState(false);

  const handleDeleteAccount = () => {
    // In a real app, this would delete the user account from the database
    // For this demo, we'll just log out
    
    toast.success("Account deleted successfully");
    logout();
  };

  const handleThemeChange = (value: string) => {
    setTheme(value);
    
    // In a real app, we'd update the theme in localStorage or database
    toast.success(`Theme changed to ${value}`);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your app preferences
          </p>
        </div>

        {/* App Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              App Settings
            </CardTitle>
            <CardDescription>
              Customize your app experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Currency */}
            <div className="grid grid-cols-2 items-center gap-4">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR" disabled>EUR (€)</SelectItem>
                  <SelectItem value="GBP" disabled>GBP (£)</SelectItem>
                  <SelectItem value="JPY" disabled>JPY (¥)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Theme */}
            <div className="grid grid-cols-2 items-center gap-4">
              <Label htmlFor="theme">Theme</Label>
              <Select value={theme} onValueChange={handleThemeChange}>
                <SelectTrigger id="theme">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <SunIcon className="h-4 w-4" />
                      <span>Light</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <MoonIcon className="h-4 w-4" />
                      <span>Dark</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center gap-2">
                      <Laptop className="h-4 w-4" />
                      <span>System</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Email Notifications */}
            <div className="flex items-center justify-between space-y-0">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive updates and alerts via email
                </p>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>
              Manage your personal data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Export Data */}
            <div className="flex flex-col space-y-1.5">
              <Label>Export Your Data</Label>
              <p className="text-sm text-muted-foreground">
                Download all your personal data in CSV format
              </p>
              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <Button variant="outline">Export Expenses</Button>
                <Button variant="outline">Export Budget Settings</Button>
              </div>
            </div>

            {/* Delete Account */}
            <div className="flex flex-col space-y-1.5">
              <Label className="text-destructive">Danger Zone</Label>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </p>
              <div className="mt-2">
                <Button 
                  variant="destructive" 
                  onClick={() => setShowAccountDeleteDialog(true)}
                  className="gap-2"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Delete Account
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle>About FamilyFinance</CardTitle>
            <CardDescription>
              App information and credits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Version</span>
              <Badge variant="outline">1.0.0</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Made with</span>
              <span className="text-muted-foreground">React & ShadcnUI</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog
        open={showAccountDeleteDialog}
        onOpenChange={setShowAccountDeleteDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove all of your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;
