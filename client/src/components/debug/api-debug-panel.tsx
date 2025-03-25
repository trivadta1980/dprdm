import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Maximize2, Minimize2, Code } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

// Define types for API request tracking
export interface ApiRequest {
  id: string;
  url: string;
  method: string;
  timestamp: Date;
  data?: any;
  response?: {
    status: number;
    statusText: string;
    data: any;
    timestamp: Date;
  };
  error?: {
    message: string;
  };
  duration?: number;
}

// Main Debug Panel Component
export default function ApiDebugPanel({
  requests = [],
  title = "API Debug Panel",
  allowToggle = true
}: {
  requests: ApiRequest[];
  title?: string;
  allowToggle?: boolean;
}) {
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  
  // Toggle visibility of details for a specific request
  const toggleItemExpanded = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  // Helper function to format JSON
  const formatJson = (data: any): string => {
    try {
      return JSON.stringify(data, null, 2);
    } catch (e) {
      return String(data);
    }
  };
  
  // If panel is not visible, show toggle button
  if (!isVisible && allowToggle) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50 opacity-70 hover:opacity-100 bg-background flex items-center gap-2"
        onClick={() => setIsVisible(true)}
      >
        <Code size={16} />
        <span>Show API Debug</span>
      </Button>
    );
  }
  
  if (!isVisible) {
    return null;
  }
  
  return (
    <Card className="w-full h-full mt-4 border shadow-md">
      <CardHeader className="p-3 flex flex-row items-center justify-between space-y-0 bg-muted/20">
        <CardTitle className="text-sm flex items-center gap-2">
          <Code size={16} />
          {title}
          <Badge variant="outline" className="ml-2">
            {requests.length} requests
          </Badge>
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          </Button>
          {allowToggle && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
              onClick={() => setIsVisible(false)}
            >
              <X size={14} />
            </Button>
          )}
        </div>
      </CardHeader>
      
      {!isMinimized && (
        <CardContent className="p-2">
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {requests.length > 0 ? (
                requests.map((request) => (
                  <div key={request.id} className="border rounded-md overflow-hidden">
                    {/* Header */}
                    <div 
                      className="p-2 flex items-center justify-between cursor-pointer hover:bg-muted/20"
                      onClick={() => toggleItemExpanded(request.id)}
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`${request.method === 'GET' ? 'bg-blue-100 text-blue-800' : 
                                      request.method === 'POST' ? 'bg-green-100 text-green-800' : 
                                      request.method === 'PUT' || request.method === 'PATCH' ? 'bg-yellow-100 text-yellow-800' : 
                                      request.method === 'DELETE' ? 'bg-red-100 text-red-800' : 'bg-gray-100'}`}
                        >
                          {request.method}
                        </Badge>
                        <span className="text-sm truncate max-w-[200px] md:max-w-[300px] lg:max-w-[400px]">
                          {request.url}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {request.response && (
                          <Badge 
                            variant="outline" 
                            className={request.response.status >= 400 
                              ? "bg-red-100 text-red-800" 
                              : "bg-green-100 text-green-800"}
                          >
                            {request.response.status}
                          </Badge>
                        )}
                        {request.error && (
                          <Badge variant="outline" className="bg-red-100 text-red-800">
                            Error
                          </Badge>
                        )}
                        {request.duration !== undefined && (
                          <span className="text-xs text-muted-foreground">
                            {request.duration}ms
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(request.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    
                    {/* Details */}
                    {expandedItems[request.id] && (
                      <div className="p-2 border-t bg-muted/5 text-xs">
                        <div className="space-y-2">
                          <div>
                            <h4 className="font-semibold">Request:</h4>
                            <div className="bg-muted/20 p-2 rounded space-y-1">
                              <div><span className="font-medium">URL:</span> {request.url}</div>
                              <div><span className="font-medium">Method:</span> {request.method}</div>
                              {request.data && (
                                <div>
                                  <div className="font-medium">Payload:</div>
                                  <pre className="bg-muted/30 p-1 rounded overflow-auto max-h-[100px] text-xs">
                                    {formatJson(request.data)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {request.response && (
                            <div>
                              <h4 className="font-semibold">Response:</h4>
                              <div className="bg-muted/20 p-2 rounded space-y-1">
                                <div>
                                  <span className="font-medium">Status:</span> {request.response.status} {request.response.statusText}
                                </div>
                                {request.duration !== undefined && (
                                  <div><span className="font-medium">Duration:</span> {request.duration}ms</div>
                                )}
                                <div>
                                  <div className="font-medium">Data:</div>
                                  <pre className="bg-muted/30 p-1 rounded overflow-auto max-h-[200px] text-xs">
                                    {formatJson(request.response.data)}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {request.error && (
                            <div>
                              <h4 className="font-semibold">Error:</h4>
                              <div className="bg-red-50 text-red-800 p-2 rounded">
                                {request.error.message}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No API requests to display.
                  <p className="text-sm mt-2">Make API calls to see them here.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      )}
    </Card>
  );
}