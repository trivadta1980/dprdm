import '@testing-library/jest-dom';
import { vi, afterEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { cleanup } from '@testing-library/react';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock CSV parse function
vi.mock('csv-parse/browser/esm/sync', () => ({
  parse: vi.fn()
}));

// Mock fetch
global.fetch = vi.fn();

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock document.createElement for CSV export
const originalCreateElement = document.createElement.bind(document);
document.createElement = vi.fn((tagName: string) => {
  const element = originalCreateElement(tagName);
  if (tagName === 'a') {
    // Add missing properties that jsdom doesn't implement
    Object.defineProperty(element, 'click', {
      value: vi.fn(),
      writable: true
    });
  }
  return element;
});

// Create a test QueryClient instance
export const testQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Reset all mocks and cleanup React components after each test
afterEach(() => {
  vi.clearAllMocks();
  testQueryClient.clear();
  cleanup();
});