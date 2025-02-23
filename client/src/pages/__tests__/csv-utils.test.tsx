import { parse } from 'csv-parse/browser/esm/sync';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { calculateSimilarity } from '../crosswalk-page';
import type { Mock } from 'vitest';

// Mock CSV parse function
vi.mock('csv-parse/browser/esm/sync', () => ({
  parse: vi.fn()
}));

describe('CSV Utilities', () => {
  const mockCSVContent = `sourceValue,targetValue
Australia,Australia
Brazil,Brasil
Canada,Canada`;

  beforeEach(() => {
    vi.clearAllMocks();
    (parse as Mock).mockImplementation((text: string) => {
      return [
        { sourceValue: 'Australia', targetValue: 'Australia' },
        { sourceValue: 'Brazil', targetValue: 'Brasil' },
        { sourceValue: 'Canada', targetValue: 'Canada' }
      ];
    });
  });

  describe('calculateSimilarity', () => {
    it('should return 1 for exact matches', () => {
      expect(calculateSimilarity('test', 'test')).toBe(1);
      expect(calculateSimilarity('Australia', 'Australia')).toBe(1);
      expect(calculateSimilarity('  test  ', 'test')).toBe(1); // Tests trim
    });

    it('should return 0.8 for similar strings', () => {
      expect(calculateSimilarity('Brasil', 'Brazil')).toBe(0.8);
      expect(calculateSimilarity('Brazil', 'Brasil')).toBe(0.8);
      expect(calculateSimilarity('testing', 'test')).toBe(0.8);
    });

    it('should return 0 for non-matches', () => {
      expect(calculateSimilarity('abc', 'xyz')).toBe(0);
      expect(calculateSimilarity('test', 'completely different')).toBe(0);
    });

    it('should be case insensitive', () => {
      expect(calculateSimilarity('TEST', 'test')).toBe(1);
      expect(calculateSimilarity('Brasil', 'BRAZIL')).toBe(0.8);
    });

    it('should handle whitespace', () => {
      expect(calculateSimilarity('  test  ', '  test')).toBe(1);
      expect(calculateSimilarity('Brasil  ', '  Brazil')).toBe(0.8);
    });
  });

  describe('CSV Parsing', () => {
    it('should parse CSV content correctly', () => {
      const result = parse(mockCSVContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        sourceValue: 'Australia',
        targetValue: 'Australia'
      });
    });

    it('should handle empty CSV content', () => {
      (parse as Mock).mockImplementation(() => []);
      const result = parse('', {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
      expect(result).toHaveLength(0);
    });
  });
});