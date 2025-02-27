import { useAuth } from "@/hooks/use-auth";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import {
  Database,
  GitFork,
  ArrowRightLeft,
  FileJson,
  BookOpen,
  Clock,
  ChevronRight,
  BarChart3
} from "lucide-react";
import { useLocation } from "wouter";

export default function HomePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch metrics from real API endpoint
  const { data: metrics } = useQuery({
    queryKey: ['/api/metrics'],
  });

  // Fetch recent activity
  const { data: recentActivity } = useQuery({
    queryKey: ['/api/recent-activity'],
  });

  const quickActions = [
    {
      title: "Reference Data Management",
      description: "Create and manage reference data types and instances",
      icon: Database,
      href: "/reference-data",
      color: "text-blue-600"
    },
    {
      title: "Crosswalks",
      description: "Map and transform data between different systems",
      icon: ArrowRightLeft,
      href: "/crosswalks",
      color: "text-purple-600"
    },
    {
      title: "Relationships",
      description: "Define and visualize data relationships",
      icon: GitFork,
      href: "/relationships",
      color: "text-green-600"
    },
    {
      title: "Data Types",
      description: "Manage reference data type definitions",
      icon: FileJson,
      href: "/reference-types",
      color: "text-orange-600"
    }
  ];

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-8">
          <div className="max-w-4xl">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to Reference Data Management
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Streamline your data mapping and transformation workflows with our comprehensive toolset.
            </p>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card 
                className="cursor-pointer hover:shadow-md transition-all group"
                onClick={() => setLocation('/reference-data')}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="text-2xl font-bold group-hover:text-blue-600 transition-colors">{metrics?.totalDatasets ?? '—'}</p>
                      <p className="text-sm text-gray-500 group-hover:text-blue-500 transition-colors">Total Datasets</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card 
                className="cursor-pointer hover:shadow-md transition-all group"
                onClick={() => setLocation('/reference-types')}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <FileJson className="h-5 w-5 text-purple-600 group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="text-2xl font-bold group-hover:text-purple-600 transition-colors">{metrics?.totalDataTypes ?? '—'}</p>
                      <p className="text-sm text-gray-500 group-hover:text-purple-500 transition-colors">Data Types</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card 
                className="cursor-pointer hover:shadow-md transition-all group"
                onClick={() => setLocation('/relationships')}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <GitFork className="h-5 w-5 text-green-600 group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="text-2xl font-bold group-hover:text-green-600 transition-colors">{metrics?.totalRelationships ?? '—'}</p>
                      <p className="text-sm text-gray-500 group-hover:text-green-500 transition-colors">Relationships</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card 
                className="cursor-pointer hover:shadow-md transition-all group"
                onClick={() => setLocation('/crosswalks')}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <ArrowRightLeft className="h-5 w-5 text-orange-600 group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="text-2xl font-bold group-hover:text-orange-600 transition-colors">{metrics?.totalCrosswalks ?? '—'}</p>
                      <p className="text-sm text-gray-500 group-hover:text-orange-500 transition-colors">Crosswalks</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Quick Access Grid */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Card key={action.href} className="group cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation(action.href)}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg group-hover:bg-gray-100">
                        <Icon className={`h-6 w-6 ${action.color}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{action.title}</h3>
                        <p className="text-gray-600">{action.description}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Getting Started */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Getting Started
              </CardTitle>
              <CardDescription>
                Follow these steps to begin managing your reference data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium">Define Reference Types</h4>
                    <p className="text-sm text-gray-600">Create types to structure your reference data</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium">Create Data Sets</h4>
                    <p className="text-sm text-gray-600">Add your reference data using the defined types</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium">Define Relationships</h4>
                    <p className="text-sm text-gray-600">Connect related data sets and establish mappings</p>
                  </div>
                </div>
                <div className="mt-6">
                  <Button variant="outline" onClick={() => setLocation('/help')}>
                    View Documentation
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Recent Activity */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity?.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      {activity.type === 'dataset' && <Database className="h-4 w-4 text-gray-500" />}
                      {activity.type === 'relationship' && <GitFork className="h-4 w-4 text-gray-500" />}
                      {activity.type === 'mapping' && <ArrowRightLeft className="h-4 w-4 text-gray-500" />}
                      <div>
                        <p className="font-medium">{activity.description}</p>
                        <p className="text-sm text-gray-500">Modified by {activity.user}</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
                {(!recentActivity || recentActivity.length === 0) && (
                  <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </MainLayout>
  );
}