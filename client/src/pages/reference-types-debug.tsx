
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { ReferenceDataType, ReferenceDataTypeSchema } from "@shared/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ReferenceTypesDebugPage() {
  // First, fetch all reference types
  const { data: referenceTypes, isLoading: typesLoading, error: typesError } = useQuery<ReferenceDataType[]>({
    queryKey: ["/api/reference-types"],
  });

  // Then, get schemas for all reference types
  const { data: schemasMap = {}, isLoading: schemasLoading, error: schemasError } = useQuery<{ [key: number]: ReferenceDataTypeSchema[] }>({
    queryKey: ["/api/reference-types", "schemas"],
    queryFn: async () => {
      if (!referenceTypes?.length) return {};

      const schemasMap: { [key: number]: ReferenceDataTypeSchema[] } = {};
      for (const type of referenceTypes) {
        try {
          console.log(`Fetching schemas for type ${type.id}: ${type.name}`);
          const res = await apiRequest("GET", `/api/reference-types/${type.id}/schemas`);
          if (!res.ok) {
            console.error(`Error fetching schemas for type ${type.id}: ${res.statusText}`);
            throw new Error(`Failed to fetch schemas: ${res.statusText}`);
          }
          const data = await res.json();
          console.log(`Received schemas for type ${type.id}:`, data);
          schemasMap[type.id] = data;
        } catch (error) {
          console.error(`Error fetching schemas for type ${type.id}:`, error);
          schemasMap[type.id] = [];
        }
      }
      return schemasMap;
    },
    enabled: !!referenceTypes?.length,
  });

  const isLoading = typesLoading || schemasLoading;
  const error = typesError || schemasError;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }
  
  if (error) {
    return (
      <MainLayout>
        <div className="max-w-6xl mx-auto space-y-6 p-4">
          <Alert variant="destructive">
            <AlertTitle>Error loading reference types or schemas</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : "Unknown error occurred"}
            </AlertDescription>
          </Alert>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "An error occurred while fetching data"}
          </AlertDescription>
        </Alert>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6 p-4">
        <Card>
          <CardHeader>
            <CardTitle>Reference Types Schema Debug Panel</CardTitle>
          </CardHeader>
          <CardContent>
            {referenceTypes && referenceTypes.length > 0 ? (
              <Tabs defaultValue={referenceTypes[0].id.toString()}>
                <TabsList className="mb-4 flex flex-wrap">
                  {referenceTypes.map((type) => (
                    <TabsTrigger key={type.id} value={type.id.toString()}>
                      {type.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {referenceTypes.map((type) => {
                  const schemas = schemasMap[type.id] || [];
                  
                  return (
                    <TabsContent key={type.id} value={type.id.toString()}>
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex justify-between items-center">
                            <span>{type.name}</span>
                            <Badge variant="outline">
                              ID: {type.id} | Schemas: {schemas.length}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="mb-4">
                            <h3 className="font-medium text-sm text-muted-foreground mb-1">Description:</h3>
                            <p>{type.description || "No description"}</p>
                          </div>
                          
                          <div className="mb-4">
                            <h3 className="font-medium text-sm text-muted-foreground mb-1">Created At:</h3>
                            <p>{new Date(type.createdAt).toLocaleString()}</p>
                          </div>
                          
                          <h3 className="font-bold text-lg mb-2">Schemas</h3>
                          {schemas.length > 0 ? (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>ID</TableHead>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Data Type</TableHead>
                                  <TableHead>Description</TableHead>
                                  <TableHead>Created At</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {schemas.map((schema) => (
                                  <TableRow key={schema.id}>
                                    <TableCell>{schema.id}</TableCell>
                                    <TableCell>{schema.name}</TableCell>
                                    <TableCell>
                                      <Badge>{schema.dataType}</Badge>
                                    </TableCell>
                                    <TableCell>{schema.description || "No description"}</TableCell>
                                    <TableCell>
                                      {new Date(schema.createdAt).toLocaleString()}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          ) : (
                            <Alert>
                              <AlertTitle>No Schemas Found</AlertTitle>
                              <AlertDescription>
                                This reference type doesn't have any schemas defined.
                              </AlertDescription>
                            </Alert>
                          )}
                          
                          <div className="mt-4 p-4 bg-muted rounded-md">
                            <h3 className="font-medium mb-2">Raw Schema Data</h3>
                            <div className="mb-2">
                              <Badge variant={schemas.length > 0 ? "success" : "destructive"}>
                                {schemas.length > 0 ? "Schemas Found" : "No Schemas Loaded"}
                              </Badge>
                            </div>
                            <pre className="overflow-auto p-2 bg-background rounded-md text-sm">
                              {JSON.stringify(schemas, null, 2)}
                            </pre>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  );
                })}
              </Tabs>
            ) : (
              <Alert>
                <AlertTitle>No Reference Types</AlertTitle>
                <AlertDescription>
                  There are no reference types available in the system.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
