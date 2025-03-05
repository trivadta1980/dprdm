import { FiHome, FiMenu, FiX, FiDatabase, FiUsers, FiSettings, FiGitMerge, FiMap, FiLogOut, FiBarChart2, FiShare2 } from 'react-icons/fi';
// ... other imports ...

// ... other code ...

<MenuItem icon={<FiGitMerge />} as={Link} to="/relationships">
                Relationships
              </MenuItem>
              <MenuItem icon={<FiMap />} as={Link} to="/crosswalks">
                Crosswalks
              </MenuItem>
              <MenuItem icon={<FiShare2 />} as={Link} to="/graph-visualization">
                Graph Visualization
              </MenuItem>
// ... rest of the sidebar code ...