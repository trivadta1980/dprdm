import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function ApiTestPage() {
  const { toast } = useToast();
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);

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

  // Crosswalks endpoints test
  const { data: crosswalks, isLoading: crosswalksLoading } = useQuery({
    queryKey: ['/api/crosswalks']
  });

  const testEndpoint = async (endpoint: string) => {
    setSelectedEndpoint(endpoint);
    try {
      const response = await fetch(endpoint);
      const data = await response.json();
      toast({
        title: "Endpoint Test Result",
        description: `Status: ${response.status}\nData: ${JSON.stringify(data, null, 2)}`,
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

          <TabsContent value="auth" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Authentication Endpoints</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex items-center gap-4">
                    <Button 
                      disabled={selectedEndpoint === '/api/user'}
                      onClick={() => testEndpoint('/api/user')}
                    >
                      {selectedEndpoint === '/api/user' && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Test /api/user
                    </Button>
                    <span>{userLoading ? 'Loading...' : userData ? 'Authenticated' : 'Not authenticated'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="types" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Reference Types Endpoints</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex items-center gap-4">
                    <Button 
                      disabled={selectedEndpoint === '/api/reference-types'}
                      onClick={() => testEndpoint('/api/reference-types')}
                    >
                      {selectedEndpoint === '/api/reference-types' && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Test /api/reference-types
                    </Button>
                    <span>{typesLoading ? 'Loading...' : `${referenceTypes?.length || 0} types found`}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

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

          <TabsContent value="crosswalks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Crosswalks Endpoints</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex items-center gap-4">
                    <Button 
                      disabled={selectedEndpoint === '/api/crosswalks'}
                      onClick={() => testEndpoint('/api/crosswalks')}
                    >
                      {selectedEndpoint === '/api/crosswalks' && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Test /api/crosswalks
                    </Button>
                    <span>
                      {crosswalksLoading ? 'Loading...' : `${crosswalks?.length || 0} crosswalks found`}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
