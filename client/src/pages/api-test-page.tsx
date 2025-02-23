import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ApiTestPage() {
  const { toast } = useToast();
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  const [testParams, setTestParams] = useState<Record<string, string>>({});
  const [response, setResponse] = useState<any>(null);

  // Authentication endpoints test
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['/api/user'],
    retry: false
  });

  // Reference Types endpoints test
  const { data: referenceTypes, isLoading: typesLoading } = useQuery({
    queryKey: ['/api/reference-types']
  });

  // Reference Data endpoints test
  const { data: referenceData, isLoading: dataLoading } = useQuery({
    queryKey: ['/api/reference-data']
  });

  // Relationships endpoints test
  const { data: relationships, isLoading: relationshipsLoading } = useQuery({
    queryKey: ['/api/relationships']
  });

  const handleParamChange = (key: string, value: string) => {
    setTestParams(prev => ({ ...prev, [key]: value }));
  };

  const testEndpoint = async (endpoint: string, method: string = 'GET', body?: any) => {
    setSelectedEndpoint(endpoint);
    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(endpoint, options);
      const data = await response.json();
      setResponse(data);
      toast({
        title: "Endpoint Test Result",
        description: `Status: ${response.status}`,
      });
    } catch (error) {
      toast({
        title: "Endpoint Test Failed",
        description: String(error),
        variant: "destructive",
      });
    } finally {
      setSelectedEndpoint(null);
    }
  };

  const renderResponse = (data: any) => {
    return (
      <ScrollArea className="h-[200px] w-full rounded-md border p-4">
        <pre className="text-sm">
          {JSON.stringify(data, null, 2)}
        </pre>
      </ScrollArea>
    );
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-8">
        <h1 className="text-3xl font-bold">API Endpoint Testing</h1>

        <Tabs defaultValue="auth" className="w-full">
          <TabsList>
            <TabsTrigger value="auth">Authentication</TabsTrigger>
            <TabsTrigger value="types">Reference Types</TabsTrigger>
            <TabsTrigger value="data">Reference Data</TabsTrigger>
            <TabsTrigger value="relationships">Relationships</TabsTrigger>
          </TabsList>

          {/* Auth Tab Content */}
          <TabsContent value="auth" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Authentication Endpoints</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  {/* Test GET /api/user */}
                  <div className="space-y-2">
                    <Label>GET /api/user</Label>
                    <div className="flex items-center gap-4">
                      <Button
                        disabled={selectedEndpoint === '/api/user'}
                        onClick={() => testEndpoint('/api/user')}
                      >
                        {selectedEndpoint === '/api/user' && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Test Endpoint
                      </Button>
                      <span>{userLoading ? 'Loading...' : userData ? 'Authenticated' : 'Not authenticated'}</span>
                    </div>
                  </div>

                  {/* Test POST /api/login */}
                  <div className="space-y-2">
                    <Label>POST /api/login</Label>
                    <div className="grid gap-2">
                      <Input
                        placeholder="Username"
                        onChange={(e) => handleParamChange('username', e.target.value)}
                      />
                      <Input
                        type="password"
                        placeholder="Password"
                        onChange={(e) => handleParamChange('password', e.target.value)}
                      />
                      <Button
                        disabled={selectedEndpoint === '/api/login'}
                        onClick={() => testEndpoint('/api/login', 'POST', {
                          username: testParams.username,
                          password: testParams.password
                        })}
                      >
                        Test Login
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Types Tab Content */}
          <TabsContent value="types" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Reference Types Endpoints</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  {/* Test GET /api/reference-types */}
                  <div className="space-y-2">
                    <Label>GET /api/reference-types</Label>
                    <div className="flex items-center gap-4">
                      <Button
                        disabled={selectedEndpoint === '/api/reference-types'}
                        onClick={() => testEndpoint('/api/reference-types')}
                      >
                        Test Endpoint
                      </Button>
                      <span>{typesLoading ? 'Loading...' : `${referenceTypes?.length || 0} types found`}</span>
                    </div>
                  </div>

                  {/* Test POST /api/reference-types */}
                  <div className="space-y-2">
                    <Label>POST /api/reference-types</Label>
                    <div className="grid gap-2">
                      <Input
                        placeholder="Type Name"
                        onChange={(e) => handleParamChange('name', e.target.value)}
                      />
                      <Input
                        placeholder="Description"
                        onChange={(e) => handleParamChange('description', e.target.value)}
                      />
                      <Button
                        onClick={() => testEndpoint('/api/reference-types', 'POST', {
                          name: testParams.name,
                          description: testParams.description
                        })}
                      >
                        Create Type
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Tab Content */}
          <TabsContent value="data" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Reference Data Endpoints</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex items-center gap-4">
                    <Button
                      disabled={selectedEndpoint === '/api/reference-data'}
                      onClick={() => testEndpoint('/api/reference-data')}
                    >
                      {selectedEndpoint === '/api/reference-data' && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Test /api/reference-data
                    </Button>
                    <span>{dataLoading ? 'Loading...' : `${referenceData?.length || 0} datasets found`}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Relationships Tab Content */}
          <TabsContent value="relationships" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Relationships Endpoints</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex items-center gap-4">
                    <Button
                      disabled={selectedEndpoint === '/api/relationships'}
                      onClick={() => testEndpoint('/api/relationships')}
                    >
                      {selectedEndpoint === '/api/relationships' && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Test /api/relationships
                    </Button>
                    <span>
                      {relationshipsLoading ? 'Loading...' : `${relationships?.length || 0} relationships found`}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {response && (
            <div className="mt-4">
              <Label>Response:</Label>
              {renderResponse(response)}
            </div>
          )}
        </Tabs>
      </div>
    </MainLayout>
  );
}