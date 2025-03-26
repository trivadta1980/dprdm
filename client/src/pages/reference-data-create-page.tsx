
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
          const errorText = await response.text();
          console.error("Error response from server:", errorText);
          
          // Try to parse if it's JSON
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch (e) {
            errorData = errorText;
          }
          
          setDebugInfo(prev => ({ 
            ...prev, 
            response: { ...responseInfo, error: errorData },
            error: {
              message: `API Error: ${response.status} ${response.statusText}`,
              details: errorData
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

    // Validate and convert typeId
    const typeId = Number(data.typeId);
    if (isNaN(typeId)) {
      toast({
        title: "Validation Error",
        description: "Invalid reference type selected",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      ...data,
      typeId: typeId,
      data: {} // Ensure data field is initialized
    };
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
            <CardTitle>Create New Reference Data Set</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Name field */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter reference data set name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description field */}
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

                {/* Type field */}
                <FormField
                  control={form.control}
                  name="typeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference Data Type</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          const numValue = Number(value);
                          field.onChange(numValue);
                          setSelectedTypeId(numValue);
                          setSelectedTypeName(types.find(t => t.id === numValue)?.name);
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

                {/* Type selection confirmation is shown here */}

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
          </CardContent>
        </Card>

        {/* Debug Panel is hidden */}
      </div>
    </MainLayout>
  );
}
