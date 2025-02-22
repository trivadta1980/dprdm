import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
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

type MappingElement = {
  source: string;
  target: string;
};

export default function ApiTestPage() {
  const { toast } = useToast();
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  const [testParams, setTestParams] = useState<Record<string, string>>({});
  const [response, setResponse] = useState<any>(null);
  const [mappingElements, setMappingElements] = useState<MappingElement[]>([{ source: '', target: '' }]);
  const [selectedSourceSystem, setSelectedSourceSystem] = useState<string | null>(null);
  const [selectedTargetSystem, setSelectedTargetSystem] = useState<string | null>(null);

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

  // Source system schema and instances
  const { data: sourceSchema } = useQuery({
    queryKey: ['/api/reference-data', selectedSourceSystem, 'schema'],
    enabled: !!selectedSourceSystem
  });

  // Target system schema and instances
  const { data: targetSchema } = useQuery({
    queryKey: ['/api/reference-data', selectedTargetSystem, 'schema'],
    enabled: !!selectedTargetSystem
  });

  // Source system instances
  const { data: sourceInstances } = useQuery({
    queryKey: ['/api/reference-data', selectedSourceSystem, 'instances'],
    enabled: !!selectedSourceSystem
  });

  // Target system instances
  const { data: targetInstances } = useQuery({
    queryKey: ['/api/reference-data', selectedTargetSystem, 'instances'],
    enabled: !!selectedTargetSystem
  });

  // Relationships endpoints test
  const { data: relationships, isLoading: relationshipsLoading } = useQuery({
    queryKey: ['/api/relationships']
  });

  // Crosswalks endpoints test
  const { data: crosswalks, isLoading: crosswalksLoading } = useQuery({
    queryKey: ['/api/crosswalks']
  });

  const handleParamChange = (key: string, value: string) => {
    setTestParams(prev => ({ ...prev, [key]: value }));
  };

  const handleMappingElementChange = (index: number, field: 'source' | 'target', value: string) => {
    const newElements = [...mappingElements];
    newElements[index][field] = value;
    setMappingElements(newElements);
  };

  const addMappingElement = () => {
    setMappingElements([...mappingElements, { source: '', target: '' }]);
  };

  const removeMappingElement = (index: number) => {
    const newElements = mappingElements.filter((_, i) => i !== index);
    setMappingElements(newElements);
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
            <TabsTrigger value="crosswalks">Crosswalks</TabsTrigger>
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
                        Test Endpoint
                      </Button>
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
                      <Select 
                        onValueChange={(value) => {
                          handleParamChange('sourceSystemId', value);
                          setSelectedSourceSystem(value);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Source System" />
                        </SelectTrigger>
                        <SelectContent>
                          {referenceData?.map((data: any) => (
                            <SelectItem key={data.id} value={String(data.id)}>
                              {data.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {sourceSchema && (
                        <div className="space-y-2">
                          <Label>Source System Schema</Label>
                          <ScrollArea className="h-32 rounded-md border">
                            <div className="p-4">
                              {sourceSchema.columns?.map((column: any) => (
                                <div key={column.name} className="flex items-center gap-2 text-sm">
                                  <span className="font-medium">{column.name}:</span>
                                  <span className="text-muted-foreground">{column.type}</span>
                                  {column.description && (
                                    <span className="text-xs text-muted-foreground">({column.description})</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      )}

                      <Select 
                        onValueChange={(value) => {
                          handleParamChange('targetSystemId', value);
                          setSelectedTargetSystem(value);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Target System" />
                        </SelectTrigger>
                        <SelectContent>
                          {referenceData?.map((data: any) => (
                            <SelectItem key={data.id} value={String(data.id)}>
                              {data.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {targetSchema && (
                        <div className="space-y-2">
                          <Label>Target System Schema</Label>
                          <ScrollArea className="h-32 rounded-md border">
                            <div className="p-4">
                              {targetSchema.columns?.map((column: any) => (
                                <div key={column.name} className="flex items-center gap-2 text-sm">
                                  <span className="font-medium">{column.name}:</span>
                                  <span className="text-muted-foreground">{column.type}</span>
                                  {column.description && (
                                    <span className="text-xs text-muted-foreground">({column.description})</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      )}

                      {/* Element Mappings */}
                      <div className="space-y-4">
                        <Label>Element Mappings</Label>
                        {mappingElements.map((element, index) => (
                          <div key={index} className="grid grid-cols-[1fr,1fr,auto] gap-2 items-start">
                            <div className="space-y-2">
                              <Label>Source Element</Label>
                              <Select
                                value={element.source}
                                onValueChange={(value) => handleMappingElementChange(index, 'source', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select source element" />
                                </SelectTrigger>
                                <SelectContent>
                                  {sourceSchema?.columns?.map((column: any) => (
                                    <SelectItem key={column.name} value={column.name}>
                                      {column.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Target Element</Label>
                              <Select
                                value={element.target}
                                onValueChange={(value) => handleMappingElementChange(index, 'target', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select target element" />
                                </SelectTrigger>
                                <SelectContent>
                                  {targetSchema?.columns?.map((column: any) => (
                                    <SelectItem key={column.name} value={column.name}>
                                      {column.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="mt-8"
                              onClick={() => removeMappingElement(index)}
                              disabled={mappingElements.length === 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={addMappingElement}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Mapping
                        </Button>
                      </div>

                      <Button
                        onClick={() => testEndpoint('/api/crosswalks', 'POST', {
                          name: testParams.name,
                          sourceSystemId: Number(testParams.sourceSystemId),
                          targetSystemId: Number(testParams.targetSystemId),
                          mappingData: mappingElements.reduce((acc, curr) => {
                            acc[curr.source] = curr.target;
                            return acc;
                          }, {} as Record<string, string>)
                        })}
                      >
                        Create Mapping
                      </Button>
                    </div>
                  </div>
                </div>

                {response && (
                  <div className="mt-4">
                    <Label>Response:</Label>
                    {renderResponse(response)}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}