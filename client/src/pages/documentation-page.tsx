import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { 
  Card, CardContent, CardHeader, CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Accordion, AccordionContent, AccordionItem, AccordionTrigger 
} from "@/components/ui/accordion";
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
              
              <CardContent>
                <nav className="space-y-1">
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
                </nav>
              </CardContent>
            </Card>
          </div>
          
          {/* Main content */}
          <div className="md:col-span-9">
            <ScrollArea className="h-[calc(100vh-150px)]">
              <div className="pr-4">
                {/* Use plain divs instead of TabsContent for conditional rendering */}
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
              </div>
            </ScrollArea>
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
            
            <AccordionItem value="crosswalks">
              <AccordionTrigger className="text-md font-medium">
                Crosswalks
              </AccordionTrigger>
              <AccordionContent>
                <p>
                  Crosswalks are special mappings that translate codes or values between different 
                  reference data sets. They help bridge data across systems that use different coding schemes.
                </p>
                <p className="mt-2">
                  For example, a crosswalk might map between "Internal Product Codes" and "Supplier Product Codes", 
                  allowing you to translate data between internal and external systems.
                </p>
                <div className="mt-4 flex justify-end">
                  <Link href="/crosswalks">
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
      
      <Card>
        <CardHeader>
          <CardTitle>Getting Started Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-lg font-medium">
                1
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-medium">Define Reference Types</h4>
                <p className="text-muted-foreground">
                  Start by defining the structure of your reference data. Create reference data types 
                  to specify what fields or attributes each type of data should have.
                </p>
                <ol className="list-decimal pl-6 space-y-1">
                  <li>Navigate to "Reference Data Types" in the sidebar</li>
                  <li>Click "Create New Type" button</li>
                  <li>Define a name, description, and schema for your reference data type</li>
                  <li>Add any required attributes for the data type</li>
                  <li>Save the type</li>
                </ol>
                <div className="mt-4">
                  <Link href="/reference-types">
                    <Button variant="outline" className="flex items-center gap-1">
                      Go to Reference Types <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-lg font-medium">
                2
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-medium">Create Data Sets</h4>
                <p className="text-muted-foreground">
                  Once you have defined reference data types, you can create data sets to hold 
                  instances of that type of reference data.
                </p>
                <ol className="list-decimal pl-6 space-y-1">
                  <li>Navigate to "Reference Data" in the sidebar</li>
                  <li>Click "Create New Data Set" button</li>
                  <li>Select a reference data type for the data set</li>
                  <li>Provide a name and description for the data set</li>
                  <li>Save the data set</li>
                  <li>Add individual reference data instances to the data set</li>
                </ol>
                <div className="mt-4">
                  <Link href="/reference-data">
                    <Button variant="outline" className="flex items-center gap-1">
                      Go to Reference Data <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-lg font-medium">
                3
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-medium">Define Relationships</h4>
                <p className="text-muted-foreground">
                  After creating reference data sets, you can define relationships between them to 
                  establish how data in different sets are connected.
                </p>
                <ol className="list-decimal pl-6 space-y-1">
                  <li>Navigate to "Relationships" in the sidebar</li>
                  <li>Click "Create New Relationship" button</li>
                  <li>Select source and target reference data sets</li>
                  <li>Define any attributes for the relationship</li>
                  <li>Save the relationship definition</li>
                  <li>Add relationship values to connect specific instances</li>
                </ol>
                <div className="mt-4">
                  <Link href="/relationships">
                    <Button variant="outline" className="flex items-center gap-1">
                      Go to Relationships <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
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
          Reference Data Types define the structure and attributes of your reference data. This section explains
          how to create, manage, and use reference data types effectively.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>What are Reference Data Types?</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Reference Data Types are essentially schemas or templates that define what fields (attributes)
            should be present in a particular type of reference data. They act as a blueprint for your 
            reference data sets.
          </p>
          <p className="mt-4">
            Each Reference Data Type includes:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li><strong>Name</strong> - A unique identifier for the type</li>
            <li><strong>Description</strong> - Details about the purpose and usage of this type</li>
            <li><strong>Attributes</strong> - The fields that make up this type of reference data</li>
            <li><strong>Validation Rules</strong> - Optional rules to ensure data quality</li>
          </ul>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Creating Reference Data Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>
              To create a new Reference Data Type, follow these steps:
            </p>
            
            <ol className="list-decimal pl-6 space-y-1">
              <li>Navigate to the "Reference Data Types" section in the sidebar</li>
              <li>Click the "Create New Type" button</li>
              <li>Fill in the basic information:
                <ul className="list-disc pl-6 mt-1">
                  <li>Name - A clear, unique identifier</li>
                  <li>Description - Purpose and usage details</li>
                  <li>Status - Whether the type is active or draft</li>
                </ul>
              </li>
              <li>Define attributes for the type:
                <ul className="list-disc pl-6 mt-1">
                  <li>Attribute Name - The field name</li>
                  <li>Data Type - String, Number, Date, etc.</li>
                  <li>Required - Whether the attribute is mandatory</li>
                  <li>Description - What the attribute represents</li>
                </ul>
              </li>
              <li>Add any validation rules if needed</li>
              <li>Save the Reference Data Type</li>
            </ol>
            
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mt-4">
              <h4 className="text-amber-800 font-medium">Best Practice</h4>
              <p className="text-amber-700 mt-1">
                When designing Reference Data Types, consider future needs and integration points.
                Include attributes that might be needed for systems integration, even if they're
                not immediately required.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Managing Reference Data Types</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="editing">
              <AccordionTrigger className="text-md font-medium">
                Editing Reference Data Types
              </AccordionTrigger>
              <AccordionContent>
                <p>
                  You can edit existing Reference Data Types to add new attributes or modify their properties.
                  However, be aware that changes may affect existing data sets.
                </p>
                <p className="mt-2">
                  When you edit a Reference Data Type:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>You can add new attributes at any time</li>
                  <li>You can modify attribute descriptions and validation rules</li>
                  <li>Changing an attribute's data type may require data migration</li>
                  <li>Removing attributes should be done with caution</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="versioning">
              <AccordionTrigger className="text-md font-medium">
                Type Versioning
              </AccordionTrigger>
              <AccordionContent>
                <p>
                  The system maintains versions of Reference Data Types to track changes over time.
                  This helps ensure that historical data remains valid even as schemas evolve.
                </p>
                <p className="mt-2">
                  Each time you make a significant change to a Reference Data Type, consider:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Adding version notes to document the changes</li>
                  <li>Updating any integration points that might be affected</li>
                  <li>Notifying users who work with this data type</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="deactivating">
              <AccordionTrigger className="text-md font-medium">
                Deactivating Types
              </AccordionTrigger>
              <AccordionContent>
                <p>
                  Rather than deleting Reference Data Types that are no longer needed, you can deactivate them.
                  This preserves historical data while preventing new data sets from using the type.
                </p>
                <p className="mt-2">
                  To deactivate a Reference Data Type:
                </p>
                <ol className="list-decimal pl-6 mt-2 space-y-1">
                  <li>Navigate to the Reference Data Type details page</li>
                  <li>Click the "Deactivate" button</li>
                  <li>Confirm the deactivation</li>
                </ol>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

function ReferenceDataContent() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-4">Reference Data</h2>
        <p className="text-lg text-muted-foreground mb-6">
          Reference Data consists of the actual data sets and instances managed in the system. This section
          explains how to create, import, manage, and export reference data.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Working with Reference Data Sets</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Reference Data Sets are collections of reference data instances that conform to a specific
            Reference Data Type. Each data set represents a logical grouping of related reference data.
          </p>
          
          <h4 className="font-medium mt-4 mb-2">Creating a New Data Set</h4>
          <ol className="list-decimal pl-6 space-y-1">
            <li>Navigate to "Reference Data" in the sidebar</li>
            <li>Click "Create New Data Set" button</li>
            <li>Select a Reference Data Type from the dropdown</li>
            <li>Provide a name and description for the data set</li>
            <li>Set the data set status (Active or Draft)</li>
            <li>Save the data set</li>
          </ol>
          
          <h4 className="font-medium mt-4 mb-2">Managing Data Set Metadata</h4>
          <p>
            Each data set includes metadata that helps users understand its purpose and content:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li><strong>Name</strong> - A unique identifier for the data set</li>
            <li><strong>Description</strong> - Detailed information about the data set's content and purpose</li>
            <li><strong>Type</strong> - The Reference Data Type that defines the structure</li>
            <li><strong>Status</strong> - Whether the data set is active, draft, or archived</li>
            <li><strong>Created/Modified</strong> - Timestamp and user information for auditing</li>
          </ul>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Managing Reference Data Instances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>
              Reference Data Instances are the individual records within a data set. Each instance
              represents a single entry in your reference data (e.g., a country, a product code, etc.).
            </p>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="adding">
                <AccordionTrigger className="text-md font-medium">
                  Adding Data Instances
                </AccordionTrigger>
                <AccordionContent>
                  <p>You can add reference data instances in several ways:</p>
                  
                  <h5 className="font-medium mt-2 mb-1">Manual Entry:</h5>
                  <ol className="list-decimal pl-6 space-y-1">
                    <li>Navigate to the data set details page</li>
                    <li>Click "Add New Instance" button</li>
                    <li>Fill in the attributes according to the data type</li>
                    <li>Save the instance</li>
                  </ol>
                  
                  <h5 className="font-medium mt-3 mb-1">Bulk Import:</h5>
                  <ol className="list-decimal pl-6 space-y-1">
                    <li>Navigate to the data set details page</li>
                    <li>Click "Import Data" button</li>
                    <li>Select a CSV or Excel file with your data</li>
                    <li>Map columns to the attributes in your data type</li>
                    <li>Preview the data and confirm the import</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="editing">
                <AccordionTrigger className="text-md font-medium">
                  Editing Data Instances
                </AccordionTrigger>
                <AccordionContent>
                  <p>
                    To edit an existing reference data instance:
                  </p>
                  <ol className="list-decimal pl-6 mt-2 space-y-1">
                    <li>Navigate to the data set details page</li>
                    <li>Find the instance you want to edit</li>
                    <li>Click the "Edit" button for that instance</li>
                    <li>Modify the attribute values as needed</li>
                    <li>Save the changes</li>
                  </ol>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-4">
                    <h5 className="text-blue-800 font-medium">Note</h5>
                    <p className="text-blue-700 mt-1">
                      Changes to reference data instances may require approval depending on your 
                      system configuration. See the Approvals section for more details.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="exporting">
                <AccordionTrigger className="text-md font-medium">
                  Exporting Data
                </AccordionTrigger>
                <AccordionContent>
                  <p>
                    You can export reference data for use in other systems:
                  </p>
                  <ol className="list-decimal pl-6 mt-2 space-y-1">
                    <li>Navigate to the data set details page</li>
                    <li>Click the "Export" button</li>
                    <li>Select the export format (CSV, Excel, JSON)</li>
                    <li>Choose which attributes to include</li>
                    <li>Download the exported file</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Reference Data Visualization</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            The platform provides visualization tools to help you understand your reference data 
            and its relationships:
          </p>
          
          <h4 className="font-medium mt-4 mb-2">Graph View</h4>
          <p>
            The graph view shows how reference data instances are connected across different data sets:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Navigate to a data set details page</li>
            <li>Click the "View Graph" button</li>
            <li>Explore connections between data instances</li>
            <li>Filter the graph by relationship type or depth</li>
            <li>Export the graph visualization if needed</li>
          </ul>
          
          <div className="mt-4">
            <Link href="/reference-data">
              <Button variant="outline" className="flex items-center gap-1">
                Explore Reference Data <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RelationshipsContent() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-4">Relationships</h2>
        <p className="text-lg text-muted-foreground mb-6">
          Relationships define connections between reference data sets, allowing you to model how different 
          types of data relate to each other. This section explains how to create and manage relationships.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Understanding Relationships</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Relationships in the RDM platform define how instances in different reference data sets 
            are connected to each other. They capture the associations between different types of 
            reference data.
          </p>
          
          <h4 className="font-medium mt-4 mb-2">Key Concepts</h4>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Source Data Set</strong> - The data set where the relationship originates</li>
            <li><strong>Target Data Set</strong> - The data set where the relationship points to</li>
            <li><strong>Relationship Type</strong> - The nature of the connection (e.g., "belongs to", "contains")</li>
            <li><strong>Relationship Values</strong> - The actual connections between specific instances</li>
            <li><strong>Attributes</strong> - Additional properties of the relationship (e.g., effective dates)</li>
          </ul>
          
          <h4 className="font-medium mt-4 mb-2">Types of Relationships</h4>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>One-to-One</strong> - Each source instance connects to exactly one target instance</li>
            <li><strong>One-to-Many</strong> - Each source instance can connect to multiple target instances</li>
            <li><strong>Many-to-Many</strong> - Multiple source instances can connect to multiple target instances</li>
          </ul>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Creating Relationships</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>
              To create a new relationship between reference data sets:
            </p>
            
            <ol className="list-decimal pl-6 space-y-1">
              <li>Navigate to the "Relationships" section in the sidebar</li>
              <li>Click the "Create New Relationship" button</li>
              <li>Define the relationship:
                <ul className="list-disc pl-6 mt-1">
                  <li>Name - A descriptive name for the relationship</li>
                  <li>Description - The purpose and meaning of the relationship</li>
                  <li>Source Data Set - The origin data set</li>
                  <li>Target Data Set - The destination data set</li>
                </ul>
              </li>
              <li>Add any attributes for the relationship (optional):
                <ul className="list-disc pl-6 mt-1">
                  <li>Effective Dates - When the relationship is valid</li>
                  <li>Relationship Type - Classification of the relationship</li>
                  <li>Custom attributes specific to your needs</li>
                </ul>
              </li>
              <li>Save the relationship definition</li>
            </ol>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-4">
              <h4 className="text-blue-800 font-medium">Note</h4>
              <p className="text-blue-700 mt-1">
                Creating a relationship definition only establishes the potential connection between
                data sets. You'll need to add relationship values to connect specific instances.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Managing Relationship Values</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="adding">
              <AccordionTrigger className="text-md font-medium">
                Adding Relationship Values
              </AccordionTrigger>
              <AccordionContent>
                <p>
                  Once you've defined a relationship, you can add values to connect specific instances:
                </p>
                <ol className="list-decimal pl-6 mt-2 space-y-1">
                  <li>Navigate to the relationship details page</li>
                  <li>Click "Add Relationship Value" button</li>
                  <li>Select a source instance from the source data set</li>
                  <li>Select a target instance from the target data set</li>
                  <li>Fill in any attribute values for the relationship</li>
                  <li>Save the relationship value</li>
                </ol>
                
                <p className="mt-3">
                  You can also add relationship values in bulk by importing a CSV file:
                </p>
                <ol className="list-decimal pl-6 mt-2 space-y-1">
                  <li>Navigate to the relationship details page</li>
                  <li>Click "Import Relationship Values" button</li>
                  <li>Upload a CSV file with source and target instance identifiers</li>
                  <li>Map the columns to the appropriate fields</li>
                  <li>Preview and confirm the import</li>
                </ol>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="visualizing">
              <AccordionTrigger className="text-md font-medium">
                Visualizing Relationships
              </AccordionTrigger>
              <AccordionContent>
                <p>
                  The platform provides visualization tools to help you understand relationships:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li><strong>Graph View</strong> - Shows a network diagram of related instances</li>
                  <li><strong>Tree View</strong> - Displays hierarchical relationships</li>
                  <li><strong>Table View</strong> - Lists relationship values in a tabular format</li>
                </ul>
                
                <p className="mt-3">
                  To access visualizations:
                </p>
                <ol className="list-decimal pl-6 mt-2 space-y-1">
                  <li>Navigate to the relationship details page</li>
                  <li>Click the "Visualize" button</li>
                  <li>Select your preferred visualization type</li>
                  <li>Use filters to focus on specific data if needed</li>
                </ol>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

function CrosswalksContent() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-4">Crosswalks</h2>
        <p className="text-lg text-muted-foreground mb-6">
          Crosswalks are mappings between different coding systems or reference data sets. They help translate
          data between systems that use different codes or identifiers for the same concepts.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Understanding Crosswalks</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Crosswalks are special types of relationships that map values between different reference
            data sets, allowing for translation between different coding systems.
          </p>
          
          <h4 className="font-medium mt-4 mb-2">Key Components</h4>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Source Data Set</strong> - The original reference data set</li>
            <li><strong>Target Data Set</strong> - The destination reference data set</li>
            <li><strong>Mapping Direction</strong> - Whether the mapping is one-way or bidirectional</li>
            <li><strong>Mapping Values</strong> - The specific value pairs that map between the data sets</li>
            <li><strong>Confidence Level</strong> - Indicates how reliable each mapping is</li>
            <li><strong>Status</strong> - Whether the mapping is draft, pending approval, or approved</li>
          </ul>
          
          <h4 className="font-medium mt-4 mb-2">Common Use Cases</h4>
          <ul className="list-disc pl-6 space-y-1">
            <li>Mapping internal product codes to supplier codes</li>
            <li>Translating between different country code standards (ISO 2, ISO 3)</li>
            <li>Converting between classification systems (e.g., ICD-9 to ICD-10)</li>
            <li>Mapping between legacy and new system identifiers during migrations</li>
          </ul>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Creating Crosswalk Mappings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>
              To create a new crosswalk mapping:
            </p>
            
            <ol className="list-decimal pl-6 space-y-1">
              <li>Navigate to the "Crosswalks" section in the sidebar</li>
              <li>Click the "Create New Crosswalk" button</li>
              <li>Define the crosswalk:
                <ul className="list-disc pl-6 mt-1">
                  <li>Name - A descriptive name for the crosswalk</li>
                  <li>Description - The purpose and use of the mapping</li>
                  <li>Source Data Set - The origin data set</li>
                  <li>Target Data Set - The destination data set</li>
                  <li>Source Attribute - The field in the source to map from</li>
                  <li>Target Attribute - The field in the target to map to</li>
                </ul>
              </li>
              <li>Select the mapping direction (one-way or bidirectional)</li>
              <li>Save the crosswalk definition</li>
            </ol>
            
            <h4 className="font-medium mt-4 mb-2">Adding Mapping Values</h4>
            <p>
              After creating the crosswalk definition, you can add the actual value mappings:
            </p>
            <ol className="list-decimal pl-6 mt-2 space-y-1">
              <li>Navigate to the crosswalk details page</li>
              <li>Click "Add Mapping" button</li>
              <li>Select a source value from the source data set</li>
              <li>Select a target value from the target data set</li>
              <li>Set the confidence level for the mapping</li>
              <li>Add any notes or comments about the mapping</li>
              <li>Save the mapping value</li>
            </ol>
            
            <h4 className="font-medium mt-4 mb-2">Bulk Import Mappings</h4>
            <p>
              For large sets of mappings, you can import them in bulk:
            </p>
            <ol className="list-decimal pl-6 mt-2 space-y-1">
              <li>Navigate to the crosswalk details page</li>
              <li>Click "Import Mappings" button</li>
              <li>Download the template file if needed</li>
              <li>Prepare your CSV file with source and target values</li>
              <li>Upload the file and map columns</li>
              <li>Preview and confirm the import</li>
            </ol>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Using Crosswalks for Data Transformation</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Once you've created crosswalk mappings, you can use them to transform data:
          </p>
          
          <h4 className="font-medium mt-4 mb-2">Data Transformation</h4>
          <ol className="list-decimal pl-6 space-y-1">
            <li>Navigate to "Crosswalks" in the sidebar</li>
            <li>Select the crosswalk you want to use</li>
            <li>Click the "Transform Data" button</li>
            <li>Upload a file containing data with source values</li>
            <li>Select the column that contains the source values</li>
            <li>Configure transformation options</li>
            <li>Process the transformation</li>
            <li>Download the transformed file with target values</li>
          </ol>
          
          <h4 className="font-medium mt-4 mb-2">Handling Missing Mappings</h4>
          <p>
            The system helps you identify and handle values that don't have mappings:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>View the "Missing Mappings" report for each crosswalk</li>
            <li>Add new mappings for missing values</li>
            <li>Export missing values for research or analysis</li>
            <li>Configure default behavior for unmapped values during transformation</li>
          </ul>
          
          <div className="mt-4">
            <Link href="/crosswalks">
              <Button variant="outline" className="flex items-center gap-1">
                Explore Crosswalks <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ApprovalsContent() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-4">Approvals</h2>
        <p className="text-lg text-muted-foreground mb-6">
          The Approvals system helps maintain data quality and governance by providing a structured
          review process for changes to reference data and mappings.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>The Approval Process</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            The approval process ensures that changes to reference data go through appropriate review
            before becoming actively used in integrated systems.
          </p>
          
          <h4 className="font-medium mt-4 mb-2">Approval Workflow</h4>
          <ol className="list-decimal pl-6 space-y-1">
            <li><strong>Submission</strong> - Changes are submitted for review</li>
            <li><strong>Review</strong> - Approvers examine the changes</li>
            <li><strong>Decision</strong> - Changes are approved, rejected, or sent back for revision</li>
            <li><strong>Notification</strong> - Submitters are informed of the decision</li>
            <li><strong>Implementation</strong> - Approved changes become active</li>
          </ol>
          
          <h4 className="font-medium mt-4 mb-2">Items Requiring Approval</h4>
          <ul className="list-disc pl-6 space-y-1">
            <li>New reference data instances</li>
            <li>Changes to existing reference data</li>
            <li>New relationship values</li>
            <li>Crosswalk mapping values</li>
          </ul>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Managing Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="submission">
              <AccordionTrigger className="text-md font-medium">
                Submitting Items for Approval
              </AccordionTrigger>
              <AccordionContent>
                <p>
                  When creating or modifying data that requires approval:
                </p>
                <ol className="list-decimal pl-6 mt-2 space-y-1">
                  <li>Make your changes to the data</li>
                  <li>Set the status to "Pending Approval" (or this happens automatically)</li>
                  <li>Add any comments or justification for the change</li>
                  <li>Submit the item</li>
                </ol>
                
                <p className="mt-3">
                  You can check the status of your submissions in the "My Submissions" section.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="reviewing">
              <AccordionTrigger className="text-md font-medium">
                Reviewing Items (for Approvers)
              </AccordionTrigger>
              <AccordionContent>
                <p>
                  If you have approver permissions:
                </p>
                <ol className="list-decimal pl-6 mt-2 space-y-1">
                  <li>Navigate to the "Approvals Dashboard" in the sidebar</li>
                  <li>View pending items grouped by type</li>
                  <li>Select an item to review the details</li>
                  <li>Compare changes to previous versions if applicable</li>
                  <li>Make a decision:
                    <ul className="list-disc pl-6 mt-1">
                      <li>Approve - Accept the changes</li>
                      <li>Reject - Decline the changes</li>
                      <li>Request Revisions - Ask for modifications</li>
                    </ul>
                  </li>
                  <li>Add comments explaining your decision</li>
                  <li>Submit your review</li>
                </ol>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          <div className="mt-6">
            <Link href="/approvals">
              <Button variant="outline" className="flex items-center gap-1">
                Go to Approvals Dashboard <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AdministrationContent() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-4">Administration</h2>
        <p className="text-lg text-muted-foreground mb-6">
          The Administration section provides tools for managing users, roles, permissions, and
          system configuration in the Reference Data Management platform.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Administrators can create and manage user accounts, assigning appropriate roles and permissions.
          </p>
          
          <h4 className="font-medium mt-4 mb-2">Managing Users</h4>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Creating Users</strong> - Add new users to the system</li>
            <li><strong>Assigning Roles</strong> - Set user roles that determine permissions</li>
            <li><strong>Deactivating Users</strong> - Suspend access when needed</li>
            <li><strong>Password Management</strong> - Reset passwords and manage security</li>
          </ul>
          
          <p className="mt-4">
            To manage users:
          </p>
          <ol className="list-decimal pl-6 space-y-1">
            <li>Navigate to "Manage Users" in the sidebar</li>
            <li>View the list of existing users</li>
            <li>Use the actions menu to edit, deactivate, or reset passwords</li>
            <li>Click "Add User" to create new user accounts</li>
          </ol>
          
          <div className="mt-4">
            <Link href="/manage-users">
              <Button variant="outline" className="flex items-center gap-1">
                Manage Users <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Role Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Roles define what actions users can perform in the system. Administrators can create and
            configure roles with specific permissions.
          </p>
          
          <h4 className="font-medium mt-4 mb-2">Default Roles</h4>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Administrator</strong> - Full access to all system functions</li>
            <li><strong>Approver</strong> - Can review and approve changes</li>
            <li><strong>Editor</strong> - Can create and edit reference data</li>
            <li><strong>Viewer</strong> - Read-only access to reference data</li>
          </ul>
          
          <h4 className="font-medium mt-4 mb-2">Creating Custom Roles</h4>
          <ol className="list-decimal pl-6 space-y-1">
            <li>Navigate to "Manage Roles" in the sidebar</li>
            <li>Click "Create New Role"</li>
            <li>Provide a name and description for the role</li>
            <li>Configure permissions for each system area:
              <ul className="list-disc pl-6 mt-1">
                <li>Reference Data Types (View, Create, Edit, Delete)</li>
                <li>Reference Data Sets (View, Create, Edit, Delete)</li>
                <li>Relationships (View, Create, Edit, Delete)</li>
                <li>Crosswalks (View, Create, Edit, Delete)</li>
                <li>Approvals (Review, Approve)</li>
                <li>Administration (Users, Roles, System Settings)</li>
              </ul>
            </li>
            <li>Save the role</li>
          </ol>
          
          <div className="mt-4">
            <Link href="/roles">
              <Button variant="outline" className="flex items-center gap-1">
                Manage Roles <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>API Key Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            API keys allow external systems to access reference data through the platform's API.
            Administrators can create and manage these keys.
          </p>
          
          <h4 className="font-medium mt-4 mb-2">Managing API Keys</h4>
          <ol className="list-decimal pl-6 space-y-1">
            <li>Navigate to "API Keys" in the sidebar</li>
            <li>View existing API keys</li>
            <li>Click "Create New API Key" to generate a new key</li>
            <li>Configure key settings:
              <ul className="list-disc pl-6 mt-1">
                <li>Name - Identify the purpose or system using the key</li>
                <li>Permissions - What operations the key can perform</li>
                <li>Expiration - When the key will become invalid</li>
              </ul>
            </li>
            <li>Save and securely store the key</li>
          </ol>
          
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mt-4">
            <h4 className="text-amber-800 font-medium">Security Note</h4>
            <p className="text-amber-700 mt-1">
              API keys grant access to your reference data. Treat them as sensitive credentials,
              never share them publicly, and rotate them periodically for security.
            </p>
          </div>
          
          <div className="mt-4">
            <Link href="/api-keys">
              <Button variant="outline" className="flex items-center gap-1">
                Manage API Keys <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ApiReferenceContent() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-4">API Reference</h2>
        <p className="text-lg text-muted-foreground mb-6">
          The RDM platform provides RESTful APIs for integrating reference data with other systems.
          This section provides documentation for available API endpoints.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>API Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            The RDM API allows external systems to:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Retrieve reference data and mappings</li>
            <li>Search for specific reference data instances</li>
            <li>Transform data using crosswalk mappings</li>
            <li>Submit new reference data (with appropriate permissions)</li>
          </ul>
          
          <h4 className="font-medium mt-4 mb-2">Authentication</h4>
          <p>
            All API requests require authentication using an API key:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Include your API key in the <code>Authorization</code> header</li>
            <li>Format: <code>Authorization: ApiKey YOUR_API_KEY</code></li>
            <li>Keys can be created and managed in the API Keys section</li>
          </ul>
          
          <h4 className="font-medium mt-4 mb-2">Response Format</h4>
          <p>
            API responses are returned in JSON format with a consistent structure:
          </p>
          <pre className="bg-gray-100 p-3 rounded-md text-sm mt-2 overflow-x-auto">
{`{
  "data": [...],       // The requested data
  "metadata": {        // Information about the response
    "totalCount": 42,  // Total available records
    "page": 1,         // Current page number
    "pageSize": 20,    // Records per page
    "totalPages": 3    // Total available pages
  }
}`}
          </pre>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Core API Endpoints</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="reference-data">
              <AccordionTrigger className="text-md font-medium">
                Reference Data Endpoints
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">Get All Reference Data Sets</h4>
                    <p><code className="bg-gray-100 px-1">GET /api/reference-data</code></p>
                    <p className="text-sm text-gray-600 mt-1">Returns a list of all reference data sets</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Get Reference Data Set by ID</h4>
                    <p><code className="bg-gray-100 px-1">GET /api/reference-data/:id</code></p>
                    <p className="text-sm text-gray-600 mt-1">Returns details about a specific reference data set</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Get Reference Data Instances</h4>
                    <p><code className="bg-gray-100 px-1">GET /api/reference-data/:id/instances</code></p>
                    <p className="text-sm text-gray-600 mt-1">Returns instances (records) from a reference data set</p>
                    <p className="text-sm text-gray-600 mt-1">Supports pagination, filtering, and search parameters</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="crosswalk-api">
              <AccordionTrigger className="text-md font-medium">
                Crosswalk Endpoints
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">Get All Crosswalks</h4>
                    <p><code className="bg-gray-100 px-1">GET /api/crosswalks</code></p>
                    <p className="text-sm text-gray-600 mt-1">Returns a list of all crosswalk mappings</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Get Crosswalk by ID</h4>
                    <p><code className="bg-gray-100 px-1">GET /api/crosswalks/:id</code></p>
                    <p className="text-sm text-gray-600 mt-1">Returns details about a specific crosswalk</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Lookup Value in Crosswalk</h4>
                    <p><code className="bg-gray-100 px-1">GET /api/crosswalks/:id/lookup?sourceValue=VALUE</code></p>
                    <p className="text-sm text-gray-600 mt-1">Translates a source value to target value using the crosswalk</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Transform Data with Crosswalk</h4>
                    <p><code className="bg-gray-100 px-1">POST /api/crosswalks/:id/transform</code></p>
                    <p className="text-sm text-gray-600 mt-1">Transforms multiple values using the crosswalk</p>
                    <p className="text-sm text-gray-600 mt-1">Request body should contain an array of source values</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="relationship-api">
              <AccordionTrigger className="text-md font-medium">
                Relationship Endpoints
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">Get All Relationships</h4>
                    <p><code className="bg-gray-100 px-1">GET /api/relationships</code></p>
                    <p className="text-sm text-gray-600 mt-1">Returns a list of all relationship definitions</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Get Relationship by ID</h4>
                    <p><code className="bg-gray-100 px-1">GET /api/relationships/:id</code></p>
                    <p className="text-sm text-gray-600 mt-1">Returns details about a specific relationship</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Get Relationship Values</h4>
                    <p><code className="bg-gray-100 px-1">GET /api/relationships/:id/values</code></p>
                    <p className="text-sm text-gray-600 mt-1">Returns the values (connections) for a relationship</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>API Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <h4 className="font-medium mb-2">Example: Retrieving a Reference Data Set</h4>
          <pre className="bg-gray-100 p-3 rounded-md text-sm mt-2 overflow-x-auto">
{`// Request
GET /api/reference-data/42
Authorization: ApiKey YOUR_API_KEY

// Response
{
  "data": {
    "id": 42,
    "name": "Country Codes",
    "description": "ISO country codes and names",
    "typeId": 7,
    "status": "active",
    "createdAt": "2023-10-15T14:32:10Z",
    "lastModifiedAt": "2023-11-20T09:15:22Z"
  }
}`}
          </pre>
          
          <h4 className="font-medium mt-6 mb-2">Example: Transforming Data with a Crosswalk</h4>
          <pre className="bg-gray-100 p-3 rounded-md text-sm mt-2 overflow-x-auto">
{`// Request
POST /api/crosswalks/15/transform
Authorization: ApiKey YOUR_API_KEY
Content-Type: application/json

{
  "values": ["A001", "B002", "C003"],
  "options": {
    "includeUnmapped": true
  }
}

// Response
{
  "data": [
    {"sourceValue": "A001", "targetValue": "X123", "confidence": 1.0},
    {"sourceValue": "B002", "targetValue": "Y456", "confidence": 1.0},
    {"sourceValue": "C003", "targetValue": null, "mapped": false}
  ]
}`}
          </pre>
          
          <div className="mt-6">
            <p>
              For more detailed API documentation, including all available endpoints, parameters, and
              response formats, please refer to the complete API Reference.
            </p>
            <div className="mt-4">
              <Button variant="outline" className="flex items-center gap-1">
                Download API Documentation <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}