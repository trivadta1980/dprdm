
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Database, ArrowLeft, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { ReferenceDataType, ReferenceDataTypeSchema } from "@shared/schema";

type SchemaInput = {
  name: string;
  dataType: string;
};

export default function ReferenceTypesListPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [referenceTypes, setReferenceTypes] = useState<ReferenceDataType[]>([]);
  const [schemasMap, setSchemasMap] = useState<{ [key: number]: ReferenceDataTypeSchema[] }>({});
  const [totalSchemas, setTotalSchemas] = useState(0);
  
  // Add new type dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTypeData, setNewTypeData] = useState<{
    name: string;
    description: string;
    schemas: SchemaInput[];
  }>({
    name: "",
    description: "",
    schemas: [{ name: "", dataType: "string" }]
  });

  // Handle add schema field to new type
  const handleAddSchemaField = () => {
    setNewTypeData({
      ...newTypeData,
      schemas: [...newTypeData.schemas, { name: "", dataType: "string" }]
    });
  };

  // Handle remove schema field from new type
  const handleRemoveSchemaField = (index: number) => {
    const updatedSchemas = [...newTypeData.schemas];
    updatedSchemas.splice(index, 1);
    setNewTypeData({
      ...newTypeData,
      schemas: updatedSchemas
    });
  };

  // Create new reference type
  const handleCreateType = async () => {
    try {
      console.log("Creating reference type with data:", newTypeData);
      
      // Validate input
      if (!newTypeData.name.trim()) {
        toast({
          title: "Validation Error",
          description: "Name is required",
          variant: "destructive",
        });
        return;
      }

      if (newTypeData.schemas.length === 0 || !newTypeData.schemas.every(s => s.name.trim())) {
        toast({
          title: "Validation Error",
          description: "All schemas must have names",
          variant: "destructive",
        });
        return;
      }

      const requestData = {
        name: newTypeData.name,
        description: newTypeData.description,
        schemas: newTypeData.schemas
      };
      
      console.log("Sending API request with data:", requestData);
      
      const response = await fetch('/api/reference-types', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      console.log("API response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response from API:", errorText);
        throw new Error(`Failed to create reference type: ${response.statusText}. ${errorText}`);
      }

      const responseData = await response.json();
      console.log("Successfully created reference type:", responseData);

      toast({
        title: "Success",
        description: "Reference type created successfully",
      });

      // Reset form and close dialog
      setNewTypeData({
        name: "",
        description: "",
        schemas: [{ name: "", dataType: "string" }]
      });
      setIsAddDialogOpen(false);

      // Refresh data with a slight delay to ensure the server has time to process
      setTimeout(() => {
        console.log("Refreshing data after successful creation");
        fetchData();
      }, 500);
    } catch (error) {
      console.error("Error creating reference type:", error);
      toast({
        title: "Error",
        description: `Failed to create reference type: ${error.message || "Unknown error"}`,
        variant: "destructive",
      });
    }
  };

  // Define the fetchData function
  const fetchData = async () => {
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
    };

  useEffect(() => {
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
              <Button variant="default" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Type
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
    {/* Add New Type Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Reference Data Type</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name *
              </Label>
              <Input
                id="name"
                value={newTypeData.name}
                onChange={(e) => setNewTypeData({...newTypeData, name: e.target.value})}
                className="col-span-3"
                placeholder="Enter type name"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={newTypeData.description}
                onChange={(e) => setNewTypeData({...newTypeData, description: e.target.value})}
                className="col-span-3"
                placeholder="Enter description"
              />
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              <Label className="text-right pt-2">
                Schemas *
              </Label>
              <div className="col-span-3 space-y-2">
                {newTypeData.schemas.map((schema, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      value={schema.name}
                      onChange={(e) => {
                        const updatedSchemas = [...newTypeData.schemas];
                        updatedSchemas[index].name = e.target.value;
                        setNewTypeData({...newTypeData, schemas: updatedSchemas});
                      }}
                      placeholder="Schema name"
                      className="flex-1"
                    />
                    <select
                      value={schema.dataType}
                      onChange={(e) => {
                        const updatedSchemas = [...newTypeData.schemas];
                        updatedSchemas[index].dataType = e.target.value;
                        setNewTypeData({...newTypeData, schemas: updatedSchemas});
                      }}
                      className="p-2 border rounded-md"
                    >
                      <option value="string">string</option>
                      <option value="number">number</option>
                      <option value="boolean">boolean</option>
                      <option value="date">date</option>
                    </select>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleRemoveSchemaField(index)}
                      disabled={newTypeData.schemas.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAddSchemaField}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Schema Field
                </Button>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateType}>
              Create Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
