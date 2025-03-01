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
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const isAdmin = user?.roleId === 1;

  const menuItems = [
    ...(isAdmin
      ? [
          {
            title: "User Management",
            href: "/manage-users",
            icon: Users,
          },
          {
            title: "Role Management",
            href: "/roles",
            icon: UserCog,
          },
        ]
      : []),
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
  ];

  const filteredMenuItems = menuItems.filter(item => {
    // If no permission required or user is admin, always show the item
    if (!item.requiresPermission || isAdmin) return true;
    
    // Otherwise check if the user has the route in their routes array
    return Array.isArray(user?.routes) && user.routes.includes(item.href);
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