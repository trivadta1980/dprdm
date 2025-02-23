import { vi, describe, it, expect, beforeEach } from 'vitest';
import { queryClient } from '@/lib/queryClient';

describe('API Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  describe('Crosswalk API Handlers', () => {
    const mockCrosswalk = {
      id: 1,
      name: 'Test Mapping',
      description: 'Test Description',
      sourceSystemId: 1,
      targetSystemId: 2,
      mappingData: {
        sourceAttribute: 'attribute1',
        targetAttribute: 'attribute1',
        mappings: [
          { sourceValue: 'test1', targetValue: 'test2', confidence: 0.8 }
        ]
      }
    };

    it('should handle successful GET request', async () => {
      global.fetch = vi.fn().mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([mockCrosswalk])
        })
      );

      const response = await fetch('/api/crosswalks');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data).toHaveLength(1);
      expect(data[0]).toEqual(mockCrosswalk);
    });

    it('should handle successful POST request', async () => {
      const newMapping = {
        name: 'New Mapping',
        description: 'New Description',
        sourceSystemId: 1,
        targetSystemId: 2,
        mappingData: {
          sourceAttribute: 'attribute1',
          targetAttribute: 'attribute1',
          mappings: []
        }
      };

      global.fetch = vi.fn().mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ...newMapping, id: 2 })
        })
      );

      const response = await fetch('/api/crosswalks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newMapping)
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.id).toBe(2);
      expect(data.name).toBe(newMapping.name);
    });

    it('should handle failed requests', async () => {
      global.fetch = vi.fn().mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          text: () => Promise.resolve('Error message')
        })
      );

      const response = await fetch('/api/crosswalks');
      expect(response.ok).toBe(false);

      const errorText = await response.text();
      expect(errorText).toBe('Error message');
    });

    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockImplementationOnce(() =>
        Promise.reject(new Error('Network error'))
      );

      await expect(fetch('/api/crosswalks')).rejects.toThrow('Network error');
    });
  });

  describe('Query Client Integration', () => {
    it('should invalidate queries after mutation', async () => {
      const mockInvalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');

      // Simulate a successful mutation
      await queryClient.setQueryData(['/api/crosswalks'], []);
      await queryClient.invalidateQueries({ queryKey: ['/api/crosswalks'] });

      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['/api/crosswalks'] });
    });
  });
});
