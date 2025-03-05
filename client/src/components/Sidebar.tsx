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

<MenuItem icon={<FiGitMerge />} as={Link} to="/relationships">
                Relationships
              </MenuItem>
              <MenuItem icon={<FiMap />} as={Link} to="/crosswalks">
                Crosswalks
              </MenuItem>
              <MenuItem icon={<Network />} as={Link} to="/graph-visualization"> {/* Changed icon here */}
                Graph Visualization
              </MenuItem>
// ... rest of the sidebar code ...