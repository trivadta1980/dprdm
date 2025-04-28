/**
 * Documentation Content Structure
 * This file contains all the documentation content in a structured format
 * that can be used for searching and displaying documentation.
 */

export type DocumentationSubsection = {
  id: string;
  title: string;
  content: string;
};

export type DocumentationSection = {
  id: string;
  title: string;
  content: string;
  subsections?: DocumentationSubsection[];
};

/**
 * Main documentation content structure
 * Organized by top-level tab ID and then by sections within each tab
 */
export const documentationContent: Record<string, DocumentationSection[]> = {
  "getting-started": [
    {
      id: "getting-started-intro",
      title: "Getting Started with Reference Data Management",
      content: "Welcome to the Reference Data Management (RDM) platform. This guide will help you understand the system and how to get started with managing your reference data effectively.",
      subsections: [
        {
          id: "what-is-rdm",
          title: "What is Reference Data Management?",
          content: "Reference Data Management (RDM) is a system designed to create, maintain, and distribute reference data across your organization. Reference data includes lists of allowed values, hierarchies, and mappings between different systems' codes. Our platform helps you create and maintain standardized reference data, establish relationships between different data sets, map codes between different systems (crosswalks), govern changes through approval workflows, visualize data relationships, and access reference data through APIs."
        },
        {
          id: "key-concepts",
          title: "Key Concepts",
          content: "The RDM platform is built around several key concepts: Reference Data Types define the structure (schema) of your reference data. Reference Data Sets are collections of reference data instances that conform to a specific Reference Data Type. Relationships define how records in different reference data sets relate to each other. Crosswalks map values between different reference data sets. Approval workflows ensure data quality and governance."
        },
        {
          id: "getting-started-navigation",
          title: "Navigating the Platform",
          content: "The RDM platform provides an intuitive interface for managing your reference data. The main navigation menu gives you access to all key features, including Reference Data Types, Reference Data Sets, Relationships, Crosswalks, and Administration. Each section has specific tools for creating, editing, and managing your data."
        }
      ]
    }
  ],
  "reference-types": [
    {
      id: "reference-types-intro",
      title: "Reference Data Types",
      content: "Reference Data Types define the structure or schema for your reference data. Each type specifies the fields, data formats, and validation rules for a particular kind of reference data.",
      subsections: [
        {
          id: "reference-types-overview",
          title: "Overview",
          content: "Reference Data Types are the foundation of your reference data management strategy. They ensure consistency across your organization by defining exactly what fields and attributes should be included for each type of reference data. When you create a Reference Data Type, you're essentially creating a template that will be used for all instances of that type of data."
        },
        {
          id: "creating-reference-types",
          title: "Creating Reference Data Types",
          content: "To create a new Reference Data Type, navigate to the Reference Data Types section and click 'Create New Type'. You'll need to provide a name, description, and define the schema fields. Each field requires a name, data type, and you can specify if it's required, unique, or has any validation rules. Common data types include text, number, date, boolean, and enumerated lists."
        },
        {
          id: "managing-reference-types",
          title: "Managing Reference Data Types",
          content: "You can edit, delete, or view Reference Data Types from the main Reference Data Types page. Be careful when editing existing types, especially if they already have data associated with them. Changes to the schema might require updates to existing data sets. The system will warn you if your changes might impact existing data."
        }
      ]
    }
  ],
  "reference-data": [
    {
      id: "reference-data-intro",
      title: "Reference Data",
      content: "Reference Data Sets are collections of reference data instances that conform to a specific Reference Data Type. They store the actual reference data values used throughout your systems.",
      subsections: [
        {
          id: "reference-data-overview",
          title: "Overview",
          content: "Reference Data Sets contain the actual reference data values that your organization uses. Each data set is associated with a specific Reference Data Type, ensuring that all instances within the set follow the same structure. Examples of reference data sets include lists of countries, currencies, product codes, department codes, or any standardized lists used across your organization."
        },
        {
          id: "creating-reference-data",
          title: "Creating Reference Data Sets",
          content: "To create a new Reference Data Set, navigate to the Reference Data section and click 'Create New Data Set'. You'll need to select a Reference Data Type, provide a name and description for the data set, and then start adding individual records. You can add records manually or import them from a CSV file. The import tool maps columns in your CSV to fields in the Reference Data Type."
        },
        {
          id: "managing-reference-data",
          title: "Managing Reference Data",
          content: "You can view, edit, add, or delete records within a Reference Data Set from the data set's detail page. The platform provides filtering, sorting, and pagination tools to help you manage large data sets. You can also export reference data to CSV or access it programmatically through APIs."
        }
      ]
    }
  ],
  "relationships": [
    {
      id: "relationships-intro",
      title: "Relationships",
      content: "Relationships define connections between records in different reference data sets, establishing how different types of reference data relate to each other.",
      subsections: [
        {
          id: "relationships-overview",
          title: "Overview",
          content: "Relationships capture how different reference data sets connect to each other, providing context and structure to your reference data. For example, you might create relationships between countries and currencies, products and categories, or employees and departments. These relationships help you maintain data integrity and provide a foundation for data analysis."
        },
        {
          id: "creating-relationships",
          title: "Creating Relationships",
          content: "To create a new relationship, navigate to the Relationships section and click 'Create New Relationship'. You'll need to select source and target reference data sets, define relationship attributes, and specify cardinality. Cardinality options include one-to-one, one-to-many, many-to-one, and many-to-many. You can also add attributes to the relationship itself, such as 'effective date' or 'status'."
        },
        {
          id: "managing-relationships",
          title: "Managing Relationship Values",
          content: "After defining a relationship, you can add specific relationship values that connect individual records from the source and target data sets. The platform provides tools for creating, editing, and visualizing these connections. You can add relationship values manually or import them from a CSV file."
        }
      ]
    }
  ],
  "crosswalks": [
    {
      id: "crosswalks-intro",
      title: "Crosswalks",
      content: "Crosswalks map values between different reference data sets, allowing you to translate codes or identifiers across different systems or standards.",
      subsections: [
        {
          id: "crosswalks-overview",
          title: "Overview",
          content: "Crosswalks are special types of relationships that specifically map values between different coding or classification systems. They're essential for data integration, allowing you to translate between different standards or system-specific codes. For example, you might create a crosswalk between your internal product codes and a supplier's product codes, or between different international standards."
        },
        {
          id: "creating-crosswalks",
          title: "Creating Crosswalks",
          content: "To create a new crosswalk, navigate to the Crosswalks section and click 'Create New Crosswalk'. You'll need to select source and target reference data sets, specify which attributes will be mapped, and define the mapping type. Mapping types include one-to-one, one-to-many, many-to-one, and many-to-many. You can also add metadata attributes to capture information about each mapping."
        },
        {
          id: "managing-crosswalks",
          title: "Managing Crosswalk Mappings",
          content: "After creating a crosswalk definition, you can add specific mappings between values in the source and target data sets. The platform provides tools for creating, editing, and visualizing these mappings. You can add mappings manually, import them from a CSV file, or in some cases, use assisted mapping features that suggest potential matches based on similarities."
        }
      ]
    }
  ],
  "approvals": [
    {
      id: "approvals-intro",
      title: "Approvals",
      content: "The Approvals system ensures data quality and governance by requiring review and approval for changes to reference data.",
      subsections: [
        {
          id: "approvals-overview",
          title: "Overview",
          content: "The Approvals system implements governance processes for your reference data, ensuring that changes follow your organization's quality control procedures. When changes are made to reference data, relationships, or crosswalks, they can be submitted for approval before becoming active in the system. This workflow ensures that all data changes are reviewed by authorized personnel."
        },
        {
          id: "approval-workflow",
          title: "Approval Workflow",
          content: "The approval workflow consists of several states: Draft (initial state), Submitted (waiting for review), Approved (changes accepted), or Rejected (changes denied). When an item is submitted for approval, approvers are notified and can review the changes. Approvers can approve or reject the submission, and can provide comments explaining their decision."
        },
        {
          id: "approvals-dashboard",
          title: "Approvals Dashboard",
          content: "The Approvals Dashboard gives approvers a consolidated view of all items pending review. It shows key information such as the type of item, who submitted it, when it was submitted, and its current status. Approvers can filter and sort the list to focus on specific types of submissions or prioritize their work."
        }
      ]
    }
  ],
  "administration": [
    {
      id: "administration-intro",
      title: "Administration",
      content: "Administration tools allow you to manage users, roles, permissions, and system settings.",
      subsections: [
        {
          id: "user-management",
          title: "User Management",
          content: "The User Management section allows administrators to create, edit, and deactivate user accounts. Each user has a username, email, role, and status. Administrators can reset passwords, update user information, and assign users to specific roles that determine their permissions within the system."
        },
        {
          id: "role-management",
          title: "Role Management",
          content: "Roles define what actions and areas of the system users can access. The Role Management section allows administrators to create and configure roles with specific permissions. Common roles include Administrator (full access), Approver (can approve changes), Editor (can create and edit data), and Viewer (read-only access)."
        },
        {
          id: "system-settings",
          title: "System Settings",
          content: "System Settings allow configuration of global parameters that affect the entire platform. These might include approval workflow settings, integration settings for external systems, email notification settings, and display preferences. Only administrators can modify system settings."
        }
      ]
    }
  ],
  "api-reference": [
    {
      id: "api-reference-intro",
      title: "API Reference",
      content: "The API Reference provides documentation for programmatically accessing and managing reference data through the RDM platform's APIs.",
      subsections: [
        {
          id: "api-overview",
          title: "API Overview",
          content: "The RDM platform provides REST APIs that allow you to programmatically access and manage reference data. The APIs follow standard RESTful conventions and return data in JSON format. All API calls require authentication using API keys, which can be generated and managed in the API Keys section of the platform."
        },
        {
          id: "authentication",
          title: "Authentication",
          content: "API requests must include an API key for authentication. You can include the API key either as an 'X-API-Key' header or as an 'api_key' query parameter. API keys are associated with specific users and inherit their permissions. You can create, view, and revoke API keys from the API Keys section of the platform."
        },
        {
          id: "api-endpoints",
          title: "API Endpoints",
          content: "The RDM API provides endpoints for accessing reference data sets, relationships, crosswalks, and more. Key endpoints include: /api/external/reference-data/{id} to get a reference data set, /api/external/relationships/{id}/values to get relationship values, /api/external/crosswalks to list all crosswalks, and many more. Each endpoint supports specific HTTP methods (GET, POST, PUT, DELETE) depending on the operation."
        }
      ]
    }
  ]
};