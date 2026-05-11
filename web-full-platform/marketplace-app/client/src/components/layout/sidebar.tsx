import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  CreditCard,
  MapPin,
  Lock,
  AlertTriangle,
  MessageSquare,
  Store,
  Package,
  Box,
  Truck,
  Package2,
  Receipt,
  Banknote,
  ChevronLeft,
  ChevronRight,
  Video,
  BookOpen,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import { useQuery } from "@tanstack/react-query";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ isCollapsed, onToggle, isMobileOpen = false, onMobileClose }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { settings } = useSettings();
  
  const userId = (user as any)?._id || user?.id;
  
  // Fetch fresh user data to check current seller status
  const { data: freshUserData } = useQuery<any>({
    queryKey: [`/api/profile/${userId}`],
    enabled: !!userId,
    staleTime: 0, // Always fetch fresh data
  });
  
  // Use fresh user data if available, otherwise fall back to cached user
  const currentUser = freshUserData || user;

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (currentUser?.firstName && currentUser?.lastName) {
      return `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase();
    }
    if (currentUser?.firstName) {
      return currentUser.firstName[0].toUpperCase();
    }
    if (currentUser?.email) {
      return currentUser.email[0].toUpperCase();
    }
    return 'U';
  };

  const generalItems = [
    { name: "Payments", href: "/payments", icon: CreditCard },
    { name: "Transactions", href: "/transactions", icon: Receipt },
    { name: "Addresses", href: "/addresses", icon: MapPin },
    // { name: "Account", href: "/account", icon: Lock },
  ];

  const sellingItems = [
    { name: "Shows", href: "/live-shows", icon: Video },
    { name: "Orders", href: "/orders", icon: Package },
    { name: "Offers", href: "/offers", icon: Tag },
    { name: "Inventory", href: "/inventory", icon: Box },
    { name: "Shipments", href: "/shipping", icon: Truck },
    { name: "Payouts", href: "/payouts", icon: Banknote },
    { name: "Shipping Profiles", href: "/shipping-profiles", icon: Package2 },
  ];

  const buyingItems: { name: string; href: string; icon: any }[] = [];

  const helpItems = [
    { name: "Knowledge Base", href: "/knowledge-base", icon: BookOpen },
    { name: "User Reports", href: "/reports", icon: AlertTriangle },
    { name: "Contact Us", href: "/contact", icon: MessageSquare },
  ];

  // Sidebar content component (reused for desktop and mobile)
  const SidebarContent = () => (
    <div className="flex flex-col flex-grow overflow-y-auto">
      {/* Profile Section */}
      <div className="px-4 py-6" data-testid="user-profile">
        <div className="flex items-center gap-3">
          <Avatar className="h-14 w-14">
            <AvatarImage src={currentUser?.profilePhoto} alt={currentUser?.userName || currentUser?.email} />
            <AvatarFallback className="bg-teal-500 text-white text-lg font-bold">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-foreground truncate">
              {currentUser?.userName || `${currentUser?.firstName} ${currentUser?.lastName}`.trim() || 'User'}
            </p>
            <button 
              className="text-sm text-primary hover:underline" 
              data-testid="link-view-profile"
              onClick={() => {
                if (onMobileClose) {
                  onMobileClose();
                  setTimeout(() => setLocation('/profile-view'), 150);
                } else {
                  setLocation('/profile-view');
                }
              }}
            >
              View profile
            </button>
          </div>
        </div>
      </div>

      {/* Buying Section - only show if there are items */}
      {buyingItems.length > 0 && (
        <>
          <Separator />
          <div className="px-4 py-4">
            <h2 className="text-lg font-semibold text-foreground mb-3">Buying</h2>
            <nav className="space-y-1" data-testid="nav-buying">
              {buyingItems.map((item) => {
                const isActive = location === item.href;
                return (
                  <button
                    key={item.name}
                    type="button"
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors cursor-pointer w-full text-left",
                      isActive
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                    data-testid={`nav-${item.name.toLowerCase().replace(" ", "-")}`}
                    onClick={() => {
                      if (onMobileClose) {
                        onMobileClose();
                        setTimeout(() => setLocation(item.href), 150);
                      } else {
                        setLocation(item.href);
                      }
                    }}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </>
      )}

      {/* Selling Section (for sellers only) */}
      {currentUser?.seller && (
        <>
          <Separator />
          <div className="px-4 py-4">
            <h2 className="text-lg font-semibold text-foreground mb-3">Selling</h2>
            <nav className="space-y-1" data-testid="nav-selling">
              {sellingItems.map((item) => {
                const isActive = location === item.href;
                return (
                  <button
                    key={item.name}
                    type="button"
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors cursor-pointer w-full text-left",
                      isActive
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                    data-testid={`nav-${item.name.toLowerCase().replace(" ", "-")}`}
                    onClick={() => {
                      if (onMobileClose) {
                        onMobileClose();
                        setTimeout(() => setLocation(item.href), 150);
                      } else {
                        setLocation(item.href);
                      }
                    }}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </>
      )}

      <Separator />

      {/* General Section */}
      <div className="px-4 py-4">
        <h2 className="text-lg font-semibold text-foreground mb-3">General</h2>
        <nav className="space-y-1" data-testid="nav-general">
          {generalItems.map((item) => {
            const isActive = location === item.href;
            return (
              <button
                key={item.name}
                type="button"
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors cursor-pointer w-full text-left",
                  isActive
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                data-testid={`nav-${item.name.toLowerCase().replace(" ", "-")}`}
                onClick={() => {
                  if (onMobileClose) {
                    onMobileClose();
                    setTimeout(() => setLocation(item.href), 150);
                  } else {
                    setLocation(item.href);
                  }
                }}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <Separator />

      {/* Help & Legal Section */}
      <div className="px-4 py-4">
        <h2 className="text-lg font-semibold text-foreground mb-3">Help & Legal</h2>
        <nav className="space-y-1" data-testid="nav-help">
          {helpItems.map((item) => {
            const isActive = location === item.href;
            return (
              <button
                key={item.name}
                type="button"
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors cursor-pointer w-full text-left",
                  isActive
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                data-testid={`nav-${item.name.toLowerCase().replace(" ", "-")}`}
                onClick={() => {
                  if (onMobileClose) {
                    onMobileClose();
                    setTimeout(() => setLocation(item.href), 150);
                  } else {
                    setLocation(item.href);
                  }
                }}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );

  if (isCollapsed) {
    return (
      <div className="hidden lg:flex lg:flex-col lg:w-16 transition-all duration-300 bg-background border-r border-border">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto">
          {/* Collapsed Toggle */}
          <div className="flex items-center justify-center px-2" data-testid="logo-container">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="flex-shrink-0"
              data-testid="button-toggle-sidebar"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 transition-all duration-300 bg-background border-r border-border">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={isMobileOpen} onOpenChange={(open) => !open && onMobileClose?.()}>
        <SheetContent side="left" className="w-64 p-0 lg:hidden overflow-hidden flex flex-col">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  );
}
