import { render, RenderOptions } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactElement } from 'react';
import { testQueryClient } from './setup';
import { AuthProvider } from '@/hooks/use-auth';
import { vi } from 'vitest';

const mockAuthValue = {
  user: { id: 1, email: 'test@example.com', username: 'testuser' },
  login: vi.fn(),
  logout: vi.fn(),
  isAuthenticated: true,
};

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={testQueryClient}>
      <AuthProvider value={mockAuthValue}>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };