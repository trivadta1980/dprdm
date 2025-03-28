import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDownIcon, ChevronRightIcon, XIcon } from "lucide-react";
import { createContext, useContext, useState, ReactNode } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ErrorDetails } from "./debug-error-details";

// Define error interface
export interface DebugError {
  id?: string;
  message: string;
  type: "request" | "response" | "parsing" | "network" | "authentication" | "unknown";
  url?: string;
  status?: number;
  timestamp?: Date;
  responsePreview?: string;
  stack?: string;
  details?: Record<string, any>;
}

// Create context type
interface DebugErrorContextType {
  errors: DebugError[];
  addError: (error: DebugError) => void;
  clearErrors: () => void;
  removeError: (id: string) => void;
}

// Create context
const DebugErrorContext = createContext<DebugErrorContextType | undefined>(undefined);

// Provider component
export function DebugErrorProvider({ children }: { children: ReactNode }) {
  const [errors, setErrors] = useState<DebugError[]>([]);

  const addError = (error: DebugError) => {
    const newError = {
      ...error,
      id: `error-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date(),
    };
    
    // Log to console for additional debugging
    console.error(`[Debug Error] ${newError.message}`, newError);
    
    setErrors(prev => [newError, ...prev].slice(0, 20)); // Keep last 20 errors
  };

  const clearErrors = () => {
    setErrors([]);
  };

  const removeError = (id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  };

  return (
    <DebugErrorContext.Provider value={{ errors, addError, clearErrors, removeError }}>
      {children}
      <DebugErrorPanel />
    </DebugErrorContext.Provider>
  );
}

// Hook to use the error context
export function useDebugErrors() {
  const context = useContext(DebugErrorContext);
  if (context === undefined) {
    throw new Error("useDebugErrors must be used within a DebugErrorProvider");
  }
  return context;
}

// Panel component to display errors
function DebugErrorPanel() {
  const { errors, clearErrors, removeError } = useDebugErrors();
  const [isOpen, setIsOpen] = useState(false);
  
  if (errors.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md w-full shadow-xl rounded-lg border bg-background">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-primary/20 to-primary/5 rounded-t-lg">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="p-1">
              {isOpen ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          
          <div className="font-medium flex items-center gap-2">
            <span className="text-destructive text-sm">Debug Error Panel</span>
            <Badge variant="destructive" className="text-xs">{errors.length}</Badge>
          </div>
          
          <div className="flex">
            <Button variant="ghost" size="sm" className="p-1" onClick={clearErrors}>
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <CollapsibleContent>
          <ScrollArea className="max-h-[60vh] overflow-y-auto p-2">
            <div className="space-y-2 p-2">
              {errors.map((error) => (
                <Alert key={error.id} variant="destructive" className="relative">
                  <button
                    className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                    onClick={() => error.id && removeError(error.id)}
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                  
                  <AlertTitle className="flex items-center gap-2 font-semibold text-sm">
                    <span>{getErrorTypeLabel(error.type)}</span>
                    <span className="text-xs opacity-60">
                      {error.timestamp?.toLocaleTimeString()}
                    </span>
                  </AlertTitle>
                  
                  <AlertDescription className="text-sm">
                    <ErrorDetails error={error} />
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </ScrollArea>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// Helper to get friendly error type labels
function getErrorTypeLabel(type: DebugError['type']): string {
  switch (type) {
    case 'request':
      return 'Request Error';
    case 'response':
      return 'Response Error';
    case 'parsing':
      return 'Parsing Error';
    case 'network':
      return 'Network Error';
    case 'authentication':
      return 'Authentication Error';
    default:
      return 'Unknown Error';
  }
}