
import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserIcon, Camera, Save } from "lucide-react";

const Profile = () => {
  const { currentUser, updateProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState(currentUser?.name || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(currentUser?.avatar);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email) {
      toast.error("Name and email are required");
      return;
    }
    
    let avatarDataUrl = currentUser?.avatar;
    
    // Process avatar if selected
    if (avatarFile) {
      // In a real app, we would upload the file to a storage service
      // For this demo, we'll convert it to a data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          updateProfile({
            name,
            email,
            avatar: reader.result
          });
        }
      };
      reader.readAsDataURL(avatarFile);
    } else {
      // Update without changing avatar
      updateProfile({
        name,
        email,
        avatar: avatarDataUrl
      });
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Preview image
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Save file for later upload
      setAvatarFile(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Get user's ID to share with children
  const userId = currentUser?.id || '';

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground">
            Manage your account settings
          </p>
        </div>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="details">Account Details</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>
          
          {/* Account Details Tab */}
          <TabsContent value="details">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Avatar Card */}
              <Card className="col-span-1 md:row-span-2">
                <CardHeader>
                  <CardTitle>Profile Picture</CardTitle>
                  <CardDescription>
                    Update your profile photo
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <div className="relative mb-6 group">
                    <Avatar className="h-32 w-32">
                      <AvatarImage src={avatarPreview} />
                      <AvatarFallback className="text-4xl">
                        {name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div 
                      className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      onClick={triggerFileInput}
                    >
                      <Camera className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    accept="image/*"
                    className="hidden"
                  />
                  
                  <Button 
                    variant="outline" 
                    className="w-full gap-2"
                    onClick={triggerFileInput}
                  >
                    <Camera className="h-4 w-4" />
                    Change Picture
                  </Button>
                </CardContent>
              </Card>

              {/* Account Details Card */}
              <Card className="col-span-1 md:col-span-2">
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>
                    Update your personal details
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleUpdateProfile}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Account Type</Label>
                      <div className="flex items-center gap-2 h-10 px-3 border rounded-md">
                        <UserIcon className="h-4 w-4" />
                        <span className="capitalize">{currentUser?.role || "User"}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button type="submit" className="gap-2">
                      <Save className="h-4 w-4" />
                      Save Changes
                    </Button>
                  </CardFooter>
                </form>
              </Card>

              {/* Account ID Card (for parents) */}
              {currentUser?.role === 'parent' && (
                <Card className="col-span-1 md:col-span-2">
                  <CardHeader>
                    <CardTitle>Your Parent ID</CardTitle>
                    <CardDescription>
                      Share this ID with your children for linking accounts
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted p-3 rounded-md flex items-center justify-between">
                      <code className="text-sm font-mono">{userId}</code>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(userId);
                          toast.success("ID copied to clipboard");
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          
          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Manage your notification settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Notification preferences will be available in a future update.
                </p>
              </CardContent>
              <CardFooter>
                <Badge variant="outline">Coming Soon</Badge>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
