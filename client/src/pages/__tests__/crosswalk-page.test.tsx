import { render, screen, fireEvent, waitFor } from '../../test/test-utils';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CrosswalkPage from '../crosswalk-page';
import { QueryClient } from '@tanstack/react-query';

// Mock the routing
vi.mock('wouter', () => ({
  useParams: () => ({ id: undefined }),
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
  useLocation: () => ['/', () => {}]
}));

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('CrosswalkPage', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const mockReferenceData = [
    { id: 1, name: 'Dataset 1', typeId: 1 },
    { id: 2, name: 'Dataset 2', typeId: 1 },
    { id: 3, name: 'Dataset 3', typeId: 2 }
  ];

  const mockSchemas = [
    { name: 'attribute1' },
    { name: 'attribute2' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();

    // Mock API responses
    global.fetch = vi.fn()
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockReferenceData)
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockSchemas)
      }));
  });

  const renderComponent = () => {
    return render(<CrosswalkPage />);
  };

  describe('Form Validation', () => {
    it('should disable save button when required fields are empty', async () => {
      renderComponent();
      // Wait for initial render
      await waitFor(() => {
        const saveButton = screen.getByText(/save mappings/i, { exact: false });
        expect(saveButton).toBeDisabled();
      });
    });

    it('should enable save button when all required fields are filled', async () => {
      renderComponent();

      // Fill in required fields
      const nameInput = screen.getByLabelText(/mapping name/i);
      fireEvent.change(nameInput, {
        target: { value: 'Test Mapping' }
      });

      // Select source dataset using placeholder text
      const sourceSelect = screen.getByPlaceholderText(/choose a dataset/i);
      fireEvent.click(sourceSelect);
      await waitFor(() => {
        const sourceOption = screen.getByText('Dataset 1');
        fireEvent.click(sourceOption);
      });

      // Wait for schemas to load and select attribute
      await waitFor(() => {
        const attributeSelect = screen.getByPlaceholderText(/choose an attribute/i);
        fireEvent.click(attributeSelect);
        const attributeOption = screen.getByText('attribute1');
        fireEvent.click(attributeOption);
      });

      // Select target dataset
      const targetSelect = screen.getByPlaceholderText(/choose a target dataset/i);
      fireEvent.click(targetSelect);
      await waitFor(() => {
        const targetOption = screen.getByText('Dataset 2');
        fireEvent.click(targetOption);
      });

      // Verify save button is enabled
      await waitFor(() => {
        const saveButton = screen.getByText(/save mappings/i, { exact: false });
        expect(saveButton).not.toBeDisabled();
      });
    });
  });

  describe('CSV Import/Export', () => {
    it('should handle CSV file upload', async () => {
      renderComponent();
      const file = new File(
        ['sourceValue,targetValue\ntest1,test2'],
        'test.csv',
        { type: 'text/csv' }
      );

      const input = screen.getByLabelText(/import from csv/i);
      Object.defineProperty(input, 'files', {
        value: [file]
      });
      fireEvent.change(input);

      await waitFor(() => {
        expect(screen.getByText(/imported \d+ mappings from csv/i)).toBeInTheDocument();
      });
    });

    it('should show error for invalid CSV format', async () => {
      renderComponent();
      const file = new File(
        ['invalid,csv,format'],
        'test.csv',
        { type: 'text/csv' }
      );

      const input = screen.getByLabelText(/import from csv/i);
      Object.defineProperty(input, 'files', {
        value: [file]
      });
      fireEvent.change(input);

      await waitFor(() => {
        expect(screen.getByText(/csv must have 'sourcevalue' and 'targetvalue' columns/i)).toBeInTheDocument();
      });
    });
  });

  describe('Dataset Selection', () => {
    it('should filter available target datasets based on source dataset type', async () => {
      renderComponent();

      // Select source dataset
      const sourceSelect = screen.getByPlaceholderText(/choose a dataset/i);
      fireEvent.click(sourceSelect);
      await waitFor(() => {
        const sourceOption = screen.getByText('Dataset 1');
        fireEvent.click(sourceOption);
      });

      // Check target dataset options
      const targetSelect = screen.getByPlaceholderText(/choose a target dataset/i);
      fireEvent.click(targetSelect);

      // Should show Dataset 2 (same type) but not Dataset 3 (different type)
      await waitFor(() => {
        expect(screen.getByText('Dataset 2')).toBeInTheDocument();
        expect(screen.queryByText('Dataset 3')).not.toBeInTheDocument();
      });
    });
  });
});