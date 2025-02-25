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

export default function ReferenceDataCreatePage() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  const form = useForm<InsertReferenceDataSet>({
    resolver: zodResolver(insertReferenceDataSetSchema),
    defaultValues: {
      name: "",
      description: "",
      data: {},
    },
  });

  // Fetch reference types
  const { data: types = [], isLoading } = useQuery<ReferenceDataType[]>({
    queryKey: ["/api/reference-types"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertReferenceDataSet) => {
      const res = await apiRequest("POST", "/api/reference-data", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reference-data"] });
      toast({
        title: "Success",
        description: "Reference Data Set has been created. You can now add schema instances.",
      });
      setLocation("/reference-data");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create Reference Data Set.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: InsertReferenceDataSet) {
    // Initialize with empty data object since instances will be added later
    createMutation.mutate({
      ...data,
      data: {},
    });
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
            <CardTitle>Create New Reference Data Set 1</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter a name for this data set" />
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
                        <Input {...field} value={field.value || ""} placeholder="Enter a description" />
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
                        value={field.value?.toString()}
                        onValueChange={(value) => {
                          field.onChange(Number(value));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
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