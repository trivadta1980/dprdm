import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { EnhancedTooltip } from "@/components/ui/enhanced-tooltip";
import {
  Users,
  UserCog,
  Database,
  GitFork,
  FileJson,
  Laptop2,
  TestTube2,
  ArrowRightLeft,
  LogOut,
  Share2,
  Map,
  CheckSquare,
  Key,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation, isAdmin, hasPermission, allowedRoutes } = useAuth();
  
  // Derive approver status from permissions rather than hardcoded role IDs
  const isApprover = hasPermission('/approvals');

  // Debug logging for user information
  console.log('Sidebar Component - User Info:', {
    username: user?.username,
    roleId: user?.roleId,
    isAdmin,
    isApprover,
    allowedRoutes
  });

  const menuItems = [
    // Admin-only items
    ...(isAdmin ? [
      {
        title: "Manage Users",
        href: "/manage-users",
        icon: Users,
        requiresPermission: true,
        tooltip: "Create, edit, and manage user accounts and permissions"
      },
      {
        title: "Manage Roles",
        href: "/roles",
        icon: UserCog,
        requiresPermission: true,
        tooltip: "Configure role-based access control for users"
      },
    ] : []),
    // Approver-specific items
    ...(isApprover ? [
      {
        title: "Approvals Dashboard",
        href: "/approvals",
        icon: CheckSquare,
        requiresPermission: true,
        tooltip: "Review and approve data mapping submissions"
      },
    ] : []),
    // Common items based on permissions
    {
      title: "Reference Data Types",
      href: "/reference-types",
      icon: FileJson,
      requiresPermission: true,
      tooltip: "Define schemas and formats for reference data"
    },
    {
      title: "Reference Data",
      href: "/reference-data",
      icon: Database,
      requiresPermission: true,
      tooltip: "Manage core reference data sets and instances"
    },
    {
      title: "Relationships",
      href: "/relationships",
      icon: GitFork,
      requiresPermission: true,
      tooltip: "Define and manage relationships between data entities"
    },
    {
      title: "Crosswalks",
      href: "/crosswalks",
      icon: ArrowRightLeft,
      requiresPermission: true,
      tooltip: "Create and manage data mapping between different systems"
    },
    ...(isAdmin ? [
      {
        title: "API Keys",
        href: "/api-keys",
        icon: Key,
        requiresPermission: true,
        tooltip: "Manage API keys for external system integration"
      },
      {
        title: "Testing",
        href: "/api-test",
        icon: TestTube2,
        requiresPermission: true,
        tooltip: "Test and validate API functionality"
      },
      // Temporarily hiding Graph Visualization and Supply Chain Paths as requested
      // {
      //   title: "Graph Visualization",
      //   href: "/graph-visualization",
      //   icon: Share2,
      //   requiresPermission: true,
      // },
      // {
      //   title: "Supply Chain Paths",
      //   href: "/site-paths",
      //   icon: Map,
      //   requiresPermission: true,
      // },
    ] : []),
  ];

  // Debug logging for menu items before filtering
  console.log('Menu Items before filtering:', menuItems.map(item => ({
    title: item.title,
    href: item.href,
    requiresPermission: item.requiresPermission
  })));

  // Filter menu items based on user's role permissions from the hasPermission function
  const filteredMenuItems = menuItems.filter(item => {
    if (!item.requiresPermission) return true;

    // Check if user has permission for this route using hasPermission function
    const itemHasPermission = hasPermission(item.href);

    // Debug logging for each menu item permission check
    console.log(`Permission check for ${item.title}:`, {
      href: item.href,
      roleId: user?.roleId,
      userAllowedRoutes: allowedRoutes,
      hasPermission: itemHasPermission, 
      requiresPermission: item.requiresPermission
    });

    return itemHasPermission;
  });

  // Debug logging for final filtered menu items
  console.log('Filtered Menu Items:', filteredMenuItems.map(item => ({
    title: item.title,
    href: item.href
  })));

  return (
    <div className={cn("pb-12 border-r bg-sidebar h-screen flex flex-col", className)}>
      <div className="space-y-4 py-4 flex-1">
        <div className="px-3 py-2">
          <div className="mb-4 px-4 flex items-center gap-2">
            <Laptop2 className="h-6 w-6 text-primary" />
            <h2 className="text-lg font-semibold">Reference Data Management</h2>
          </div>
          <ScrollArea className="px-1">
            <div className="space-y-1">
              {filteredMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <EnhancedTooltip
                    key={item.href}
                    content={item.tooltip || item.title}
                    side="right"
                    align="center"
                  >
                    <Button
                      variant={location === item.href ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      asChild
                    >
                      <Link href={item.href}>
                        <Icon className="mr-2 h-4 w-4" />
                        {item.title}
                      </Link>
                    </Button>
                  </EnhancedTooltip>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>

      <div className="px-3 py-2">
        <Separator className="my-2" />
        <EnhancedTooltip
          content="Sign out from your account"
          side="right"
          align="center"
        >
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </EnhancedTooltip>
      </div>
    </div>
  );
}