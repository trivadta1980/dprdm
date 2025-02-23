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
global.URL.createObjectURL = vi.fn();
global.URL.revokeObjectURL = vi.fn();

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