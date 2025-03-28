import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { DebugError } from "./debug-error-panel";
import { Badge } from "@/components/ui/badge";

interface ErrorDetailsProps {
  error: DebugError;
}

export function ErrorDetails({ error }: ErrorDetailsProps) {
  // Helper function to determine error badge severity
  const getErrorBadgeVariant = (errorType: DebugError['type']) => {
    switch (errorType) {
      case 'authentication':
        return 'outline';
      case 'network':
        return 'destructive';
      case 'parsing':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <Badge variant={getErrorBadgeVariant(error.type)}>
          {error.type.charAt(0).toUpperCase() + error.type.slice(1)}
        </Badge>
        
        {error.status && (
          <Badge variant={error.status >= 400 ? "destructive" : "default"}>
            Status: {error.status}
          </Badge>
        )}
      </div>

      <div className="text-sm font-medium">
        {error.message}
      </div>
      
      {error.url && (
        <div className="text-xs bg-muted p-2 rounded overflow-x-auto">
          <span className="font-semibold">URL:</span> {error.url}
        </div>
      )}
      
      {error.responsePreview && (
        <Collapsible className="mt-2">
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="w-full h-6 text-xs">
              Response Preview
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <pre className="text-xs p-2 bg-muted rounded mt-1 overflow-x-auto whitespace-pre-wrap">
              {error.responsePreview}
            </pre>
          </CollapsibleContent>
        </Collapsible>
      )}
      
      {error.stack && (
        <Collapsible className="mt-2">
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="w-full h-6 text-xs">
              Stack Trace
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <pre className="text-xs p-2 bg-muted rounded mt-1 overflow-x-auto whitespace-pre-wrap">
              {error.stack}
            </pre>
          </CollapsibleContent>
        </Collapsible>
      )}
      
      {error.details && Object.keys(error.details).length > 0 && (
        <Collapsible className="mt-2">
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="w-full h-6 text-xs">
              Additional Details
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <pre className="text-xs p-2 bg-muted rounded mt-1 overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(error.details, null, 2)}
            </pre>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}