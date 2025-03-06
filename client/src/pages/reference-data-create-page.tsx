import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type {
  ReferenceDataType,
  InsertReferenceDataSet
} from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertReferenceDataSetSchema } from "@shared/schema";
import { useLocation } from "wouter";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export default function ReferenceDataCreatePage() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [selectedTypeId, setSelectedTypeId] = useState<number | undefined>(undefined);
  const [selectedTypeName, setSelectedTypeName] = useState<string | undefined>(undefined);
  const [debugInfo, setDebugInfo] = useState({
    request: null,
    response: null,
    error: null
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

  // Fetch reference types
  const { data: types = [], isLoading } = useQuery<ReferenceDataType[]>({
    queryKey: ["/api/reference-types"],
  });

  const createMutation = useMutation({
    mutationFn: async (payload: InsertReferenceDataSet) => {
      console.log("Creating reference data set with payload:", payload);
      setDebugInfo(prev => ({ ...prev, request: payload }));

      try {
        const response = await fetch("/api/reference-data", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        // Store response status and headers in debug info
        const responseInfo = {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        };

        if (!response.ok) {
          // Check if the response is HTML (which would cause the "unexpected token <" error)
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("text/html")) {
            const htmlContent = await response.text();
            console.error("Server returned HTML instead of JSON:", htmlContent.substring(0, 200));
            setDebugInfo(prev => ({ 
              ...prev, 
              response: responseInfo,
              error: {
                message: "Received HTML instead of JSON",
                content: htmlContent.substring(0, 500)
              }
            }));
            throw new Error(`Server error: Received HTML instead of JSON. Status: ${response.status}`);
          }

          // Regular error handling
          const errorText = await response.text();
          console.error("Error response:", errorText);
          setDebugInfo(prev => ({ 
            ...prev, 
            response: responseInfo,
            error: {
              message: `Failed to create reference data set: ${response.statusText}`,
              content: errorText
            }
          }));
          throw new Error(`Failed to create reference data set: ${response.statusText}. ${errorText}`);
        }

        const responseData = await response.json();
        setDebugInfo(prev => ({ 
          ...prev, 
          response: { ...responseInfo, data: responseData },
          error: null
        }));
        return responseData;
      } catch (error) {
        console.error("Create mutation error:", error);
        if (!debugInfo.error) {
          setDebugInfo(prev => ({ 
            ...prev, 
            error: {
              message: error.message || "Unknown error",
              stack: error.stack
            }
          }));
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Successfully created reference data set:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/reference-data"] });
      toast({
        title: "Success",
        description: "Reference Data Set has been created. You can now add schema instances.",
      });
      setLocation("/reference-data");
    },
    onError: (error: Error) => {
      console.error("Error creating reference data set:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create Reference Data Set.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertReferenceDataSet) => {
    console.log("Form submitted:", data);

    // Validate and convert typeId
    const typeId = Number(data.typeId);

    if (isNaN(typeId)) {
      console.error("Invalid typeId:", data.typeId);
      toast({
        title: "Validation Error",
        description: "Invalid reference type selected",
        variant: "destructive",
      });
      return;
    }

    console.log("TypeId value:", typeId, "Type:", typeof typeId);

    const payload = {
      ...data,
      typeId: typeId,
      data: {} // Ensure data field is initialized
    };

    console.log("Submitting form with data:", payload);
    console.log("TypeId type:", typeof payload.typeId);
    createMutation.mutate(payload);
  }

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
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => setLocation("/reference-data")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reference Data
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Reference Data Set</CardTitle>
            {selectedTypeId && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                <h3 className="text-sm font-medium text-blue-800">Debug Info:</h3>
                <p className="text-sm">Selected Type ID: <span className="font-mono bg-blue-100 px-1 rounded">{selectedTypeId}</span> (Type: {typeof selectedTypeId})</p>
                <p className="text-sm">Selected Type Name: <span className="font-mono bg-blue-100 px-1 rounded">{selectedTypeName}</span></p>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter name" {...field} />
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
                        <Textarea
                          placeholder="Enter description (optional)"
                          {...field}
                        />
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
                      <FormLabel>Reference Data Type</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          const numValue = Number(value);
                          console.log("Selected type ID:", numValue, "Type:", typeof numValue);
                          field.onChange(numValue);
                          setSelectedTypeId(numValue);
                          // Find the selected type name for display
                          const selectedType = types.find(type => type.id === numValue);
                          setSelectedTypeName(selectedType?.name);
                        }}
                        defaultValue={field.value?.toString()}
                        required
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a reference data type" />
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

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Reference Data Set
                </Button>
              </form>
            </Form>

        {/* Debug Panel */}
        <div className="mt-12 border rounded-md">
          <div className="p-4 bg-gray-100 border-b font-medium flex justify-between items-center">
            <span>Debug Panel</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setDebugInfo({ request: null, response: null, error: null })}
            >
              Clear
            </Button>
          </div>
          <div className="p-4 max-h-[500px] overflow-auto">
            <div className="space-y-4">
              {debugInfo.request && (
                <div>
                  <h3 className="font-medium text-blue-600 mb-2">API Request:</h3>
                  <pre className="bg-gray-50 p-3 rounded-md text-xs overflow-auto">
                    {JSON.stringify(debugInfo.request, null, 2)}
                  </pre>
                </div>
              )}

              {debugInfo.response && (
                <div>
                  <h3 className="font-medium text-green-600 mb-2">API Response:</h3>
                  <div className="bg-gray-50 p-3 rounded-md mb-2 text-xs">
                    <p><strong>Status:</strong> {debugInfo.response.status} {debugInfo.response.statusText}</p>
                    <details>
                      <summary className="cursor-pointer">Response Headers</summary>
                      <pre className="mt-2">
                        {JSON.stringify(debugInfo.response.headers, null, 2)}
                      </pre>
                    </details>
                  </div>
                  {debugInfo.response.data && (
                    <pre className="bg-gray-50 p-3 rounded-md text-xs overflow-auto">
                      {JSON.stringify(debugInfo.response.data, null, 2)}
                    </pre>
                  )}
                </div>
              )}

              {debugInfo.error && (
                <div>
                  <h3 className="font-medium text-red-600 mb-2">Error:</h3>
                  <div className="bg-red-50 p-3 rounded-md text-xs">
                    <p className="font-bold">{debugInfo.error.message}</p>
                    {debugInfo.error.content && (
                      <details>
                        <summary className="cursor-pointer mt-2">Error Content</summary>
                        <pre className="mt-2 overflow-auto">
                          {debugInfo.error.content}
                        </pre>
                      </details>
                    )}
                    {debugInfo.error.stack && (
                      <details>
                        <summary className="cursor-pointer mt-2">Stack Trace</summary>
                        <pre className="mt-2 overflow-auto">
                          {debugInfo.error.stack}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              )}

              {!debugInfo.request && !debugInfo.response && !debugInfo.error && (
                <p className="text-gray-500 text-center py-4">No debugging information available yet. Submit the form to see request and response details.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}