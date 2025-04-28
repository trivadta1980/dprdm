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
  // Get the crosswalks content from the documentation data
  const crosswalksData = documentationContent["crosswalks"];
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-4">Crosswalks</h2>
        <p className="text-lg text-muted-foreground mb-6">
          {crosswalksData[0].content}
        </p>
      </div>
      
      {/* Render each subsection */}
      {crosswalksData[0].subsections?.map((subsection) => (
        <Card key={subsection.id} id={subsection.id} className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="text-xl">{subsection.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose dark:prose-invert max-w-none">
              <p>{subsection.content}</p>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {/* Additional content specific to crosswalks */}
      <Card>
        <CardHeader>
          <CardTitle>Crosswalk Mapping Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-md">
              <h3 className="font-medium mb-2">One-to-One</h3>
              <p className="text-sm text-muted-foreground">
                Each source value maps to exactly one target value. The most common and straightforward mapping type.
              </p>
            </div>
            <div className="p-4 border rounded-md">
              <h3 className="font-medium mb-2">One-to-Many</h3>
              <p className="text-sm text-muted-foreground">
                A single source value maps to multiple target values. Used when the target system has more granular classifications.
              </p>
            </div>
            <div className="p-4 border rounded-md">
              <h3 className="font-medium mb-2">Many-to-One</h3>
              <p className="text-sm text-muted-foreground">
                Multiple source values map to a single target value. Used when the target system uses broader categories.
              </p>
            </div>
            <div className="p-4 border rounded-md">
              <h3 className="font-medium mb-2">Many-to-Many</h3>
              <p className="text-sm text-muted-foreground">
                Complex relationships where multiple source values map to multiple target values. Requires careful management.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Importing Crosswalk Mappings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>
              To import crosswalk mappings from a CSV file, follow these steps:
            </p>
            
            <ol className="list-decimal pl-6 space-y-2">
              <li>Navigate to the Crosswalks section and select the crosswalk you want to import mappings for.</li>
              <li>Click the "Import" button in the Mappings section.</li>
              <li>Download the template CSV file, which includes columns for the source and target attributes.</li>
              <li>Fill in the template with your mapping data.</li>
              <li>Upload the completed CSV file using the import dialog.</li>
              <li>Review the import preview to ensure your data is correct.</li>
              <li>Complete the import process.</li>
            </ol>
            
            <div className="mt-4 p-4 bg-blue-50 text-blue-800 rounded-md dark:bg-blue-900 dark:text-blue-100">
              <h4 className="font-medium mb-2">Pro Tip</h4>
              <p className="text-sm">
                For large crosswalks, consider using the batch import feature, which allows you to import mappings in chunks 
                to avoid timeout issues. You can also use the assisted mapping feature to suggest potential matches based on 
                text similarity or other matching algorithms.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Using Crosswalks for Data Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>
              Crosswalks are powerful tools for data integration scenarios. Here are some common use cases:
            </p>
            
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="p-4 border rounded-md">
                <h3 className="font-medium mb-2">System Migration</h3>
                <p className="text-sm text-muted-foreground">
                  Map codes between legacy and new systems to ensure smooth data transition during system migrations.
                </p>
              </div>
              <div className="p-4 border rounded-md">
                <h3 className="font-medium mb-2">Data Warehousing</h3>
                <p className="text-sm text-muted-foreground">
                  Standardize codes from various source systems when loading data into a central data warehouse.
                </p>
              </div>
              <div className="p-4 border rounded-md">
                <h3 className="font-medium mb-2">External Data Exchange</h3>
                <p className="text-sm text-muted-foreground">
                  Translate between your internal codes and industry standards when exchanging data with partners.
                </p>
              </div>
              <div className="p-4 border rounded-md">
                <h3 className="font-medium mb-2">Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  Harmonize classification schemes across different datasets to enable consistent reporting and analysis.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ApprovalsContent() {
  // Get the approvals content from the documentation data
  const approvalsData = documentationContent["approvals"];
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-4">Approvals</h2>
        <p className="text-lg text-muted-foreground mb-6">
          {approvalsData[0].content}
        </p>
      </div>
      
      {/* Render each subsection */}
      {approvalsData[0].subsections?.map((subsection) => (
        <Card key={subsection.id} id={subsection.id} className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="text-xl">{subsection.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose dark:prose-invert max-w-none">
              <p>{subsection.content}</p>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {/* Additional content specific to approvals */}
      <Card>
        <CardHeader>
          <CardTitle>Approval Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-md">
              <h3 className="font-medium mb-2">Submitter</h3>
              <p className="text-sm text-muted-foreground">
                Creates or modifies data and submits it for approval. Can track status of submissions.
              </p>
            </div>
            <div className="p-4 border rounded-md">
              <h3 className="font-medium mb-2">Approver</h3>
              <p className="text-sm text-muted-foreground">
                Reviews submitted changes and either approves or rejects them with comments.
              </p>
            </div>
            <div className="p-4 border rounded-md">
              <h3 className="font-medium mb-2">Administrator</h3>
              <p className="text-sm text-muted-foreground">
                Configures approval workflow settings and can override approval status if needed.
              </p>
            </div>
            <div className="p-4 border rounded-md">
              <h3 className="font-medium mb-2">Viewer</h3>
              <p className="text-sm text-muted-foreground">
                Can view approval status but cannot submit or approve changes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Approval Process Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-lg font-medium">
                1
              </div>
              <div>
                <h4 className="font-medium">Create or Modify</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Users create or modify reference data, relationships, or crosswalk mappings.
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-lg font-medium">
                2
              </div>
              <div>
                <h4 className="font-medium">Submit for Approval</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Changes are submitted for approval, triggering notifications to approvers.
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-lg font-medium">
                3
              </div>
              <div>
                <h4 className="font-medium">Review</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Approvers review the changes and can view differences from previous versions.
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-lg font-medium">
                4
              </div>
              <div>
                <h4 className="font-medium">Decision</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Approvers either approve the changes (making them active) or reject them with comments.
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-lg font-medium">
                5
              </div>
              <div>
                <h4 className="font-medium">Notification</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Submitters are notified of the decision and can view comments if rejected.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AdministrationContent() {
  // Get the administration content from the documentation data
  const adminData = documentationContent["administration"];
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-4">Administration</h2>
        <p className="text-lg text-muted-foreground mb-6">
          {adminData[0].content}
        </p>
      </div>
      
      {/* Render each subsection */}
      {adminData[0].subsections?.map((subsection) => (
        <Card key={subsection.id} id={subsection.id} className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="text-xl">{subsection.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose dark:prose-invert max-w-none">
              <p>{subsection.content}</p>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {/* Additional admin-specific content */}
      <Card>
        <CardHeader>
          <CardTitle>Common Administration Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-md">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <UserCog className="h-4 w-4" /> Add a New User
              </h3>
              <p className="text-sm text-muted-foreground">
                Create a new user account, assign their role, and set initial permissions. New users receive an 
                email with instructions to set their password.
              </p>
              <div className="mt-3">
                <Button variant="outline" size="sm" className="w-full">
                  Go to User Management
                </Button>
              </div>
            </div>
            
            <div className="p-4 border rounded-md">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Users className="h-4 w-4" /> Create a New Role
              </h3>
              <p className="text-sm text-muted-foreground">
                Define a new role with specific permissions. Roles control what actions users can perform in the system.
              </p>
              <div className="mt-3">
                <Button variant="outline" size="sm" className="w-full">
                  Go to Role Management
                </Button>
              </div>
            </div>
            
            <div className="p-4 border rounded-md">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Key className="h-4 w-4" /> Generate API Key
              </h3>
              <p className="text-sm text-muted-foreground">
                Create API keys for programmatic access to the RDM platform. Each key can have specific permissions.
              </p>
              <div className="mt-3">
                <Button variant="outline" size="sm" className="w-full">
                  Go to API Keys
                </Button>
              </div>
            </div>
            
            <div className="p-4 border rounded-md">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <CheckSquare className="h-4 w-4" /> Manage Approval Workflows
              </h3>
              <p className="text-sm text-muted-foreground">
                Configure approval workflows for different types of reference data changes. Define who can approve and notification settings.
              </p>
              <div className="mt-3">
                <Button variant="outline" size="sm" className="w-full">
                  Go to Workflow Settings
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>System Audit</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            The RDM platform maintains comprehensive audit logs for all administrative actions:
          </p>
          
          <div className="rounded-md border">
            <div className="grid grid-cols-5 bg-muted p-2 text-sm font-medium">
              <div>Date/Time</div>
              <div>User</div>
              <div>Action</div>
              <div>Entity Type</div>
              <div>Details</div>
            </div>
            
            <div className="divide-y">
              <div className="grid grid-cols-5 p-2 text-sm">
                <div>2025-04-27 14:32:15</div>
                <div>admin</div>
                <div>Create</div>
                <div>User</div>
                <div>Created user 'jsmith'</div>
              </div>
              <div className="grid grid-cols-5 p-2 text-sm">
                <div>2025-04-27 11:45:22</div>
                <div>admin</div>
                <div>Modify</div>
                <div>Role</div>
                <div>Updated permissions for 'Approver'</div>
              </div>
              <div className="grid grid-cols-5 p-2 text-sm">
                <div>2025-04-26 16:12:09</div>
                <div>admin</div>
                <div>Create</div>
                <div>API Key</div>
                <div>Generated new API key 'Integration-Key'</div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 text-blue-800 rounded-md dark:bg-blue-900 dark:text-blue-100">
            <h4 className="font-medium mb-2">Administrator Tip</h4>
            <p className="text-sm">
              Regular audit log reviews are recommended as a security best practice. You can export audit logs
              for compliance reporting or internal review.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ApiReferenceContent() {
  // Get the API reference content from the documentation data
  const apiData = documentationContent["api-reference"];
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-4">API Reference</h2>
        <p className="text-lg text-muted-foreground mb-6">
          {apiData[0].content}
        </p>
      </div>
      
      {/* Render each subsection */}
      {apiData[0].subsections?.map((subsection) => (
        <Card key={subsection.id} id={subsection.id} className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="text-xl">{subsection.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose dark:prose-invert max-w-none">
              <p>{subsection.content}</p>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {/* API Endpoints Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Key API Endpoints</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="rounded-md border">
              <div className="bg-primary/10 p-3 flex items-center gap-2">
                <span className="px-2 py-1 text-xs font-medium rounded-md bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">GET</span>
                <code className="font-mono text-sm">/api/external/reference-data/{'{id}'}</code>
              </div>
              <div className="p-4">
                <h3 className="font-medium mb-2">Get Reference Data Set</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Retrieves all instances for a specific reference data set by ID.
                </p>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Path Parameters</h4>
                  <div className="grid grid-cols-4 gap-2 p-2 text-sm border rounded-md">
                    <div className="font-medium">Name</div>
                    <div className="font-medium">Type</div>
                    <div className="font-medium">Required</div>
                    <div className="font-medium">Description</div>
                    
                    <div>id</div>
                    <div>number</div>
                    <div>Yes</div>
                    <div>The ID of the reference data set</div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Example Response</h4>
                  <div className="p-3 bg-slate-100 rounded-md overflow-x-auto dark:bg-slate-800">
                    <pre className="text-xs"><code>{`{
  "id": 5,
  "name": "Countries",
  "description": "ISO Standard Country Codes",
  "instances": [
    {
      "id": 101,
      "code": "US", 
      "name": "United States",
      "continent": "North America"
    },
    {
      "id": 102,
      "code": "CA", 
      "name": "Canada",
      "continent": "North America"
    }
  ]
}`}</code></pre>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="rounded-md border">
              <div className="bg-primary/10 p-3 flex items-center gap-2">
                <span className="px-2 py-1 text-xs font-medium rounded-md bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">GET</span>
                <code className="font-mono text-sm">/api/external/relationships/{'{id}'}/values</code>
              </div>
              <div className="p-4">
                <h3 className="font-medium mb-2">Get Relationship Values</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Retrieves all values for a specific relationship by ID.
                </p>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Path Parameters</h4>
                  <div className="grid grid-cols-4 gap-2 p-2 text-sm border rounded-md">
                    <div className="font-medium">Name</div>
                    <div className="font-medium">Type</div>
                    <div className="font-medium">Required</div>
                    <div className="font-medium">Description</div>
                    
                    <div>id</div>
                    <div>number</div>
                    <div>Yes</div>
                    <div>The ID of the relationship</div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Example Response</h4>
                  <div className="p-3 bg-slate-100 rounded-md overflow-x-auto dark:bg-slate-800">
                    <pre className="text-xs"><code>{`{
  "id": 3,
  "name": "Country-Currency",
  "description": "Maps countries to their currencies",
  "values": [
    {
      "id": 201,
      "source_id": 101, 
      "source_name": "United States",
      "target_id": 501,
      "target_name": "US Dollar",
      "attributes": {
        "effective_date": "1792-04-02"
      }
    },
    {
      "id": 202,
      "source_id": 102, 
      "source_name": "Canada",
      "target_id": 502,
      "target_name": "Canadian Dollar",
      "attributes": {
        "effective_date": "1871-04-01"
      }
    }
  ]
}`}</code></pre>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="rounded-md border">
              <div className="bg-primary/10 p-3 flex items-center gap-2">
                <span className="px-2 py-1 text-xs font-medium rounded-md bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">GET</span>
                <code className="font-mono text-sm">/api/external/crosswalks/{'{id}'}</code>
              </div>
              <div className="p-4">
                <h3 className="font-medium mb-2">Get Crosswalk Mapping</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Retrieves a specific crosswalk mapping by ID, including all mapping values.
                </p>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Path Parameters</h4>
                  <div className="grid grid-cols-4 gap-2 p-2 text-sm border rounded-md">
                    <div className="font-medium">Name</div>
                    <div className="font-medium">Type</div>
                    <div className="font-medium">Required</div>
                    <div className="font-medium">Description</div>
                    
                    <div>id</div>
                    <div>number</div>
                    <div>Yes</div>
                    <div>The ID of the crosswalk mapping</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Using API Keys</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>
              To use the RDM APIs, you'll need to generate an API key:
            </p>
            
            <ol className="list-decimal pl-6 space-y-2">
              <li>Navigate to the API Keys section in the administration panel.</li>
              <li>Click "Create New API Key" and provide a name and description.</li>
              <li>Select the appropriate permissions for the API key.</li>
              <li>Save the API key in a secure location; it will only be shown once.</li>
            </ol>
            
            <div className="mt-4">
              <h3 className="font-medium mb-2">Example API Request</h3>
              <div className="p-3 bg-slate-100 rounded-md overflow-x-auto dark:bg-slate-800">
                <pre className="text-xs"><code>{`// Using fetch with API key as a header
fetch('https://your-rdm-instance.com/api/external/reference-data/5', {
  method: 'GET',
  headers: {
    'X-API-Key': 'your-api-key-here'
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));

// Using curl with API key as a query parameter
curl "https://your-rdm-instance.com/api/external/reference-data/5?api_key=your-api-key-here"
`}</code></pre>
              </div>
            </div>
            
            <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md dark:bg-yellow-900 dark:text-yellow-100 mt-4">
              <h4 className="font-medium mb-2">Security Note</h4>
              <p className="text-sm">
                Keep your API keys secure and never expose them in client-side code. For browser-based applications, 
                consider creating a proxy endpoint on your server that adds the API key to requests before forwarding 
                them to the RDM API.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}