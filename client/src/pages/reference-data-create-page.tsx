
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

export default function ReferenceDataCreatePage() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

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
    mutationFn: async (data: InsertReferenceDataSet) => {
      console.log("Creating reference data set with payload:", data);
      try {
        const res = await apiRequest("POST", "/api/reference-data", data);
        if (!res.ok) {
          const errorText = await res.text();
          console.error("Error response from server:", errorText);
          throw new Error(`Server error: ${res.status} ${res.statusText}. ${errorText}`);
        }
        return res.json();
      } catch (error) {
        console.error("Exception during reference data set creation:", error);
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

  function onSubmit(data: InsertReferenceDataSet) {
    // Ensure typeId is a number
    const payload = {
      ...data,
      typeId: typeof data.typeId === 'string' ? parseInt(data.typeId, 10) : data.typeId,
      data: {},
    };
    
    console.log("Submitting form with data:", payload);
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
                        onValueChange={field.onChange}
                        defaultValue={field.value?.toString()}
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
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
