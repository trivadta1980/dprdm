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
  {
    title: "Graph Visualization",
    href: "/graph-visualization",
    icon: Network,
  }
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
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
                        <path d="M3 3v18h18"></path>
                        <circle cx="7" cy="17" r="1"></circle>
                        <circle cx="12" cy="12" r="1"></circle>
                        <circle cx="17" cy="7" r="1"></circle>
                        <line x1="7" y1="17" x2="12" y2="12"></line>
                        <line x1="12" y1="12" x2="17" y2="7"></line>
                      </svg>
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
              <MenuItem icon={<Network />} as={Link} to="/graph-visualization">
                Graph Visualization
              </MenuItem>
              <MenuItem icon={<Network />} as={Link} to="/graph-visualization"> {/* Changed icon here */}
                Graph Visualization
              </MenuItem>
// ... rest of the sidebar code ...