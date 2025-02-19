import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Database, GitFork, History, GitCompare, FileJson, Users, UserCog, ListTree, Library, Plus, Edit, Table2 } from "lucide-react";

export default function HelpPage() {
  const sections = [
    {
      title: "Reference Data Types",
      icon: FileJson,
      description: "Define and manage the structure of your reference data.",
      features: [
        {
          title: "Creating a New Type",
          icon: Plus,
          steps: [
            "Navigate to Reference Data Types page",
            "Click 'New Type' button",
            "Enter type name and description",
            "Define schema fields (e.g., name, code, description)",
            "Save the type definition"
          ]
        },
        {
          title: "Managing Schemas",
          icon: ListTree,
          steps: [
            "Each type can have multiple schema fields",
            "Fields support various data types (text, number, date)",
            "Fields can be marked as required",
            "Schemas ensure data consistency"
          ]
        }
      ]
    },
    {
      title: "Reference Data Management",
      icon: Database,
      description: "Create and manage reference data instances based on defined types.",
      features: [
        {
          title: "Creating Data Sets",
          icon: Library,
          steps: [
            "Go to Reference Data page",
            "Click 'New Data Set' button",
            "Select a reference type",
            "Fill in basic information",
            "Start adding instances"
          ]
        },
        {
          title: "Managing Instances",
          icon: Table2,
          steps: [
            "Click 'Manage Instances' on a data set",
            "Add new instances with the 'Add' button",
            "Edit existing instances using the edit icon",
            "View change history for each instance",
            "Delete instances when needed"
          ]
        },
        {
          title: "Tracking Changes",
          icon: History,
          steps: [
            "Every change is automatically tracked",
            "View history by clicking the history icon",
            "See who made changes and when",
            "Compare old and new values"
          ]
        }
      ]
    },
    {
      title: "Relationships",
      icon: GitFork,
      description: "Define and visualize connections between different reference data sets.",
      features: [
        {
          title: "Creating Relationships",
          icon: Plus,
          steps: [
            "Navigate to Relationships page",
            "Select source and target data sets",
            "Define relationship type",
            "Specify cardinality",
            "Map related fields"
          ]
        },
        {
          title: "Viewing Relationships",
          icon: ListTree,
          steps: [
            "Interactive relationship diagram",
            "Filter by data set or type",
            "Export relationship mappings",
            "Track relationship changes"
          ]
        }
      ]
    },
    {
      title: "Crosswalks",
      icon: GitCompare,
      description: "Map and transform data between different reference systems.",
      features: [
        {
          title: "Creating Mappings",
          icon: Edit,
          steps: [
            "Access Crosswalks page",
            "Select source and target systems",
            "Define field mappings",
            "Set transformation rules",
            "Validate mappings"
          ]
        },
        {
          title: "Using Crosswalks",
          icon: GitFork,
          steps: [
            "Import data using defined mappings",
            "Transform data between systems",
            "Validate transformed data",
            "Track transformation history"
          ]
        }
      ]
    }
  ];

  const adminSections = [
    {
      title: "User Management",
      icon: Users,
      description: "Manage user accounts and access (Admin Only).",
      features: [
        {
          title: "Managing Users",
          icon: Plus,
          steps: [
            "Create new user accounts",
            "Set initial passwords",
            "Assign roles and permissions",
            "Enable/disable accounts",
            "Reset user passwords"
          ]
        }
      ]
    },
    {
      title: "Role Management",
      icon: UserCog,
      description: "Configure user roles and permissions (Admin Only).",
      features: [
        {
          title: "Managing Roles",
          icon: Edit,
          steps: [
            "Create and edit roles",
            "Define permission sets",
            "Assign route access",
            "Update role assignments",
            "Review role permissions"
          ]
        }
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
            information about all features and functionality.
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
                    <div className="space-y-4 flex-1">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                          {section.title}
                        </h2>
                        <p className="text-gray-600 mt-1">{section.description}</p>
                      </div>

                      <div className="grid gap-6 mt-4">
                        {section.features.map((feature, featureIndex) => {
                          const FeatureIcon = feature.icon;
                          return (
                            <div key={featureIndex} className="space-y-3">
                              <div className="flex items-center gap-2">
                                <FeatureIcon className="h-5 w-5 text-primary" />
                                <h3 className="font-medium text-gray-800">{feature.title}</h3>
                              </div>
                              <ul className="space-y-2 ml-7">
                                {feature.steps.map((step, stepIndex) => (
                                  <li key={stepIndex} className="flex items-center gap-2 text-gray-700">
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                                    {step}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Administrative Features</h2>
            <div className="grid gap-6">
              {adminSections.map((section, index) => {
                const Icon = section.icon;
                return (
                  <Card key={index} className="overflow-hidden border-0 shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-4 flex-1">
                          <div>
                            <h2 className="text-xl font-semibold text-gray-900">
                              {section.title}
                            </h2>
                            <p className="text-gray-600 mt-1">{section.description}</p>
                          </div>

                          <div className="grid gap-6 mt-4">
                            {section.features.map((feature, featureIndex) => {
                              const FeatureIcon = feature.icon;
                              return (
                                <div key={featureIndex} className="space-y-3">
                                  <div className="flex items-center gap-2">
                                    <FeatureIcon className="h-5 w-5 text-primary" />
                                    <h3 className="font-medium text-gray-800">{feature.title}</h3>
                                  </div>
                                  <ul className="space-y-2 ml-7">
                                    {feature.steps.map((step, stepIndex) => (
                                      <li key={stepIndex} className="flex items-center gap-2 text-gray-700">
                                        <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                                        {step}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}