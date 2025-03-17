import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MainLayout } from "@/components/layout/main-layout";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ReferenceDataType, ReferenceDataSet, InsertReferenceDataSet } from "@shared/schema";
import { insertReferenceDataSetSchema } from "@shared/schema";

export default function ReferenceDataEditPage() {
  const { id } = useParams();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const dataSetId = id ? Number(id) : null;

  console.log('[DEBUG] ReferenceDataEditPage - Component mounted, id:', id);

  const { data: dataSet, isLoading: isLoadingDataSet, error: dataSetError } = useQuery<ReferenceDataSet>({
    queryKey: [`/api/reference-data/${dataSetId}`],
    enabled: !!dataSetId,
    onError: (error) => {
      console.error('[DEBUG] ReferenceDataEditPage - Data fetch error:', error);
      if (error instanceof Error) {
        console.log('[DEBUG] Error response:', error.message);
        if ('response' in error) {
          // @ts-ignore
          console.log('[DEBUG] Response details:', error.response?.data);
        }
      }
    },
    onSuccess: (data) => {
      console.log('[DEBUG] ReferenceDataEditPage - Data fetch success:', data);
    }
  });

  const { data: types = [], isLoading: isLoadingTypes, error: typesError } = useQuery<ReferenceDataType[]>({
    queryKey: ["/api/reference-types"],
    onError: (error) => {
      console.error('[DEBUG] ReferenceDataEditPage - Types fetch error:', error);
    },
    onSuccess: (data) => {
      console.log('[DEBUG] ReferenceDataEditPage - Types fetch success:', data);
    }
  });

  const form = useForm<InsertReferenceDataSet>({
    resolver: zodResolver(insertReferenceDataSetSchema),
    defaultValues: {
      name: "",
      description: "",
      typeId: undefined,
      data: {},
    },
  });

  useEffect(() => {
    if (dataSet) {
      console.log('[DEBUG] ReferenceDataEditPage - Setting form values with dataset:', dataSet);
      form.reset({
        name: dataSet.name,
        description: dataSet.description || "",
        typeId: dataSet.typeId,
        data: dataSet.data,
      });
    }
  }, [dataSet, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: InsertReferenceDataSet) => {
      console.log('[DEBUG] ReferenceDataEditPage - Starting update mutation with data:', data);
      const response = await fetch(`/api/reference-data/${dataSetId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: 'include', // Important for sending cookies
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[DEBUG] Update mutation failed:', {
          status: response.status,
          statusText: response.statusText,
          errorText,
          headers: Object.fromEntries(response.headers.entries())
        });
        throw new Error(`Failed to update reference data set: ${errorText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      console.log('[DEBUG] ReferenceDataEditPage - Update mutation succeeded');
      // Invalidate both list and detail view caches
      queryClient.invalidateQueries({ queryKey: ["/api/reference-data"] });
      queryClient.invalidateQueries({ queryKey: [`/api/reference-data/${dataSetId}`] });
      toast({
        title: "Success",
        description: "Reference Data Set updated successfully",
      });
      setLocation("/reference-data");
    },
    onError: (error: Error) => {
      console.error('[DEBUG] ReferenceDataEditPage - Update mutation failed:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoadingDataSet || isLoadingTypes) {
    return (
      <MainLayout>
        <div className="container mx-auto py-10">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!dataSet) {
    console.log('[DEBUG] ReferenceDataEditPage - No dataset found');
    return (
      <MainLayout>
        <div className="container mx-auto py-10">
          <div className="text-center">
            Reference Data Set not found
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Edit Reference Data Set</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => {
                console.log('[DEBUG] ReferenceDataEditPage - Form submitted with data:', data);
                updateMutation.mutate(data);
              })} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="typeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select
                        value={field.value?.toString()}
                        onValueChange={(value) => field.onChange(Number(value))}
                        disabled
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {types.map((type) => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/reference-data")}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}