{isAdmin && (
        <>
          <SidebarSection title="Admin">
            <SidebarItem path="/users" icon={<Users className="h-4 w-4" />} title="Users" />
            <SidebarItem path="/reference-types" icon={<ListRestart className="h-4 w-4" />} title="Reference Types" />
            <SidebarItem path="/reference-types-list" icon={<Database className="h-4 w-4" />} title="Types List" />
            <SidebarItem path="/reference-data" icon={<Database className="h-4 w-4" />} title="Reference Data" />
            <SidebarItem path="/api-test" icon={<Bug className="h-4 w-4" />} title="API Test" />
          </SidebarSection>
        </>
      )}