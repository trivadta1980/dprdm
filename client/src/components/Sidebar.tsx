import { FiHome, FiMenu, FiX, FiDatabase, FiUsers, FiSettings, FiGitMerge, FiMap, FiLogOut, FiBarChart2, FiShare2 } from 'react-icons/fi';
import { Home, Settings, Users, Database, GitMerge, GitCompare, LogOut, Mail, UserCog, Server, Network } from "lucide-react";
// ... other imports ...

// ... other code ...

const mainMenuItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: Home,
  },
  {
    title: "Reference Data",
    href: "/reference-data",
    icon: Database,
  },
  {
    title: "Relationships",
    href: "/relationships",
    icon: GitMerge,
  },
  {
    title: "Crosswalks",
    href: "/crosswalks",
    icon: GitCompare,
  },
  
];

// ... other code ...

{/* Admin-only menu items */}
          {isAdmin && (
            <>
              <li className="mt-6 px-3">
                <h2 className="mb-2 text-lg font-semibold tracking-tight">Admin</h2>
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link to="/admin/users">
                      <Users className="mr-2 h-4 w-4" />
                      User Management
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link to="/graph-visualization">
                      <Network className="mr-2 h-4 w-4" />
                      Graph Visualization
                    </Link>
                  </Button>
                </div>
              </li>
            </>
          )}

<MenuItem icon={<FiGitMerge />} as={Link} to="/relationships">
                Relationships
              </MenuItem>
              <MenuItem icon={<FiMap />} as={Link} to="/crosswalks">
                Crosswalks
              </MenuItem>
              {/*Removed Duplicate Graph Visualization Entries */}

// ... rest of the sidebar code ...