import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users,
  Database,
  List,
  GitBranch,
  ArrowLeftRight,
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();

  const menuItems = [
    {
      title: "User Management",
      href: "/users",
      icon: Users,
    },
    {
      title: "Reference Data Types",
      href: "/reference-types",
      icon: Database,
    },
    {
      title: "Reference Data",
      href: "/reference-data",
      icon: List,
    },
    {
      title: "Relationships",
      href: "/relationships",
      icon: GitBranch,
    },
    {
      title: "Crosswalks",
      href: "/crosswalks",
      icon: ArrowLeftRight,
    },
  ];

  return (
    <div className={cn("pb-12 border-r bg-sidebar", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold">Management Console</h2>
          <ScrollArea className="px-1">
            <div className="space-y-1">
              {menuItems.map((item) => {
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
