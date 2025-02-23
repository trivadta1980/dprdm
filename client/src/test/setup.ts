import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock CSV parse function
vi.mock('csv-parse/browser/esm/sync', () => ({
  parse: vi.fn()
}));

// Mock fetch
global.fetch = vi.fn();

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn();
global.URL.revokeObjectURL = vi.fn();

// Mock document.createElement for CSV export
document.createElement = vi.fn().mockImplementation((tag) => {
  if (tag === 'a') {
    return {
      setAttribute: vi.fn(),
      click: vi.fn(),
      download: '',
      href: '',
    };
  }
  return null;
});

// Reset all mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});
