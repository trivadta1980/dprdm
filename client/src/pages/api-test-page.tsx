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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ReferenceData {
  id: number;
  name: string;
}

interface Instance {
  id: number;
  name: string;
}

export default function ApiTestPage() {
  const { toast } = useToast();
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  const [testParams, setTestParams] = useState<Record<string, string>>({});
  const [response, setResponse] = useState<any>(null);
  const [selectedSourceSystem, setSelectedSourceSystem] = useState<string | null>(null);
  const [selectedTargetSystem, setSelectedTargetSystem] = useState<string | null>(null);
  const [selectedSourceInstance, setSelectedSourceInstance] = useState<string | null>(null);
  const [selectedTargetInstance, setSelectedTargetInstance] = useState<string | null>(null);

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
  const { data: referenceData = [], isLoading: dataLoading } = useQuery<ReferenceData[]>({
    queryKey: ['/api/reference-data']
  });

  // Source system instances
  const { data: sourceInstances = [], isLoading: sourceInstancesLoading } = useQuery<Instance[]>({
    queryKey: [`/api/reference-data/${selectedSourceSystem}/instances`],
    enabled: !!selectedSourceSystem
  });

  // Target system instances
  const { data: targetInstances = [], isLoading: targetInstancesLoading } = useQuery<Instance[]>({
    queryKey: [`/api/reference-data/${selectedTargetSystem}/instances`],
    enabled: !!selectedTargetSystem
  });

  // Relationships endpoints test
  const { data: relationships = [], isLoading: relationshipsLoading } = useQuery({
    queryKey: ['/api/relationships']
  });

  // Crosswalks endpoints test
  const { data: crosswalks = [], isLoading: crosswalksLoading } = useQuery({
    queryKey: ['/api/crosswalks']
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

        <Tabs defaultValue="crosswalks" className="w-full">
          <TabsList>
            <TabsTrigger value="auth">Authentication</TabsTrigger>
            <TabsTrigger value="types">Reference Types</TabsTrigger>
            <TabsTrigger value="data">Reference Data</TabsTrigger>
            <TabsTrigger value="relationships">Relationships</TabsTrigger>
            <TabsTrigger value="crosswalks">Crosswalks</TabsTrigger>
          </TabsList>

          {/* Crosswalks Tab Content */}
          <TabsContent value="crosswalks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Crosswalks Endpoints</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  {/* Test GET /api/crosswalks */}
                  <div className="space-y-2">
                    <Label>GET /api/crosswalks</Label>
                    <div className="flex items-center gap-4">
                      <Button
                        disabled={selectedEndpoint === '/api/crosswalks'}
                        onClick={() => testEndpoint('/api/crosswalks')}
                      >
                        {selectedEndpoint === '/api/crosswalks' && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Test Endpoint
                      </Button>
                      <span>
                        {crosswalksLoading ? 'Loading...' : `${crosswalks.length} crosswalks found`}
                      </span>
                    </div>
                  </div>

                  {/* Test POST /api/crosswalks */}
                  <div className="space-y-2">
                    <Label>POST /api/crosswalks</Label>
                    <div className="grid gap-4">
                      <Input
                        placeholder="Mapping Name"
                        onChange={(e) => handleParamChange('name', e.target.value)}
                      />

                      <div className="space-y-2">
                        <Label>Source Dataset</Label>
                        <Select
                          onValueChange={(value) => {
                            handleParamChange('sourceSystemId', value);
                            setSelectedSourceSystem(value);
                            setSelectedSourceInstance(null);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Source Dataset" />
                          </SelectTrigger>
                          <SelectContent>
                            {referenceData.map((data) => (
                              <SelectItem key={data.id} value={String(data.id)}>
                                {data.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedSourceSystem && (
                        <div className="space-y-2">
                          <Label>Source Instance</Label>
                          <Select
                            value={selectedSourceInstance || undefined}
                            onValueChange={(value) => {
                              handleParamChange('sourceInstanceId', value);
                              setSelectedSourceInstance(value);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Source Instance" />
                            </SelectTrigger>
                            <SelectContent>
                              {sourceInstancesLoading ? (
                                <SelectItem value="loading">Loading instances...</SelectItem>
                              ) : sourceInstances.map((instance) => (
                                <SelectItem key={instance.id} value={String(instance.id)}>
                                  {instance.name || `Instance ${instance.id}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Target Dataset</Label>
                        <Select
                          onValueChange={(value) => {
                            handleParamChange('targetSystemId', value);
                            setSelectedTargetSystem(value);
                            setSelectedTargetInstance(null);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Target Dataset" />
                          </SelectTrigger>
                          <SelectContent>
                            {referenceData.map((data) => (
                              <SelectItem key={data.id} value={String(data.id)}>
                                {data.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedTargetSystem && (
                        <div className="space-y-2">
                          <Label>Target Instance</Label>
                          <Select
                            value={selectedTargetInstance || undefined}
                            onValueChange={(value) => {
                              handleParamChange('targetInstanceId', value);
                              setSelectedTargetInstance(value);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Target Instance" />
                            </SelectTrigger>
                            <SelectContent>
                              {targetInstancesLoading ? (
                                <SelectItem value="loading">Loading instances...</SelectItem>
                              ) : targetInstances.map((instance) => (
                                <SelectItem key={instance.id} value={String(instance.id)}>
                                  {instance.name || `Instance ${instance.id}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <Button
                        onClick={() => testEndpoint('/api/crosswalks', 'POST', {
                          name: testParams.name,
                          sourceSystemId: Number(testParams.sourceSystemId),
                          targetSystemId: Number(testParams.targetSystemId),
                          sourceInstanceId: Number(testParams.sourceInstanceId),
                          targetInstanceId: Number(testParams.targetInstanceId)
                        })}
                      >
                        Create Mapping
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

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
                      {relationshipsLoading ? 'Loading...' : `${relationships.length} relationships found`}
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