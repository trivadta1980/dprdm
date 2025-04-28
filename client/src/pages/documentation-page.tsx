import { useState, useRef, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { 
  Card, CardContent, CardHeader, CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Accordion, AccordionContent, AccordionItem, AccordionTrigger 
} from "@/components/ui/accordion";
import { useDocumentationSearch } from "@/hooks/use-documentation-search";
import { SearchResults } from "@/components/documentation/search-results";
import { documentationContent } from "@/data/documentation-content";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { 
  Database, GitFork, ArrowRightLeft, FileJson, Users, 
  UserCog, CheckSquare, Key, Info, BookOpen, Search,
  ChevronRight, BarChart3
} from "lucide-react";

/**
 * Documentation Page Component
 * Provides comprehensive documentation for the Reference Data Management platform
 */
export default function DocumentationPage() {
  const [currentTab, setCurrentTab] = useState("getting-started");
  const [searchQuery, setSearchQuery] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Use the search hook to get search results
  const { results, isSearching, hasResults, query } = useDocumentationSearch(searchQuery);

  // Handle selecting a search result
  const handleSelectResult = (tabId: string, sectionId: string, subsectionId?: string) => {
    setCurrentTab(tabId);
    setSearchQuery("");
    
    // We'll let the tab change reset the scroll position via the useEffect below
  };

  // Reset scroll position when tab changes or when search query changes
  useEffect(() => {
    // Check if scrollAreaRef is available
    if (scrollAreaRef.current) {
      // Access the scrollArea's viewport and reset its scroll position
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        (viewport as HTMLElement).scrollTop = 0;
      }
    }
  }, [currentTab, searchQuery]); // This effect runs whenever currentTab or searchQuery changes

  return (
    <MainLayout>
      <div className="container mx-auto py-6 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-3">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Documentation
                </CardTitle>
                <CardDescription>
                  Complete guide to using the RDM platform
                </CardDescription>
                
                {/* Search bar */}
                <div className="relative mt-2">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search documentation..."
                    className="pl-8 w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              
              <CardContent className="p-0 pt-2">
                {/* Scrollable sidebar navigation with max height */}
                <ScrollArea className="h-[calc(100vh-270px)] px-4" type="hover">
                  <nav className="space-y-1 pr-2">
                    <Button 
                      variant={currentTab === "getting-started" ? "default" : "ghost"} 
                      className="w-full justify-start"
                      onClick={() => setCurrentTab("getting-started")}
                    >
                      <Info className="mr-2 h-4 w-4" />
                      Getting Started
                    </Button>
                    
                    <Button 
                      variant={currentTab === "reference-types" ? "default" : "ghost"} 
                      className="w-full justify-start"
                      onClick={() => setCurrentTab("reference-types")}
                    >
                      <FileJson className="mr-2 h-4 w-4" />
                      Reference Data Types
                    </Button>
                    
                    <Button 
                      variant={currentTab === "reference-data" ? "default" : "ghost"} 
                      className="w-full justify-start"
                      onClick={() => setCurrentTab("reference-data")}
                    >
                      <Database className="mr-2 h-4 w-4" />
                      Reference Data
                    </Button>
                    
                    <Button 
                      variant={currentTab === "relationships" ? "default" : "ghost"} 
                      className="w-full justify-start"
                      onClick={() => setCurrentTab("relationships")}
                    >
                      <GitFork className="mr-2 h-4 w-4" />
                      Relationships
                    </Button>
                    
                    <Button 
                      variant={currentTab === "crosswalks" ? "default" : "ghost"} 
                      className="w-full justify-start"
                      onClick={() => setCurrentTab("crosswalks")}
                    >
                      <ArrowRightLeft className="mr-2 h-4 w-4" />
                      Crosswalks
                    </Button>
                    
                    <Button 
                      variant={currentTab === "approvals" ? "default" : "ghost"} 
                      className="w-full justify-start"
                      onClick={() => setCurrentTab("approvals")}
                    >
                      <CheckSquare className="mr-2 h-4 w-4" />
                      Approvals
                    </Button>
                    
                    <Button 
                      variant={currentTab === "administration" ? "default" : "ghost"} 
                      className="w-full justify-start"
                      onClick={() => setCurrentTab("administration")}
                    >
                      <UserCog className="mr-2 h-4 w-4" />
                      Administration
                    </Button>
                    
                    <Button 
                      variant={currentTab === "api-reference" ? "default" : "ghost"} 
                      className="w-full justify-start"
                      onClick={() => setCurrentTab("api-reference")}
                    >
                      <Key className="mr-2 h-4 w-4" />
                      API Reference
                    </Button>
                    
                    {/* Additional navigation items to demonstrate scrolling */}
                    <Button 
                      variant={currentTab === "data-visualization" ? "default" : "ghost"} 
                      className="w-full justify-start"
                      onClick={() => setCurrentTab("data-visualization")}
                    >
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Data Visualization
                    </Button>
                    
                    <Button 
                      variant={currentTab === "data-quality" ? "default" : "ghost"} 
                      className="w-full justify-start"
                      onClick={() => setCurrentTab("data-quality")}
                    >
                      <CheckSquare className="mr-2 h-4 w-4" />
                      Data Quality
                    </Button>
                    
                    <Button 
                      variant={currentTab === "integrations" ? "default" : "ghost"} 
                      className="w-full justify-start"
                      onClick={() => setCurrentTab("integrations")}
                    >
                      <GitFork className="mr-2 h-4 w-4" />
                      Integrations
                    </Button>
                    
                    <Button 
                      variant={currentTab === "advanced-features" ? "default" : "ghost"} 
                      className="w-full justify-start"
                      onClick={() => setCurrentTab("advanced-features")}
                    >
                      <Key className="mr-2 h-4 w-4" />
                      Advanced Features
                    </Button>
                  </nav>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
          
          {/* Main content */}
          <div className="md:col-span-9">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>
                  {currentTab === "getting-started" && "Getting Started"}
                  {currentTab === "reference-types" && "Reference Data Types"}
                  {currentTab === "reference-data" && "Reference Data"}
                  {currentTab === "relationships" && "Relationships"}
                  {currentTab === "crosswalks" && "Crosswalks"}
                  {currentTab === "approvals" && "Approvals"}
                  {currentTab === "administration" && "Administration"}
                  {currentTab === "api-reference" && "API Reference"}
                  {currentTab === "data-visualization" && "Data Visualization"}
                  {currentTab === "data-quality" && "Data Quality"}
                  {currentTab === "integrations" && "Integrations"}
                  {currentTab === "advanced-features" && "Advanced Features"}
                  {searchQuery.trim() !== "" && "Search Results"}
                </CardTitle>
                <CardDescription>
                  {searchQuery.trim() !== "" ? 
                    `Search results for "${searchQuery}"` :
                    "Reference Data Management documentation and guides"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea ref={scrollAreaRef} className="h-[calc(100vh-230px)]" type="always">
                  <div className="px-6 pb-6">
                    {/* Show search results when there's a search query, otherwise show regular content */}
                    {searchQuery.trim() !== "" ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h2 className="text-2xl font-bold">Search Results</h2>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSearchQuery("")}
                            className="text-muted-foreground"
                          >
                            Clear Search
                          </Button>
                        </div>
                        <Separator className="my-4" />
                        
                        {isSearching ? (
                          <div className="py-8 text-center text-muted-foreground">
                            Searching documentation...
                          </div>
                        ) : (
                          <SearchResults 
                            results={results} 
                            query={query}
                            onSelectResult={handleSelectResult}
                          />
                        )}
                      </div>
                    ) : (
                      // Regular documentation content when not searching
                      <>
                        {currentTab === "getting-started" && (
                          <div>
                            <GettingStartedContent />
                          </div>
                        )}
                        
                        {currentTab === "reference-types" && (
                          <div>
                            <ReferenceTypesContent />
                          </div>
                        )}
                        
                        {currentTab === "reference-data" && (
                          <div>
                            <ReferenceDataContent />
                          </div>
                        )}
                        
                        {currentTab === "relationships" && (
                          <div>
                            <RelationshipsContent />
                          </div>
                        )}
                        
                        {currentTab === "crosswalks" && (
                          <div>
                            <CrosswalksContent />
                          </div>
                        )}
                        
                        {currentTab === "approvals" && (
                          <div>
                            <ApprovalsContent />
                          </div>
                        )}
                        
                        {currentTab === "administration" && (
                          <div>
                            <AdministrationContent />
                          </div>
                        )}
                        
                        {currentTab === "api-reference" && (
                          <div>
                            <ApiReferenceContent />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

// Content components for each documentation section

function GettingStartedContent() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-4">Getting Started with Reference Data Management</h2>
        <p className="text-lg text-muted-foreground mb-6">
          Welcome to the Reference Data Management (RDM) platform. This guide will help you understand 
          the system and how to get started with managing your reference data effectively.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>What is Reference Data Management?</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Reference Data Management (RDM) is a system designed to create, maintain, and 
            distribute reference data across your organization. Reference data includes lists 
            of allowed values, hierarchies, and mappings between different systems' codes.
          </p>
          <p className="mt-4">
            Our platform helps you:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Create and maintain standardized reference data</li>
            <li>Establish relationships between different data sets</li>
            <li>Map codes between different systems (crosswalks)</li>
            <li>Govern changes through approval workflows</li>
            <li>Visualize data relationships</li>
            <li>Access reference data through APIs</li>
          </ul>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Key Concepts</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="reference-types">
              <AccordionTrigger className="text-md font-medium">
                Reference Data Types
              </AccordionTrigger>
              <AccordionContent>
                <p>
                  Reference Data Types define the structure (schema) of your reference data. 
                  They specify what fields or attributes each type of reference data should have.
                </p>
                <p className="mt-2">
                  For example, a "Country" reference data type might include fields like "Code", 
                  "Name", "ISO-3 Code", and "Continent".
                </p>
                <div className="mt-4 flex justify-end">
                  <Link href="/reference-types">
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      Learn More <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="reference-data">
              <AccordionTrigger className="text-md font-medium">
                Reference Data Sets
              </AccordionTrigger>
              <AccordionContent>
                <p>
                  Reference Data Sets are collections of reference data instances that conform to a 
                  specific Reference Data Type. Each data set contains multiple instances (records) 
                  of a particular type of reference data.
                </p>
                <p className="mt-2">
                  For example, a "Countries" data set would contain multiple country records, each 
                  with data matching the "Country" reference data type structure.
                </p>
                <div className="mt-4 flex justify-end">
                  <Link href="/reference-data">
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      Learn More <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="relationships">
              <AccordionTrigger className="text-md font-medium">
                Relationships
              </AccordionTrigger>
              <AccordionContent>
                <p>
                  Relationships define how records in different reference data sets relate to 
                  each other. They capture the associations between different types of reference data.
                </p>
                <p className="mt-2">
                  For example, a relationship might connect "Country" records to "Currency" records, 
                  indicating which currency is used in each country.
                </p>
                <div className="mt-4 flex justify-end">
                  <Link href="/relationships">
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      Learn More <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

function ReferenceTypesContent() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-4">Reference Data Types</h2>
        <p className="text-lg text-muted-foreground mb-6">
          Reference Data Types define the structure and attributes of your reference data.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Creating Reference Data Types</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            To create a new Reference Data Type, you'll need to define its schema by specifying 
            the fields that will be included and their data types.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ReferenceDataContent() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-4">Reference Data Sets</h2>
        <p className="text-lg text-muted-foreground mb-6">
          Reference Data Sets contain the actual reference data values used in your organization.
        </p>
      </div>
    </div>
  );
}

function RelationshipsContent() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-4">Relationships</h2>
        <p className="text-lg text-muted-foreground mb-6">
          Relationships connect records from different reference data sets to each other.
        </p>
      </div>
    </div>
  );
}

function CrosswalksContent() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-4">Crosswalks</h2>
        <p className="text-lg text-muted-foreground mb-6">
          Crosswalks map values between different reference data sets and systems.
        </p>
      </div>
    </div>
  );
}

function ApprovalsContent() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-4">Approvals</h2>
        <p className="text-lg text-muted-foreground mb-6">
          The approval process ensures data quality and governance.
        </p>
      </div>
    </div>
  );
}

function AdministrationContent() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-4">Administration</h2>
        <p className="text-lg text-muted-foreground mb-6">
          Administration tools for managing users, roles, and system settings.
        </p>
      </div>
    </div>
  );
}

function ApiReferenceContent() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-4">API Reference</h2>
        <p className="text-lg text-muted-foreground mb-6">
          Documentation for the RDM platform APIs.
        </p>
      </div>
    </div>
  );
}