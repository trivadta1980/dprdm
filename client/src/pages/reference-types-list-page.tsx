
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Database, ArrowLeft, Edit, Plus, Save, X, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
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
  
  // Edit state
  const [editingTypeId, setEditingTypeId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<{
    name: string;
    description: string;
  }>({
    name: "",
    description: "",
  });
  
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
  
  // Delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<ReferenceDataType | null>(null);

  // Fetch data function
  const fetchData = async () => {
    try {
      setIsLoading(true);
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

  // Start editing a type
  const handleEdit = (type: ReferenceDataType) => {
    setEditingTypeId(type.id);
    setEditFormData({
      name: type.name,
      description: type.description || "",
    });
  };

  // Save edited type
  const handleSaveEdit = async (id: number) => {
    try {
      const response = await fetch(`/api/reference-types/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editFormData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update reference type: ${response.statusText}`);
      }

      toast({
        title: "Success",
        description: "Reference type updated successfully",
      });

      // Refresh data
      fetchData();
    } catch (error) {
      console.error("Error updating reference type:", error);
      toast({
        title: "Error",
        description: "Failed to update reference type",
        variant: "destructive",
      });
    } finally {
      setEditingTypeId(null);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingTypeId(null);
  };

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

      const response = await fetch('/api/reference-types', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newTypeData.name,
          description: newTypeData.description,
          schemas: newTypeData.schemas
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create reference type: ${response.statusText}`);
      }

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

      // Refresh data
      fetchData();
    } catch (error) {
      console.error("Error creating reference type:", error);
      toast({
        title: "Error",
        description: "Failed to create reference type",
        variant: "destructive",
      });
    }
  };

  // Delete reference type
  const handleDeleteType = async () => {
    if (!typeToDelete) return;
    
    try {
      const response = await fetch(`/api/reference-types/${typeToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete reference type: ${response.statusText}`);
      }

      toast({
        title: "Success",
        description: "Reference type deleted successfully",
      });

      // Refresh data
      fetchData();
    } catch (error) {
      console.error("Error deleting reference type:", error);
      toast({
        title: "Error",
        description: "Failed to delete reference type. It may be in use by reference data sets.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setTypeToDelete(null);
    }
  };

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
                  const isEditing = editingTypeId === type.id;
                  
                  return (
                    <TableRow key={type.id}>
                      <TableCell>{type.id}</TableCell>
                      <TableCell className="font-medium">
                        {isEditing ? (
                          <Input 
                            value={editFormData.name}
                            onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                            className="w-full"
                          />
                        ) : (
                          type.name
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Textarea 
                            value={editFormData.description}
                            onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                            className="w-full h-20"
                          />
                        ) : (
                          type.description || "No description"
                        )}
                      </TableCell>
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
                          {isEditing ? (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => handleSaveEdit(type.id)}>
                                <Save className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={handleCancelEdit}>
                                <X className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(type)}>
                                <Edit className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => {
                                  setTypeToDelete(type);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
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
