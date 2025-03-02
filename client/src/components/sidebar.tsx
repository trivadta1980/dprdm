import { Home, Users, Database, GitCompare, Layers, Box, ClipboardList, Settings, TestTube, Bug } from 'lucide-react';

// ... rest of the imports ...

function Sidebar() {
  const isAdmin = /* ... some logic to determine admin status ... */;

  return (
    <aside className="bg-gray-800 text-white w-64">
      {/* ... other sidebar items ... */}
      {isAdmin && (
        <>
          <SidebarItem
            icon={<TestTube className="h-4 w-4" />}
            text="API Test Tool"
            href="/api-test"
          />
          <SidebarItem
            icon={<Bug className="h-4 w-4" />}
            text="Debug Panel"
            href="/debug"
          />
        </>
      )}
      {/* ... rest of the sidebar items ... */}
    </aside>
  );
}


// ... rest of the component ...