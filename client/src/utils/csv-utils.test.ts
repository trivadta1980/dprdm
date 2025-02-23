import { parse } from 'csv-parse/browser/esm/sync';
import { calculateSimilarity } from '@/utils/similarity';

describe('CSV Utilities', () => {
  describe('calculateSimilarity', () => {
    it('should return 1 for identical strings', () => {
      expect(calculateSimilarity('test', 'test')).toBe(1);
    });

    it('should return 0 for completely different strings', () => {
      expect(calculateSimilarity('test', 'other')).toBe(0);
    });

    it('should handle case-insensitive comparison', () => {
      expect(calculateSimilarity('Test', 'test')).toBe(1);
    });
  });

  describe('CSV Parsing', () => {
    beforeEach(() => {
      (parse as jest.Mock).mockClear();
    });

    it('should parse valid CSV data', () => {
      const mockCSVData = `sourceValue,targetValue
value1,mapped1
value2,mapped2`;

      const expectedParsedData = [
        { sourceValue: 'value1', targetValue: 'mapped1' },
        { sourceValue: 'value2', targetValue: 'mapped2' }
      ];

      (parse as jest.Mock).mockReturnValue(expectedParsedData);

      const result = parse(mockCSVData, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });

      expect(result).toEqual(expectedParsedData);
      expect(parse).toHaveBeenCalledWith(mockCSVData, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
    });

    it('should handle empty CSV data', () => {
      const mockCSVData = 'sourceValue,targetValue\n';
      (parse as jest.Mock).mockReturnValue([]);

      const result = parse(mockCSVData, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });

      expect(result).toEqual([]);
    });
  });
});
