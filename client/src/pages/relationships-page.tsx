
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, GitFork } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ReferenceDataSet } from "@shared/schema";
import { useState } from "react";

// Form schema for creating relationships
const createRelationshipSchema = z.object({
  sourceDataSetId: z.string(),
  targetDataSetId: z.string(),
  relationshipType: z.string(),
  cardinality: z.string(),
  sourceField: z.string(),
  targetField: z.string(),
});

type CreateRelationshipForm = z.infer<typeof createRelationshipSchema>;

export default function RelationshipsPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<CreateRelationshipForm>({
    resolver: zodResolver(createRelationshipSchema),
  });

  // Fetch reference data sets for dropdowns
  const { data: dataSets = [] } = useQuery<ReferenceDataSet[]>({
    queryKey: ["/api/reference-data"],
  });

  // Get the selected data sets
  const sourceDataSet = dataSets.find(ds => ds.id.toString() === form.watch("sourceDataSetId"));
  const targetDataSet = dataSets.find(ds => ds.id.toString() === form.watch("targetDataSetId"));

  // Fetch schemas for selected data sets
  const { data: sourceSchemas = [] } = useQuery<ReferenceDataTypeSchema[]>({
    queryKey: [`/api/reference-types/${sourceDataSet?.typeId}/schemas`],
    enabled: !!sourceDataSet?.typeId,
  });

  const { data: targetSchemas = [] } = useQuery<ReferenceDataTypeSchema[]>({
    queryKey: [`/api/reference-types/${targetDataSet?.typeId}/schemas`],
    enabled: !!targetDataSet?.typeId,
  });

  // Create relationship mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateRelationshipForm) => {
      const res = await apiRequest("POST", "/api/relationships", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/relationships"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Relationship created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create relationship",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: CreateRelationshipForm) {
    createMutation.mutate(data);
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <GitFork className="h-5 w-5" />
              Relationship Management
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Relationship
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Relationship</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="sourceDataSetId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Source Data Set</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select source data set" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {dataSets.map((dataSet) => (
                                <SelectItem
                                  key={dataSet.id}
                                  value={dataSet.id.toString()}
                                >
                                  {dataSet.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="targetDataSetId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Data Set</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select target data set" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {dataSets.map((dataSet) => (
                                <SelectItem
                                  key={dataSet.id}
                                  value={dataSet.id.toString()}
                                >
                                  {dataSet.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="relationshipType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Relationship Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select relationship type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="parent-child">Parent-Child</SelectItem>
                              <SelectItem value="reference">Reference</SelectItem>
                              <SelectItem value="association">Association</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cardinality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cardinality</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select cardinality" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="one-to-one">One-to-One</SelectItem>
                              <SelectItem value="one-to-many">One-to-Many</SelectItem>
                              <SelectItem value="many-to-many">Many-to-Many</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="sourceField"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Source Field</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select source field" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {sourceSchemas.map((schema) => (
                                <SelectItem
                                  key={schema.id}
                                  value={schema.name}
                                >
                                  {schema.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="targetField"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Field</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select target field" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {targetSchemas.map((schema) => (
                                <SelectItem
                                  key={schema.id}
                                  value={schema.name}
                                >
                                  {schema.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full">
                      Create Relationship
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <GitFork className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No relationships defined yet.</p>
              <p className="text-sm">Click the "New Relationship" button to create one.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
