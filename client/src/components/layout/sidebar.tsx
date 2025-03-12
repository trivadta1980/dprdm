import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface SidebarProps {
  className?: string;
}

// Role-based permission mapping
const rolePermissions: Record<number, string[]> = {
  1: ['/manage-users', '/roles', '/reference-types', '/reference-data', '/relationships', '/crosswalks', '/api-test', '/graph-visualization', '/site-paths'], // Admin
  2: ['/reference-types', '/reference-data', '/relationships', '/crosswalks', '/approvals'], // Approver
  3: ['/reference-data', '/relationships'], // Basic User
};

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const isAdmin = user?.roleId === 1;

  const menuItems = [
    ...(isAdmin ? [
      {
        title: "Manage Users",
        href: "/manage-users",
        icon: Users,
        requiresPermission: true,
      },
      {
        title: "Manage Roles",
        href: "/roles",
        icon: UserCog,
        requiresPermission: true,
      },
    ] : []),
    {
      title: "Reference Data Types",
      href: "/reference-types",
      icon: FileJson,
      requiresPermission: true,
    },
    {
      title: "Reference Data",
      href: "/reference-data",
      icon: Database,
      requiresPermission: true,
    },
    {
      title: "Relationships",
      href: "/relationships",
      icon: GitFork,
      requiresPermission: true,
    },
    {
      title: "Crosswalks",
      href: "/crosswalks",
      icon: ArrowRightLeft,
      requiresPermission: true,
    },
    {
      title: "API Testing",
      href: "/api-test",
      icon: TestTube2,
      requiresPermission: true,
    },
    {
      title: "Graph Visualization",
      href: "/graph-visualization",
      icon: Share2,
      requiresPermission: true,
    },
    {
      title: "Supply Chain Paths",
      href: "/site-paths",
      icon: Map,
      requiresPermission: true,
    },
  ];

  // Filter menu items based on user's role permissions
  const filteredMenuItems = menuItems.filter(item => {
    if (!item.requiresPermission || isAdmin) return true;
    const userRolePermissions = rolePermissions[user?.roleId || 3] || [];
    return userRolePermissions.includes(item.href);
  });

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
                  <Button
                    key={item.href}
                    variant={location === item.href ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    asChild
                  >
                    <Link href={item.href}>
                      <Icon className="mr-2 h-4 w-4" />
                      {item.title}
                    </Link>
                  </Button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>

      <div className="px-3 py-2">
        <Separator className="my-2" />
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}