import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CrosswalkPage from './crosswalk-page';
import { useQuery, useMutation } from '@tanstack/react-query';
import { parse } from 'csv-parse/browser/esm/sync';

// Mock react-query hooks
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn()
}));

// Mock wouter
vi.mock('wouter', () => ({
  useParams: () => ({ id: undefined }),
  Link: ({ children }: { children: React.ReactNode }) => <a href="#">{children}</a>
}));

describe('CrosswalkPage', () => {
  const mockDatasets = [
    { id: 1, name: 'Dataset 1', typeId: 1 },
    { id: 2, name: 'Dataset 2', typeId: 1 }
  ];

  beforeEach(() => {
    // Setup default mocks
    (useQuery as jest.Mock).mockImplementation((options) => ({
      data: options.queryKey[0] === '/api/reference-data' ? mockDatasets : [],
      isLoading: false
    }));

    (useMutation as jest.Mock).mockImplementation(() => ({
      mutate: vi.fn(),
      isPending: false
    }));
  });

  it('renders the crosswalk page with initial state', () => {
    render(<CrosswalkPage />);
    
    expect(screen.getByText('Create Crosswalk')).toBeInTheDocument();
    expect(screen.getByText('Map Source to Target Attributes')).toBeInTheDocument();
  });

  it('handles CSV file upload', async () => {
    render(<CrosswalkPage />);
    
    const file = new File(
      ['sourceValue,targetValue\nvalue1,mapped1'],
      'test.csv',
      { type: 'text/csv' }
    );

    const fileInput = screen.getByLabelText(/Import from CSV/i);
    
    await userEvent.upload(fileInput, file);

    expect(parse).toHaveBeenCalled();
  });

  it('validates required fields before saving', async () => {
    const { getByText } = render(<CrosswalkPage />);
    
    const saveButton = getByText(/Save Mapping/i);
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/Please select source and target datasets/i)).toBeInTheDocument();
    });
  });

  it('exports mappings to CSV', async () => {
    const mockMappings = [
      { sourceValue: 'value1', targetValue: 'mapped1', confidence: 1 },
      { sourceValue: 'value2', targetValue: 'mapped2', confidence: 0.8 }
    ];

    (useQuery as jest.Mock).mockImplementation(() => ({
      data: mockMappings,
      isLoading: false
    }));

    render(<CrosswalkPage />);

    const exportButton = screen.getByText(/Export to CSV/i);
    fireEvent.click(exportButton);

    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(document.createElement).toHaveBeenCalledWith('a');
  });
});
