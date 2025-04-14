export interface CrosswalkMapping {
  id: number;
  name: string;
  description: string | null;
  sourceSystemId: number;
  sourceSystemName?: string;
  targetSystemId: number;
  targetSystemName?: string;
  mappingData: {
    mappings: Array<{
      sourceAttribute: string;
      targetAttribute: string;
      confidenceScore?: number;
      status?: string;
    }>;
    status?: string;
  };
  approvalStatus: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
  lastModifiedBy?: number;
  lastModifiedByName?: string;
  createdBy?: number;
  createdByName?: string;
  changeHistory?: Array<{
    timestamp: string;
    prevStatus: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | null;
    newStatus: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
    userId: number;
    comment?: string;
    changes?: Record<string, any>;
  }>;
}

export interface MappingItem {
  sourceAttribute: string;
  targetAttribute: string;
  confidenceScore?: number;
  status?: string;
}

export interface MappingData {
  mappings: MappingItem[];
  status?: string;
}