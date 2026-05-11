import { Link, useLocation, useRoute } from "wouter";
import { cn } from "@/lib/utils";
import {
  Users,
  Package,
  ShoppingCart,
  CreditCard,
  Banknote,
  Video,
  Settings,
  ShieldCheck,
  UserCircle,
  Coins,
  FolderOpen,
  AlertTriangle,
  Flag,
  X,
  Mail,
  FileText,
  Home,
  HelpCircle,
  Info,
  Shield,
  FileCheck,
  MessageCircle,
  ChevronDown,
  Send,
  Smartphone,
  BookOpen,
  Clock,
  Gift,
  Truck,
  MapPin,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState, useEffect } from "react";

// Types for navigation structure
type NavItem = {
  id: string;
  name: string;
  href?: string;
  icon: any;
  children?: NavItem[];
};

type NavSection = {
  section: string;
  items: NavItem[];
};

const navigationItems: NavSection[] = [
  {
    section: "Overview",
    items: [
      {
        id: "dashboard",
        name: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    section: "User Management",
    items: [
      {
        id: "users",
        name: "Users",
        href: "/admin/users",
        icon: Users,
      },
      {
        id: "pending-approvals",
        name: "Pending Approvals",
        href: "/admin/pending-approvals",
        icon: Clock,
      },
      {
        id: "reported-cases",
        name: "Reported Cases",
        href: "/admin/reported-cases",
        icon: Flag,
      },
    ],
  },
  {
    section: "Commerce",
    items: [
      {
        id: "inventory",
        name: "Inventory",
        href: "/admin/inventory",
        icon: Package,
      },
      {
        id: "orders",
        name: "Orders",
        href: "/admin/orders",
        icon: ShoppingCart,
      },
      {
        id: "disputes",
        name: "Disputes",
        href: "/admin/disputes",
        icon: AlertTriangle,
      },
      {
        id: "transactions",
        name: "Transactions",
        href: "/admin/transactions",
        icon: CreditCard,
      },
      {
        id: "payouts",
        name: "Payouts",
        href: "/admin/payouts",
        icon: Banknote,
      },
    ],
  },
  {
    section: "Platform",
    items: [
      {
        id: "revenue",
        name: "Revenue",
        href: "/admin/application-fees",
        icon: Coins,
      },
      {
        id: "categories",
        name: "Categories",
        href: "/admin/categories",
        icon: FolderOpen,
      },
      {
        id: "shows",
        name: "Shows",
        href: "/admin/shows",
        icon: Video,
      },
      {
        id: "giveaways",
        name: "Giveaways",
        href: "/admin/giveaways",
        icon: Gift,
      },
      {
        id: "shipping-profiles",
        name: "Shipping Profiles",
        href: "/admin/shipping-profiles",
        icon: Truck,
      },
      {
        id: "shipments",
        name: "Shipments",
        href: "/admin/shipments",
        icon: Package,
      },
      {
        id: "referral-logs",
        name: "Referral Logs",
        href: "/admin/referral-logs",
        icon: Users,
      },
      {
        id: "address",
        name: "Business Address",
        href: "/admin/address",
        icon: MapPin,
      },
      {
        id: "emails",
        name: "Emails",
        icon: Mail,
        children: [
          // {
          //   id: "emails-brevo-campaign",
          //   name: "Brevo Campaign",
          //   href: "/admin/email-brevo-campaign",
          //   icon: Send,
          // },
          {
            id: "emails-templates",
            name: "Templates",
            href: "/admin/email-templates",
            icon: FileText,
          },
          {
            id: "emails-bulk",
            name: "Bulk Emails",
            href: "/admin/email-bulk",
            icon: Send,
          },
          {
            id: "emails-settings",
            name: "Settings",
            href: "/admin/email-settings",
            icon: Settings,
          },
        ],
      },
    ],
  },
  {
    section: "Pages",
    items: [
      {
        id: "landing-page",
        name: "Landing Page",
        href: "/admin/pages/landing",
        icon: Home,
      },
      {
        id: "general",
        name: "General",
        href: "/admin/pages/general",
        icon: BookOpen,
      },
      {
        id: "faq",
        name: "FAQ",
        href: "/admin/pages/faq",
        icon: HelpCircle,
      },
      {
        id: "about",
        name: "About Us",
        href: "/admin/pages/about",
        icon: Info,
      },
      {
        id: "privacy",
        name: "Privacy Policy",
        href: "/admin/pages/privacy",
        icon: Shield,
      },
      {
        id: "terms",
        name: "Terms of Service",
        href: "/admin/pages/terms",
        icon: FileCheck,
      },
      {
        id: "contact",
        name: "Contact Us",
        href: "/admin/pages/contact",
        icon: MessageCircle,
      },
    ],
  },
  {
    section: "Account",
    items: [
      {
        id: "profile",
        name: "Profile",
        href: "/admin/profile",
        icon: UserCircle,
      },
      {
        id: "settings",
        name: "Settings",
        href: "/admin/settings",
        icon: Settings,
      },
    ],
  },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Helper function to check if any child is active
const hasActiveChild = (item: NavItem, fullPath: string): boolean => {
  if (item.href) {
    // Check exact match or if fullPath matches the base and contains query params
    if (fullPath === item.href) return true;
    const [basePath, query] = item.href.split('?');
    if (fullPath.startsWith(basePath) && query && fullPath.includes(`?${query}`)) {
      return true;
    }
  }
  if (item.children) {
    return item.children.some(child => hasActiveChild(child, fullPath));
  }
  return false;
};

// Helper function to get initial open state based on active route
const getInitialOpenState = (items: NavSection[]): Record<string, boolean> => {
  const openState: Record<string, boolean> = {};
  const fullPath = window.location.pathname + window.location.search;
  
  const checkItem = (item: NavItem) => {
    if (item.children && hasActiveChild(item, fullPath)) {
      openState[item.id] = true;
      item.children.forEach(checkItem);
    }
  };
  
  items.forEach(section => {
    section.items.forEach(checkItem);
  });
  
  return openState;
};

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const [location, setLocation] = useLocation();
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  // Fetch settings to get the app name
  const { data: settingsData } = useQuery<any>({
    queryKey: ['/api/settings'],
  });

  const settings = settingsData?.data || settingsData;
  const appName = settings?.app_name || 'Admin Panel';

  // Update open state when location changes
  useEffect(() => {
    const initialState = getInitialOpenState(navigationItems);
    setOpenItems(initialState);
  }, [location]);

  // Toggle collapsible item
  const toggleItem = (id: string) => {
    setOpenItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Recursive function to render nav items
  const renderNavItem = (item: NavItem, depth: number = 0): JSX.Element => {
    const Icon = item.icon;
    // Get full URL including query params for accurate matching
    const fullPath = window.location.pathname + window.location.search;
    const isActive = item.href ? fullPath === item.href : false;
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openItems[item.id] || false;
    const hasActiveDescendant = hasActiveChild(item, fullPath);

    // Collapsible item with children
    if (hasChildren) {
      return (
        <Collapsible key={item.id} open={isOpen} onOpenChange={() => toggleItem(item.id)}>
          <CollapsibleTrigger asChild>
            <Button
              variant={hasActiveDescendant ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start",
                hasActiveDescendant && "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary",
                depth > 0 && "pl-8"
              )}
              data-testid={`nav-${item.id}`}
            >
              <Icon className="h-4 w-4 mr-3" />
              <span className="flex-1 text-left">{item.name}</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isOpen && "transform rotate-180"
                )}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-1 mt-1">
              {item.children.map(child => renderNavItem(child, depth + 1))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      );
    }

    // Regular link item
    return (
      <Button
        key={item.id}
        variant={isActive ? "secondary" : "ghost"}
        className={cn(
          "w-full justify-start",
          isActive && "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary",
          depth > 0 && "pl-8",
          depth > 1 && "pl-12"
        )}
        onClick={() => {
          setLocation(item.href!);
          onClose();
        }}
        data-testid={`nav-${item.id}`}
      >
        <Icon className="h-4 w-4 mr-3" />
        {item.name}
      </Button>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          data-testid="sidebar-overlay"
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "flex flex-col w-64 bg-card border-r border-border h-full transition-transform duration-300 ease-in-out",
        "lg:relative lg:translate-x-0",
        "fixed inset-y-0 left-0 z-50",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Mobile Close Button */}
        <div className="lg:hidden flex justify-end p-3 border-b border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            data-testid="button-close-sidebar"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
          {navigationItems.map((group, groupIndex) => (
            <div key={groupIndex}>
              <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {group.section}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => renderNavItem(item))}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </>
  );
}
