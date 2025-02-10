import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import DocumentComparison from './DocumentComparison';

// Mock router
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: '123' }),
  useNavigate: () => jest.fn(),
}));

// Mock config
jest.mock('../config', () => ({
  __esModule: true,
  default: 'http://localhost:8000'
}));

const mockSuccessResponse = {
  original_content: 'This is the original text.',
  improved_content: 'This is the improved text with changes.',
};

describe('DocumentComparison', () => {
  beforeEach(() => {
    window.localStorage.getItem.mockReturnValue('mock-token');
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <Routes>
          <Route path="*" element={<DocumentComparison />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('shows loading state initially', () => {
    global.fetch.mockImplementationOnce(() => 
      new Promise(() => {})
    );
    
    renderComponent();
    
    expect(screen.getByText('Processing document...')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /loading/i })).toBeInTheDocument();
  });

  it('displays document comparison when data is loaded successfully', async () => {
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockSuccessResponse),
      })
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Original Text')).toBeInTheDocument();
      expect(screen.getByText('Improved Text')).toBeInTheDocument();
      expect(screen.getByText(mockSuccessResponse.original_content)).toBeInTheDocument();
      expect(screen.getByText(/This is the improved text/)).toBeInTheDocument();
    });
  });

  it('handles authentication error and redirects to signin', async () => {
    window.localStorage.getItem.mockReturnValueOnce(null);
    const mockNavigate = jest.fn();
    jest.spyOn(require('react-router-dom'), 'useNavigate')
      .mockImplementation(() => mockNavigate);

    renderComponent();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/signin');
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'redirectAfterLogin',
        '/document-comparison/123'
      );
    });
  });

  it('navigates to export page when export button is clicked', async () => {
    const mockNavigate = jest.fn();
    jest.spyOn(require('react-router-dom'), 'useNavigate')
      .mockImplementation(() => mockNavigate);

    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockSuccessResponse),
      })
    );

    renderComponent();

    await waitFor(() => {
      const exportButton = screen.getByRole('button', { name: /export/i });
      fireEvent.click(exportButton);
      expect(mockNavigate).toHaveBeenCalledWith('/document-export/123');
    });
  });

  it('handles DRF API errors and displays error message', async () => {
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 500,
      })
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch comparison data')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /back to upload/i })).toBeInTheDocument();
    });
  });

  it('handles DRF 401 unauthorized response', async () => {
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 401,
      })
    );

    const mockNavigate = jest.fn();
    jest.spyOn(require('react-router-dom'), 'useNavigate')
      .mockImplementation(() => mockNavigate);

    renderComponent();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/signin');
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('accessToken');
    });
  });
});
