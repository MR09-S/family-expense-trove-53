
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PieChart, 
  DollarSign, 
  Users, 
  Settings, 
  User,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

interface NavItemProps {
  icon: React.ElementType;
  text: string;
  active?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, text, active, onClick }) => {
  return (
    <li>
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start gap-3 bg-transparent hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all", 
          active && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
        )}
        onClick={onClick}
      >
        <Icon className="h-5 w-5" />
        <span>{text}</span>
      </Button>
    </li>
  );
};

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  useEffect(() => {
    // Close sidebar when route changes on mobile
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  if (!currentUser) {
    // Redirect to login if not authenticated
    return <>{children}</>;
  }

  const navItems = [
    {
      icon: LayoutDashboard,
      text: 'Dashboard',
      path: '/dashboard',
      showFor: ['parent', 'child']
    },
    {
      icon: DollarSign,
      text: 'Expenses',
      path: '/expenses',
      showFor: ['parent', 'child']
    },
    {
      icon: PieChart,
      text: 'Analytics',
      path: '/analytics',
      showFor: ['parent', 'child']
    },
    {
      icon: Users,
      text: 'Family',
      path: '/family',
      showFor: ['parent']
    },
    {
      icon: User,
      text: 'Profile',
      path: '/profile',
      showFor: ['parent', 'child']
    },
    {
      icon: Settings,
      text: 'Settings',
      path: '/settings',
      showFor: ['parent', 'child']
    }
  ];

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(item => 
    item.showFor.includes(currentUser.role)
  );

  const isPathActive = (path: string) => location.pathname === path;

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full text-sidebar-foreground">
      <div className="p-6">
        <h1 className="text-2xl font-bold">FamilyFinance</h1>
      </div>
      
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {filteredNavItems.map((item, index) => (
            <NavItem
              key={index}
              icon={item.icon}
              text={item.text}
              active={isPathActive(item.path)}
              onClick={() => navigate(item.path)}
            />
          ))}
        </ul>
      </nav>
      
      <div className="p-3 border-t border-sidebar-border mt-auto">
        <div className="flex items-center gap-3 mb-3 px-3 py-2">
          <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center">
            {currentUser.avatar ? (
              <img 
                src={currentUser.avatar} 
                alt={currentUser.name} 
                className="h-full w-full rounded-full object-cover" 
              />
            ) : (
              <span className="text-lg font-medium">
                {currentUser.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="overflow-hidden">
            <p className="font-medium truncate">{currentUser.name}</p>
            <p className="text-xs text-sidebar-foreground/70 truncate capitalize">{currentUser.role}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={logout}
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen">
      {isMobile ? (
        <>
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                size="icon"
                className="fixed top-4 left-4 z-40 md:hidden"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <line x1="4" x2="20" y1="12" y2="12"/>
                  <line x1="4" x2="20" y1="6" y2="6"/>
                  <line x1="4" x2="20" y1="18" y2="18"/>
                </svg>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0 bg-sidebar">
              {renderSidebarContent()}
            </SheetContent>
          </Sheet>
        </>
      ) : (
        <aside className="w-64 bg-sidebar h-full hidden md:block overflow-y-auto">
          {renderSidebarContent()}
        </aside>
      )}

      <main className="flex-1 overflow-y-auto bg-background">
        {isMobile && <div className="h-16"></div>} {/* Space for mobile menu button */}
        <div className="container mx-auto px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
