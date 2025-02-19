import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Users, 
  UserCog,
  Database,
  GitCompare,
  GitFork,
  FileJson,
  Laptop2
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.roleId === 1;

  const menuItems = [
    ...(isAdmin
      ? [
          {
            title: "User Management",
            href: "/users",
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
      icon: GitCompare,
      requiresPermission: true,
    },
  ];

  // Filter menu items based on user role and permissions
  const filteredMenuItems = menuItems.filter(item => {
    if (!item.requiresPermission) return true;
    if (isAdmin) return true;
    return user?.routes?.includes(item.href);
  });

  return (
    <div className={cn("pb-12 border-r bg-sidebar", className)}>
      <div className="space-y-4 py-4">
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
    </div>
  );
}