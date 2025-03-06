
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Database, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import type { ReferenceDataType, ReferenceDataTypeSchema } from "@shared/schema";

export default function ReferenceTypesListPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [referenceTypes, setReferenceTypes] = useState<ReferenceDataType[]>([]);
  const [schemasMap, setSchemasMap] = useState<{ [key: number]: ReferenceDataTypeSchema[] }>({});
  const [totalSchemas, setTotalSchemas] = useState(0);

  // Use fetch directly like in the test script
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch reference types
        const typesResponse = await fetch('/api/reference-types');
        if (!typesResponse.ok) {
          throw new Error(`Failed to fetch reference types: ${typesResponse.statusText}`);
        }
        const types = await typesResponse.json();
        setReferenceTypes(types);

        // Fetch schemas for each type
        const schemasData: { [key: number]: ReferenceDataTypeSchema[] } = {};
        let schemaCount = 0;

        for (const type of types) {
          try {
            const schemaResponse = await fetch(`/api/reference-types/${type.id}/schemas`);
            if (!schemaResponse.ok) {
              throw new Error(`Failed to fetch schemas for type ${type.id}: ${schemaResponse.statusText}`);
            }
            const schemas = await schemaResponse.json();
            schemasData[type.id] = schemas;
            schemaCount += schemas.length;
            console.log(`Fetched ${schemas.length} schemas for type ${type.name} (ID: ${type.id})`);
          } catch (error) {
            console.error(`Error fetching schemas for type ${type.id}:`, error);
            schemasData[type.id] = [];
            toast({
              title: "Error",
              description: `Failed to fetch schemas for ${type.name}`,
              variant: "destructive",
            });
          }
        }

        setSchemasMap(schemasData);
        setTotalSchemas(schemaCount);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to fetch reference types",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [toast]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Reference Data Types List</CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setLocation("/reference-types")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Reference Types
              </Button>
              <Button variant="outline" onClick={() => setLocation("/reference-types-debug")}>
                <Database className="h-4 w-4 mr-2" />
                Debug Schemas
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-3 bg-muted rounded-md">
              <div className="text-sm font-medium">Summary</div>
              <div className="flex gap-4 mt-2">
                <Badge variant="outline" className="text-sm">
                  Total Types: {referenceTypes.length}
                </Badge>
                <Badge variant="outline" className="text-sm">
                  Total Schemas: {totalSchemas}
                </Badge>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Schema Count</TableHead>
                  <TableHead>Schema Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referenceTypes.map((type) => {
                  const typeSchemas = schemasMap[type.id] || [];
                  return (
                    <TableRow key={type.id}>
                      <TableCell>{type.id}</TableCell>
                      <TableCell className="font-medium">{type.name}</TableCell>
                      <TableCell>{type.description || "No description"}</TableCell>
                      <TableCell>
                        <Badge>
                          {typeSchemas.length}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {typeSchemas.length === 0 ? (
                            <Badge variant="outline" className="bg-yellow-100">
                              No schemas
                            </Badge>
                          ) : (
                            typeSchemas.map((schema, index) => (
                              <div key={index} className="space-y-1">
                                <Badge variant="secondary" className="mr-1">
                                  {schema.name}: {schema.dataType}
                                </Badge>
                              </div>
                            ))
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
