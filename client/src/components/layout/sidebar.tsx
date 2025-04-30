import { useState } from "react";
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
  Share2,
  Map,
  CheckSquare,
  Key,
  History,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { LucideIcon } from "lucide-react";

interface SidebarProps {
  className?: string;
}

interface MenuItem {
  title: string;
  href?: string;
  icon: LucideIcon;
  requiresPermission: boolean;
  tooltip?: string;
  type?: 'section' | 'item';
  children?: MenuItem[];
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user, isAdmin, hasPermission, allowedRoutes } = useAuth();
  
  // State for collapsible sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    userManagement: false  // User Management section starts collapsed
  });
  
  // Function to toggle a section's expanded state
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };
  
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
        title: "Audit Logs",
        href: "/audit-logs",
        icon: History,
        requiresPermission: true,
        tooltip: "View system audit trail and change history"
      },
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
      // User Management section moved to bottom
      {
        title: "User Management",
        icon: Users,
        type: "section",
        requiresPermission: true,
        tooltip: "User and role management options",
        children: [
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
        ]
      },
    ] : []),
  ];

  // Debug logging for menu items before filtering
  console.log('Menu Items before filtering:', menuItems.map(item => ({
    title: item.title,
    href: item.href,
    requiresPermission: item.requiresPermission
  })));

  // Filter menu items based on user's role permissions
  const filteredMenuItems = menuItems.filter(item => {
    if (!item.requiresPermission) return true;
    
    if (item.type === 'section' && item.children) {
      // For sections, check if any children have permission
      const hasChildWithPermission = item.children.some(child => 
        child.href !== undefined && hasPermission(child.href)
      );
      
      if (hasChildWithPermission) {
        // Filter the children array to only include items with permission
        item.children = item.children.filter(child => 
          child.href !== undefined && hasPermission(child.href)
        );
        return true;
      }
      return false;
    }
    
    // For regular items, check permission directly
    // Skip check if href is not defined
    if (item.href === undefined) return false;
    
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
  console.log('Filtered Menu Items:', filteredMenuItems.map(item => {
    if (item.type === 'section' && item.children) {
      return {
        title: item.title,
        type: 'section',
        children: item.children.map(c => ({ title: c.title, href: c.href }))
      };
    }
    return {
      title: item.title,
      href: item.href
    };
  }));

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
              {filteredMenuItems.map((item, index) => {
                const Icon = item.icon;
                
                // If it's a section with children
                if (item.type === 'section' && item.children && item.children.length > 0) {
                  // Get section ID based on title (for use with expandedSections state)
                  const sectionId = item.title.toLowerCase().replace(/\s+/g, '');
                  const isExpanded = expandedSections[sectionId];
                  
                  return (
                    <div key={`section-${index}`} className="mb-2">
                      {/* Clickable section header */}
                      <Button
                        variant="ghost"
                        className="w-full justify-between px-2 py-1.5 text-sm font-semibold text-muted-foreground hover:bg-muted/50"
                        onClick={() => toggleSection(sectionId)}
                      >
                        <div className="flex items-center">
                          <Icon className="mr-2 h-4 w-4" />
                          {item.title}
                        </div>
                        {isExpanded ? 
                          <ChevronDown className="h-4 w-4" /> : 
                          <ChevronRight className="h-4 w-4" />
                        }
                      </Button>
                      
                      {/* Section children indented - only show when expanded */}
                      {isExpanded && (
                        <div className="ml-4 space-y-1 mt-1">
                          {item.children.map((child) => {
                            const ChildIcon = child.icon;
                            return (
                              <EnhancedTooltip
                                key={child.href}
                                content={child.tooltip || child.title}
                                side="right"
                                align="center"
                              >
                                <Button
                                  variant={location === child.href ? "secondary" : "ghost"}
                                  className="w-full justify-start"
                                  asChild
                                >
                                  <Link href={child.href}>
                                    <ChildIcon className="mr-2 h-4 w-4" />
                                    {child.title}
                                  </Link>
                                </Button>
                              </EnhancedTooltip>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }
                
                // For regular menu items
                return (
                  <EnhancedTooltip
                    key={item.href || `item-${index}`}
                    content={item.tooltip || item.title}
                    side="right"
                    align="center"
                  >
                    <Button
                      variant={location === item.href ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      asChild={!!item.href}
                    >
                      {item.href ? (
                        <Link href={item.href}>
                          <Icon className="mr-2 h-4 w-4" />
                          {item.title}
                        </Link>
                      ) : (
                        <>
                          <Icon className="mr-2 h-4 w-4" />
                          {item.title}
                        </>
                      )}
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
      </div>
    </div>
  );
}