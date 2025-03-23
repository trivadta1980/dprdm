import { Router, Request, Response } from 'express';
import { storage } from './storage';
import { eq } from 'drizzle-orm';
import { relationshipValues } from '@shared/schema';

const router = Router();

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
    const { id } = req.params;
    const dataSetId = parseInt(id);
    
    if (isNaN(dataSetId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid data set ID'
      });
    }
    
    const dataSet = await storage.getReferenceDataSet(dataSetId);
    
    if (!dataSet) {
      return res.status(404).json({
        status: 'error',
        message: 'Data set not found'
      });
    }
    
    // Filter to only include instances that are approved or don't have a status field
    const filteredData: Record<string, any> = {};
    Object.entries(dataSet.data).forEach(([key, instance]) => {
      // Check if the instance has a status field with an APPROVED value
      // If not, include only if there's no status (legacy data)
      if (!instance.status || instance.status === 'APPROVED') {
        filteredData[key] = instance;
      }
    });
    
    // Return only the filtered data
    const filteredDataSet = {
      ...dataSet,
      data: filteredData
    };
    
    return res.status(200).json({
      status: 'success',
      data: filteredDataSet
    });
  } catch (error) {
    console.error('External API error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/external/relationships/:id/values
 * @description Get all relationship values for a relationship (only approved values)
 * @access External API (requires API key)
 */
router.get('/relationships/:id/values', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const relationshipId = parseInt(id);
    
    if (isNaN(relationshipId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid relationship ID'
      });
    }
    
    // Get the relationship to verify it exists
    const relationship = await storage.getRelationship(relationshipId);
    
    if (!relationship) {
      return res.status(404).json({
        status: 'error',
        message: 'Relationship not found'
      });
    }
    
    // Get only approved relationship values
    const values = await storage.getRelationshipValuesByStatus('APPROVED');
    const filteredValues = values.filter(value => value.relationshipId === relationshipId);
    
    // For each value, get the attribute values
    const enhancedValues = await Promise.all(filteredValues.map(async (value) => {
      const attributeValues = await storage.getRelationshipAttributeValues(value.id);
      return {
        ...value,
        attributeValues
      };
    }));
    
    return res.status(200).json({
      status: 'success',
      data: enhancedValues
    });
  } catch (error) {
    console.error('External API error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
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
    
    // Return only metadata, not the actual data
    const dataSetsMeta = dataSets.map(dataSet => ({
      id: dataSet.id,
      name: dataSet.name,
      description: dataSet.description,
      typeId: dataSet.typeId,
      createdAt: dataSet.createdAt,
      updatedAt: dataSet.updatedAt
    }));
    
    return res.status(200).json({
      status: 'success',
      data: dataSetsMeta
    });
  } catch (error) {
    console.error('External API error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
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
    
    return res.status(200).json({
      status: 'success',
      data: relationships
    });
  } catch (error) {
    console.error('External API error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

export default router;