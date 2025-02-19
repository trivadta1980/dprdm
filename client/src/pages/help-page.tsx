import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Database, GitFork, History, GitCompare, FileJson, Users, UserCog } from "lucide-react";

export default function HelpPage() {
  const sections = [
    {
      title: "Reference Data Types",
      icon: FileJson,
      description: "Manage the structure and schemas for different types of reference data.",
      features: [
        "Create and manage reference data type definitions",
        "Define custom schemas with multiple fields",
        "View all available reference data types",
        "Edit and update type definitions"
      ]
    },
    {
      title: "Reference Data Management",
      icon: Database,
      description: "Handle reference data instances and their values.",
      features: [
        "Create new reference data sets based on defined types",
        "Add, edit, and delete data instances",
        "View comprehensive list of all reference data",
        "Track changes with detailed audit history",
        "Filter and search through reference data"
      ]
    },
    {
      title: "Relationships",
      icon: GitFork,
      description: "Define and manage relationships between different reference data sets.",
      features: [
        "Create relationships between different data types",
        "Visualize data connections",
        "Maintain data integrity across relationships",
        "Update and manage existing relationships"
      ]
    },
    {
      title: "Crosswalks",
      icon: GitCompare,
      description: "Map and transform data between different reference systems.",
      features: [
        "Create data mappings between systems",
        "Define transformation rules",
        "Maintain version history of mappings",
        "Export and import crosswalk definitions"
      ]
    },
    {
      title: "User Management",
      icon: Users,
      description: "Manage user accounts and access (Admin Only).",
      features: [
        "Create and manage user accounts",
        "Reset user passwords",
        "View user activity and status",
        "Manage user access and permissions"
      ]
    },
    {
      title: "Role Management",
      icon: UserCog,
      description: "Configure user roles and permissions (Admin Only).",
      features: [
        "Create and edit role definitions",
        "Assign permissions to roles",
        "Manage route access for roles",
        "Update role assignments"
      ]
    }
  ];

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto p-6 space-y-8">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">Help Documentation</h1>
          <p className="text-lg text-gray-600">
            Welcome to the Reference Data Management System. This guide provides comprehensive
            information about all available features and functionality.
          </p>
        </div>

        <div className="grid gap-6">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <Card key={index} className="overflow-hidden border-0 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-3 flex-1">
                      <h2 className="text-xl font-semibold text-gray-900">
                        {section.title}
                      </h2>
                      <p className="text-gray-600">{section.description}</p>
                      <ul className="space-y-2">
                        {section.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-center gap-2 text-gray-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}
