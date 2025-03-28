import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useDebugApi } from "@/hooks/use-debug-api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BugIcon, RefreshCcwIcon, AlertCircleIcon, CheckIcon, XIcon, ShieldIcon, ShieldOffIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * DiagnosticsPage
 * 
 * This page is not included in the navigation and is used for diagnostics
 * and troubleshooting in production environments.
 */
export default function DiagnosticsPage() {
  const { toast } = useToast();
  const debugApi = useDebugApi();
  const [activeTab, setActiveTab] = useState('auth');
  const [authInfo, setAuthInfo] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [mirrored, setMirrored] = useState<any>(null);
  const [mirrorLoading, setMirrorLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState<any>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [testResponse, setTestResponse] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [targetDatasetId, setTargetDatasetId] = useState<string>('27');

  const runAuthTest = async () => {
    try {
      setAuthLoading(true);
      const result = await debugApi.debugFetch('/api/diagnostics/auth-test');
      setAuthInfo(result);
      toast({
        title: "Authentication Test Complete",
        description: "Successfully retrieved authentication information.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to test authentication",
        variant: "destructive",
      });
      // Still record the error
      setAuthInfo({ error: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setAuthLoading(false);
    }
  };

  const runMirrorTest = async () => {
    try {
      setMirrorLoading(true);
      const result = await debugApi.debugFetch('/api/diagnostics/mirror');
      setMirrored(result);
      toast({
        title: "Request Mirror Complete",
        description: "Successfully mirrored the request information.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to mirror request",
        variant: "destructive",
      });
      setMirrored({ error: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setMirrorLoading(false);
    }
  };

  const runRoutesTest = async () => {
    try {
      setRouteLoading(true);
      const result = await debugApi.debugFetch('/api/diagnostics/routes');
      setRouteInfo(result);
      toast({
        title: "Routes Test Complete",
        description: "Successfully retrieved registered routes.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to test routes",
        variant: "destructive",
      });
      setRouteInfo({ error: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setRouteLoading(false);
    }
  };

  const runEndpointTest = async () => {
    try {
      setTestLoading(true);
      const result = await debugApi.debugFetch(`/api/diagnostics/test-crosswalks-by-target/${targetDatasetId}`);
      setTestResponse(result);
      toast({
        title: "Endpoint Test Complete",
        description: "Successfully tested the endpoint.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to test endpoint",
        variant: "destructive",
      });
      setTestResponse({ error: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setTestLoading(false);
    }
  };

  const testProblematicEndpoint = async () => {
    try {
      toast({
        title: "Testing Problematic Endpoint",
        description: "Fetching from the potentially problematic endpoint...",
      });
      
      await fetch(`/api/crosswalks/by-target/${targetDatasetId}`, {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      }).then(async (response) => {
        // Get as text first to check if it's HTML
        const text = await response.text();
        
        // Check if it's HTML
        if (text.includes('<!DOCTYPE html>') || text.includes('<html>')) {
          setTestResponse({
            status: response.status,
            error: "Received HTML instead of JSON (likely due to authentication redirect)",
            isHtml: true,
            preview: text.substring(0, 200) + '...'
          });
          
          toast({
            title: "HTML Response Detected",
            description: "The endpoint returned HTML instead of JSON, indicating an authentication issue.",
            variant: "destructive"
          });
        } else {
          // Try to parse as JSON
          try {
            const jsonData = JSON.parse(text);
            setTestResponse({
              status: response.status,
              success: true,
              data: jsonData,
              isJson: true
            });
            
            toast({
              title: "Success",
              description: "The endpoint returned valid JSON data."
            });
          } catch (e) {
            setTestResponse({
              status: response.status,
              error: "Received non-HTML text that couldn't be parsed as JSON",
              isJson: false,
              isHtml: false,
              preview: text.substring(0, 200) + '...'
            });
            
            toast({
              title: "Invalid Response",
              description: "The response is neither valid JSON nor HTML.",
              variant: "destructive"
            });
          }
        }
      });
    } catch (error) {
      toast({
        title: "Network Error",
        description: error instanceof Error ? error.message : "Failed to fetch from the endpoint",
        variant: "destructive"
      });
      
      setTestResponse({
        error: error instanceof Error ? error.message : "Unknown network error"
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <BugIcon className="h-8 w-8 mr-3 text-primary" />
        <h1 className="text-3xl font-bold">API Diagnostics</h1>
      </div>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
        <div className="flex items-start">
          <AlertCircleIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-yellow-800">Diagnostic Tools</h3>
            <p className="text-sm text-yellow-700 mt-1">
              This page contains diagnostic tools for troubleshooting API and authentication issues in production.
              These tools are not intended for regular use and may expose sensitive technical information.
            </p>
          </div>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="auth">Auth Diagnostics</TabsTrigger>
          <TabsTrigger value="request">Request Mirror</TabsTrigger>
          <TabsTrigger value="routes">Route Registration</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoint Tests</TabsTrigger>
        </TabsList>
        
        <TabsContent value="auth">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShieldIcon className="h-5 w-5 mr-2 text-primary" />
                Authentication Status Test
              </CardTitle>
              <CardDescription>
                Tests the current authentication status by making a request to a protected endpoint.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={runAuthTest} 
                disabled={authLoading}
                className="mb-4"
              >
                {authLoading ? 
                  <><RefreshCcwIcon className="h-4 w-4 mr-2 animate-spin" /> Testing Authentication...</> : 
                  <><ShieldIcon className="h-4 w-4 mr-2" /> Test Authentication</>
                }
              </Button>
              
              {authInfo && (
                <div className="mt-4 border rounded-md p-4 bg-muted/10">
                  <h3 className="font-semibold text-lg mb-2">Authentication Result</h3>
                  {authInfo.error ? (
                    <div className="text-red-500 flex items-center">
                      <XIcon className="h-4 w-4 mr-2" /> 
                      <span>Error: {authInfo.error}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center mb-2">
                        {authInfo.authenticated ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center">
                            <CheckIcon className="h-3 w-3 mr-1" /> Authenticated
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center">
                            <XIcon className="h-3 w-3 mr-1" /> Not Authenticated
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm mt-4">
                        <div className="font-medium">Session ID:</div>
                        <div className="font-mono bg-muted p-1 rounded">{authInfo.sessionID || 'None'}</div>
                        
                        <div className="font-medium">User:</div>
                        <div className="font-mono bg-muted p-1 rounded">
                          {authInfo.user ? JSON.stringify(authInfo.user, null, 2) : 'No user information'}
                        </div>
                        
                        <div className="font-medium">Timestamp:</div>
                        <div>{authInfo.timestamp}</div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="request">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <RefreshCcwIcon className="h-5 w-5 mr-2 text-primary" />
                Request Mirror
              </CardTitle>
              <CardDescription>
                Shows exactly what the server receives from your browser, helping to identify missing headers or cookies.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={runMirrorTest} 
                disabled={mirrorLoading}
                className="mb-4"
              >
                {mirrorLoading ? 
                  <><RefreshCcwIcon className="h-4 w-4 mr-2 animate-spin" /> Mirroring Request...</> : 
                  <><RefreshCcwIcon className="h-4 w-4 mr-2" /> Mirror Request</>
                }
              </Button>
              
              {mirrored && (
                <div className="mt-4 border rounded-md p-4 bg-muted/10">
                  <h3 className="font-semibold text-lg mb-2">Request Information</h3>
                  {mirrored.error ? (
                    <div className="text-red-500">{mirrored.error}</div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground">REQUEST DETAILS</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm mt-1">
                          <div className="font-medium">URL:</div>
                          <div className="font-mono bg-muted p-1 rounded">{mirrored.url}</div>
                          
                          <div className="font-medium">Method:</div>
                          <div className="font-mono bg-muted p-1 rounded">{mirrored.method}</div>
                          
                          <div className="font-medium">Path:</div>
                          <div className="font-mono bg-muted p-1 rounded">{mirrored.path}</div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground">AUTHENTICATION</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm mt-1">
                          <div className="font-medium">Authenticated:</div>
                          <div className="font-mono bg-muted p-1 rounded">
                            {mirrored.isAuthenticated === true ? (
                              <span className="text-green-600">Yes</span>
                            ) : mirrored.isAuthenticated === false ? (
                              <span className="text-red-600">No</span>
                            ) : (
                              <span className="text-yellow-600">{mirrored.isAuthenticated}</span>
                            )}
                          </div>
                          
                          <div className="font-medium">Session ID:</div>
                          <div className="font-mono bg-muted p-1 rounded">
                            {mirrored.sessionID || 'None'}
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground">HEADERS</h4>
                        <div className="bg-muted rounded-md p-2 mt-1 max-h-40 overflow-y-auto">
                          <pre className="text-xs font-mono">
                            {JSON.stringify(mirrored.headers, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="routes">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircleIcon className="h-5 w-5 mr-2 text-primary" />
                API Route Registration
              </CardTitle>
              <CardDescription>
                Shows all registered API routes and their middleware configurations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={runRoutesTest} 
                disabled={routeLoading}
                className="mb-4"
              >
                {routeLoading ? 
                  <><RefreshCcwIcon className="h-4 w-4 mr-2 animate-spin" /> Loading Routes...</> : 
                  <><AlertCircleIcon className="h-4 w-4 mr-2" /> Get Routes</>
                }
              </Button>
              
              {routeInfo && (
                <div className="mt-4 border rounded-md p-4 bg-muted/10">
                  <h3 className="font-semibold text-lg mb-2">Registered Routes</h3>
                  {routeInfo.error ? (
                    <div className="text-red-500">{routeInfo.error}</div>
                  ) : (
                    <div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Found {routeInfo.routes?.length || 0} registered routes
                      </p>
                      
                      <div className="mt-4 max-h-96 overflow-y-auto border rounded-md">
                        <Accordion type="multiple" className="w-full">
                          {routeInfo.routes?.map((route: any, index: number) => (
                            <AccordionItem value={`route-${index}`} key={index}>
                              <AccordionTrigger className="px-4 py-2 hover:bg-muted/40 text-left font-medium">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-sm">{route.path}</span>
                                  <div className="flex gap-1">
                                    {route.methods?.map((method: string) => (
                                      <Badge key={method} variant="outline" className="text-xs">
                                        {method.toUpperCase()}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-4 py-2 bg-muted/5">
                                <div className="text-sm">
                                  <div className="mb-2">
                                    <span className="font-medium">Path:</span> 
                                    <span className="font-mono ml-2">{route.path}</span>
                                  </div>
                                  <div className="mb-2">
                                    <span className="font-medium">Methods:</span> 
                                    <span className="font-mono ml-2">{route.methods?.join(', ')}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium">Middleware:</span>
                                    {route.middleware && route.middleware.length > 0 ? (
                                      <ul className="list-disc list-inside ml-2 mt-1">
                                        {route.middleware.map((mw: string, idx: number) => (
                                          <li key={idx} className="font-mono text-xs">
                                            {mw}
                                            {mw === 'requireAuth' && (
                                              <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-100">
                                                Protected
                                              </Badge>
                                            )}
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <span className="text-muted-foreground ml-2">None specified</span>
                                    )}
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="endpoints">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircleIcon className="h-5 w-5 mr-2 text-primary" />
                Crosswalks By Target Endpoint Test
              </CardTitle>
              <CardDescription>
                Tests the problematic endpoint for authentication issues.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <div className="w-32">
                  <input
                    type="text"
                    value={targetDatasetId}
                    onChange={(e) => setTargetDatasetId(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    placeholder="Dataset ID"
                  />
                </div>
                <Button 
                  onClick={runEndpointTest} 
                  disabled={testLoading}
                  variant="outline"
                >
                  {testLoading ? 
                    <><RefreshCcwIcon className="h-4 w-4 mr-2 animate-spin" /> Testing...</> : 
                    <><AlertCircleIcon className="h-4 w-4 mr-2" /> Test Diagnostic Route</>
                  }
                </Button>
                <Button 
                  onClick={testProblematicEndpoint} 
                  disabled={testLoading}
                  variant="default"
                >
                  <ShieldOffIcon className="h-4 w-4 mr-2" /> Test Actual Endpoint
                </Button>
              </div>
              
              {testResponse && (
                <div className="mt-4 border rounded-md p-4 bg-muted/10">
                  <h3 className="font-semibold text-lg mb-2">Endpoint Test Result</h3>
                  {testResponse.error ? (
                    <div>
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 mb-2">
                        Error
                      </Badge>
                      <p className="text-red-500">{testResponse.error}</p>
                      
                      {testResponse.isHtml && (
                        <div className="mt-4">
                          <h4 className="font-medium mb-1">HTML Response Preview:</h4>
                          <pre className="text-xs font-mono bg-muted p-2 rounded-md overflow-x-auto max-h-32 overflow-y-auto">
                            {testResponse.preview}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 mb-2">
                        Success
                      </Badge>
                      
                      <pre className="text-xs font-mono bg-muted p-2 rounded-md overflow-x-auto max-h-96 overflow-y-auto">
                        {JSON.stringify(testResponse, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}