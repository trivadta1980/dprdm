
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Database, ArrowLeft, Plus, X, Edit, Save, Trash2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  
  // Edit type dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editTypeData, setEditTypeData] = useState<{
    id: number;
    name: string;
    description: string;
    schemas: SchemaInput[];
  }>({
    id: 0,
    name: "",
    description: "",
    schemas: [{ name: "", dataType: "string" }]
  });
  
  // Delete type dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<ReferenceDataType | null>(null);

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

  // Handle opening edit dialog
  const handleEditType = async (typeId: number) => {
    try {
      setIsLoading(true);
      console.log(`Fetching reference type data for editing, ID: ${typeId}`);
      
      // Fetch the specific reference type data
      const typeResponse = await fetch(`/api/reference-types/${typeId}`);
      console.log(`Type response status: ${typeResponse.status}`);
      
      if (!typeResponse.ok) {
        const errorText = await typeResponse.text();
        console.error(`Error response from type fetch API:`, errorText);
        throw new Error(`Failed to fetch reference type: ${typeResponse.statusText}`);
      }
      
      const typeData = await typeResponse.json();
      console.log(`Retrieved type data:`, typeData);
      
      // Fetch the schemas for this type
      const schemasResponse = await fetch(`/api/reference-types/${typeId}/schemas`);
      console.log(`Schemas response status: ${schemasResponse.status}`);
      
      if (!schemasResponse.ok) {
        const errorText = await schemasResponse.text();
        console.error(`Error response from schemas fetch API:`, errorText);
        throw new Error(`Failed to fetch schemas: ${schemasResponse.statusText}`);
      }
      
      const schemas = await schemasResponse.json();
      console.log(`Retrieved ${schemas.length} schemas for type ${typeId}:`, schemas);
      
      // Set the edit form data
      setEditTypeData({
        id: typeId,
        name: typeData.name,
        description: typeData.description || "",
        schemas: schemas.map((schema: ReferenceDataTypeSchema) => ({
          name: schema.name,
          dataType: schema.dataType
        }))
      });
      
      console.log("Opening edit dialog with data:", {
        id: typeId,
        name: typeData.name,
        description: typeData.description,
        schemasCount: schemas.length
      });
      
      setIsEditDialogOpen(true);
    } catch (error) {
      console.error("Error fetching type for edit:", error);
      toast({
        title: "Error",
        description: `Failed to load reference type data: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle saving edited reference type
  const handleSaveEdit = async () => {
    try {
      console.log("Updating reference type with data:", editTypeData);
      
      // Validate input
      if (!editTypeData.name.trim()) {
        toast({
          title: "Validation Error",
          description: "Name is required",
          variant: "destructive",
        });
        return;
      }

      if (editTypeData.schemas.length === 0 || !editTypeData.schemas.every(s => s.name.trim())) {
        toast({
          title: "Validation Error",
          description: "All schemas must have names",
          variant: "destructive",
        });
        return;
      }

      const requestData = {
        name: editTypeData.name,
        description: editTypeData.description,
        schemas: editTypeData.schemas
      };
      
      console.log("Sending API request to update type:", requestData);
      
      const response = await fetch(`/api/reference-types/${editTypeData.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      console.log("API response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response from API:", errorText);
        throw new Error(`Failed to update reference type: ${response.statusText}. ${errorText}`);
      }

      const responseData = await response.json();
      console.log("Successfully updated reference type:", responseData);

      toast({
        title: "Success",
        description: "Reference type updated successfully",
      });

      // Close dialog
      setIsEditDialogOpen(false);

      // Refresh data with a slight delay to ensure the server has time to process
      setTimeout(() => {
        console.log("Refreshing data after successful update");
        fetchData();
      }, 500);
    } catch (error) {
      console.error("Error updating reference type:", error);
      toast({
        title: "Error",
        description: `Failed to update reference type: ${error.message || "Unknown error"}`,
        variant: "destructive",
      });
    }
  };
  
  // Handle add schema field to edit type
  const handleAddSchemaFieldEdit = () => {
    setEditTypeData({
      ...editTypeData,
      schemas: [...editTypeData.schemas, { name: "", dataType: "string" }]
    });
  };

  // Handle remove schema field from edit type
  const handleRemoveSchemaFieldEdit = (index: number) => {
    const updatedSchemas = [...editTypeData.schemas];
    updatedSchemas.splice(index, 1);
    setEditTypeData({
      ...editTypeData,
      schemas: updatedSchemas
    });
  };
  
  // Handle delete reference type
  const handleDeleteType = async () => {
    if (!typeToDelete) return;
    
    try {
      console.log(`Deleting reference type with ID: ${typeToDelete.id}`);
      
      const response = await fetch(`/api/reference-types/${typeToDelete.id}`, {
        method: "DELETE",
      });

      // Check if the response is not ok
      if (!response.ok) {
        // Try to get a detailed error message from the response
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || `Failed to delete reference type: ${response.statusText}`;
        } catch (e) {
          errorMessage = `Failed to delete reference type: ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      toast({
        title: "Success",
        description: "Reference type deleted successfully",
      });

      // Refresh data after deletion
      fetchData();
    } catch (error) {
      console.error("Error deleting reference type:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete reference type. It may be in use by reference data sets.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setTypeToDelete(null);
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
                  <TableHead>Actions</TableHead>
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
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEditType(type.id)}
                            title="Edit Reference Type"
                          >
                            <Edit className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                              setTypeToDelete(type);
                              setIsDeleteDialogOpen(true);
                            }}
                            title="Delete Reference Type"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
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

      {/* Edit Type Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Reference Data Type</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name *
              </Label>
              <Input
                id="edit-name"
                value={editTypeData.name}
                onChange={(e) => setEditTypeData({...editTypeData, name: e.target.value})}
                className="col-span-3"
                placeholder="Enter type name"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="edit-description"
                value={editTypeData.description}
                onChange={(e) => setEditTypeData({...editTypeData, description: e.target.value})}
                className="col-span-3"
                placeholder="Enter description"
              />
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              <Label className="text-right pt-2">
                Schemas *
              </Label>
              <div className="col-span-3 space-y-2">
                {editTypeData.schemas.map((schema, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      value={schema.name}
                      onChange={(e) => {
                        const updatedSchemas = [...editTypeData.schemas];
                        updatedSchemas[index].name = e.target.value;
                        setEditTypeData({...editTypeData, schemas: updatedSchemas});
                      }}
                      placeholder="Schema name"
                      className="flex-1"
                    />
                    <select
                      value={schema.dataType}
                      onChange={(e) => {
                        const updatedSchemas = [...editTypeData.schemas];
                        updatedSchemas[index].dataType = e.target.value;
                        setEditTypeData({...editTypeData, schemas: updatedSchemas});
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
                      onClick={() => handleRemoveSchemaFieldEdit(index)}
                      disabled={editTypeData.schemas.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAddSchemaFieldEdit}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Schema Field
                </Button>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the reference data type 
              "{typeToDelete?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteType} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
