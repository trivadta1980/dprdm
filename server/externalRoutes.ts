import express, { Request, Response } from 'express';
import { storage } from './storage';
import { approvalStatusEnum } from '../shared/schema';

const router = express.Router();

/**
 * External API Routes
 * 
 * These routes are designed for external API access with API key authentication.
 * They include filtering to only return approved data.
 */

/**
 * @route GET /api/external/reference-data/:id
 * @description Get a reference data set by ID (only including approved instances)
 * @access External API (requires API key)
 */
router.get('/reference-data/:id', async (req: Request, res: Response) => {
  try {
    const dataSetId = parseInt(req.params.id);
    
    if (isNaN(dataSetId)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    const dataSet = await storage.getReferenceDataSet(dataSetId);
    
    if (!dataSet) {
      return res.status(404).json({ error: 'Dataset not found' });
    }
    
    // Filter out only approved data instances (or pending if explicitly requested)
    const filteredData: Record<string, any> = {};
    
    for (const [id, instance] of Object.entries(dataSet.data)) {
      // Check if instance has a _history property with approval status
      const lastHistoryEntry = instance._history?.[instance._history.length - 1];
      const approvalStatus = lastHistoryEntry?.newStatus;
      
      // Only include instances with APPROVED status
      if (approvalStatus === 'APPROVED') {
        // Create a shallow copy of the instance without the _history field
        const { _history, ...cleanInstance } = instance;
        filteredData[id] = cleanInstance;
      }
    }
    
    const result = {
      ...dataSet,
      data: filteredData
    };
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching reference data:', error);
    res.status(500).json({ error: 'Failed to fetch reference data' });
  }
});

/**
 * @route GET /api/external/relationships/:id/values
 * @description Get all relationship values for a relationship (only approved values)
 * @access External API (requires API key)
 */
router.get('/relationships/:id/values', async (req: Request, res: Response) => {
  try {
    const relationshipId = parseInt(req.params.id);
    
    if (isNaN(relationshipId)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    const relationship = await storage.getRelationship(relationshipId);
    
    if (!relationship) {
      return res.status(404).json({ error: 'Relationship not found' });
    }
    
    // Get all relationship values
    const values = await storage.getRelationshipValues(relationshipId);
    
    // Filter to only include approved values
    const approvedValues = values.filter(value => 
      value.approval_status === approvalStatusEnum.enumValues[2] // 'APPROVED'
    );
    
    // Get attribute values for each relationship value
    const enhancedValues = await Promise.all(approvedValues.map(async (value) => {
      const attributes = await storage.getRelationshipAttributeValues(value.id);
      
      // Get source and target info
      const sourceDataSet = await storage.getReferenceDataSet(relationship.sourceDatasetId);
      const targetDataSet = await storage.getReferenceDataSet(relationship.targetDatasetId);
      
      const sourceName = sourceDataSet?.data[value.sourceId]?.name || value.sourceId;
      const targetName = targetDataSet?.data[value.targetId]?.name || value.targetId;
      
      // Convert attributes to a simple object
      const attributeObject: Record<string, any> = {};
      attributes.forEach(attr => {
        attributeObject[attr.attributeName] = attr.attributeValue;
      });
      
      return {
        ...value,
        sourceName,
        targetName,
        attributes: attributeObject
      };
    }));
    
    res.json(enhancedValues);
  } catch (error) {
    console.error('Error fetching relationship values:', error);
    res.status(500).json({ error: 'Failed to fetch relationship values' });
  }
});

/**
 * @route GET /api/external/datasets
 * @description Get a list of all reference data sets
 * @access External API (requires API key)
 */
router.get('/datasets', async (req: Request, res: Response) => {
  try {
    const dataSets = await storage.getAllReferenceDataSets();
    
    // Return only essential information without the data
    const simplifiedDataSets = dataSets.map(({ id, name, description, typeId }) => {
      // Get the type name
      return {
        id,
        name,
        description,
        typeId
      };
    });
    
    res.json(simplifiedDataSets);
  } catch (error) {
    console.error('Error fetching datasets:', error);
    res.status(500).json({ error: 'Failed to fetch datasets' });
  }
});

/**
 * @route GET /api/external/relationships
 * @description Get a list of all relationships
 * @access External API (requires API key)
 */
router.get('/relationships', async (req: Request, res: Response) => {
  try {
    const relationships = await storage.getAllRelationships();
    
    // Get datasets for the relationship source and target info
    const enhancedRelationships = await Promise.all(relationships.map(async (rel) => {
      const sourceDataSet = await storage.getReferenceDataSet(rel.sourceDatasetId);
      const targetDataSet = await storage.getReferenceDataSet(rel.targetDatasetId);
      
      return {
        ...rel,
        sourceDatasetName: sourceDataSet?.name || `Dataset ID: ${rel.sourceDatasetId}`,
        targetDatasetName: targetDataSet?.name || `Dataset ID: ${rel.targetDatasetId}`
      };
    }));
    
    res.json(enhancedRelationships);
  } catch (error) {
    console.error('Error fetching relationships:', error);
    res.status(500).json({ error: 'Failed to fetch relationships' });
  }
});

export default router;