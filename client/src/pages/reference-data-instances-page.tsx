import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type {
  ReferenceDataType,
  ReferenceDataSet,
  ReferenceDataTypeSchema
} from "@shared/schema";
import { useLocation } from "wouter";
import { useState, useRef } from "react";

export default function ReferenceDataInstancesPage() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Get the data set ID from the URL
  const params = new URLSearchParams(window.location.search);
  const dataSetId = Number(params.get("id"));

  // Fetch the reference data set
  const { data: dataSet, isLoading: isLoadingDataSet } = useQuery<ReferenceDataSet>({
    queryKey: ["/api/reference-data", dataSetId],
    enabled: !!dataSetId && !isNaN(dataSetId),
  });

  // Fetch the reference type and its schemas
  const { data: type, isLoading: isLoadingType } = useQuery<ReferenceDataType>({
    queryKey: ["/api/reference-types", dataSet?.typeId],
    enabled: !!dataSet?.typeId,
  });

  const { data: schemas = [], isLoading: isLoadingSchemas } = useQuery<ReferenceDataTypeSchema[]>({
    queryKey: ["/api/reference-types", dataSet?.typeId, "schemas"],
    enabled: !!dataSet?.typeId,
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      console.log('Uploading file:', formData.get('file')); // Debug log
      const res = await fetch(`/api/reference-data/${dataSetId}/bulk-upload`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type, let the browser set it with the boundary
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Upload failed');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reference-data", dataSetId] });
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast({
        title: "Success",
        description: "Data instances have been uploaded successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload data instances.",
        variant: "destructive",
      });
    },
  });

  // Add debug logs for data
  console.log('Current dataSet:', dataSet);
  console.log('Current schemas:', schemas);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('Selected file:', file.name, file.type); // Debug log
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);
    console.log('Uploading file:', selectedFile.name); // Debug log
    uploadMutation.mutate(formData);
  };

  const downloadTemplate = () => {
    // Download the pre-filled template with sample data
    window.location.href = `/api/reference-data/${dataSetId}/template`;
  };

  // Safely get the instances count, handling null/undefined data
  const instancesCount = dataSet?.data ? Object.keys(dataSet.data).length : 0;
  console.log('Instances count:', instancesCount);

  if (isLoadingDataSet || isLoadingType || isLoadingSchemas) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!dataSet) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center">
            <h2 className="text-lg font-medium">Reference Data Set not found</h2>
            <Button
              variant="ghost"
              onClick={() => setLocation("/reference-data")}
              className="mt-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Reference Data
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }


  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
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
            <CardTitle>Manage Data Instances - {dataSet.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Schema Definition Section */}
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-medium">Schema Definition</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Field Name</TableHead>
                      <TableHead>Data Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schemas.map((schema) => (
                      <TableRow key={schema.id}>
                        <TableCell>{schema.name}</TableCell>
                        <TableCell>{schema.dataType}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Bulk Upload Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Bulk Upload</h3>
                  <Button onClick={downloadTemplate} variant="outline">
                    Download Template
                  </Button>
                </div>
                <div className="flex gap-4">
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                  />
                  <Button
                    onClick={handleUpload}
                    disabled={!selectedFile || uploadMutation.isPending}
                  >
                    {uploadMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Upload
                  </Button>
                </div>
              </div>

              {/* Current Instances Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  Current Instances ({instancesCount})
                </h3>
                {instancesCount > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {schemas.map((schema) => (
                          <TableHead key={schema.id}>{schema.name}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(dataSet.data || {}).map(([key, values]: [string, any]) => (
                        <TableRow key={key}>
                          {schemas.map((schema) => (
                            <TableCell key={schema.id}>
                              {values[schema.name]}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No instances available. Use the bulk upload feature above to add data.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}