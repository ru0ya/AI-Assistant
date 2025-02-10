import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DocumentUpload from './DocumentUpload';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock config
jest.mock('../config', () => ({
  default: 'http://127.0.0.1:8000',
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Upload: () => <div data-testid="upload-icon">Upload Icon</div>,
  Loader2: () => <div data-testid="loader-icon">Loader Icon</div>,
}));

describe('DocumentUpload', () => {
  const mockToken = 'mock-access-token';

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    global.localStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };
  });

  // Helper function to create a mock file
  const createMockFile = (name = 'test.pdf', type = 'application/pdf', size = 1024) => {
    return new File(['mock content'], name, { type });
  };

  it('redirects to signin if no token is present on mount', () => {
    localStorage.getItem.mockReturnValue(null);
    render(<DocumentUpload />);

    expect(localStorage.setItem).toHaveBeenCalledWith('redirectAfterLogin', '/document-upload');
    expect(mockNavigate).toHaveBeenCalledWith('/signin');
  });

  it('renders upload interface when authenticated', () => {
    localStorage.getItem.mockReturnValue(mockToken);
    render(<DocumentUpload />);

    expect(screen.getByText(/click to upload/i)).toBeInTheDocument();
    expect(screen.getByText(/Upload Document/i)).toBeInTheDocument();
  });

  it('handles file selection', async () => {
    localStorage.getItem.mockReturnValue(mockToken);
    render(<DocumentUpload />);

    const file = createMockFile();
    const input = screen.getByLabelText(/click to upload/i);

    await userEvent.upload(input, file);

    expect(screen.getByText(`Selected: ${file.name}`)).toBeInTheDocument();
  });

  it('successfully uploads a document', async () => {
    localStorage.getItem.mockReturnValue(mockToken);
    const documentId = '123';

    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: documentId }),
    });

    render(<DocumentUpload />);

    const file = createMockFile();
    const input = screen.getByLabelText(/click to upload/i);
    await userEvent.upload(input, file);

    const uploadButton = screen.getByRole('button', { name: /upload document/i });
    await userEvent.click(uploadButton);

    // Verify API call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://127.0.0.1:8000/documents/upload/',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`,
          }),
        })
      );
    });

    // Verify navigation to comparison page
    expect(mockNavigate).toHaveBeenCalledWith(`/document-comparison/${documentId}`);
  });

  it('handles unauthorized error during upload', async () => {
    localStorage.getItem.mockReturnValue(mockToken);

    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ detail: 'Unauthorized' }),
    });

    render(<DocumentUpload />);

    const file = createMockFile();
    const input = screen.getByLabelText(/click to upload/i);
    await userEvent.upload(input, file);

    const uploadButton = screen.getByRole('button', { name: /upload document/i });
    await userEvent.click(uploadButton);

    await waitFor(() => {
      expect(localStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(localStorage.setItem).toHaveBeenCalledWith('redirectAfterLogin', '/document-upload');
      expect(mockNavigate).toHaveBeenCalledWith('/signin');
    });
  });

  it('handles general upload errors', async () => {
    localStorage.getItem.mockReturnValue(mockToken);
    const errorMessage = 'Upload failed';

    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ detail: errorMessage }),
    });

    render(<DocumentUpload />);

    const file = createMockFile();
    const input = screen.getByLabelText(/click to upload/i);
    await userEvent.upload(input, file);

    const uploadButton = screen.getByRole('button', { name: /upload document/i });
    await userEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('handles network errors', async () => {
    localStorage.getItem.mockReturnValue(mockToken);

    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<DocumentUpload />);

    const file = createMockFile();
    const input = screen.getByLabelText(/click to upload/i);
    await userEvent.upload(input, file);

    const uploadButton = screen.getByRole('button', { name: /upload document/i });
    await userEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('shows loading state during upload', async () => {
    localStorage.getItem.mockReturnValue(mockToken);

    global.fetch.mockResolvedValueOnce(
      new Promise((resolve) =>
        setTimeout(() => resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ id: '123' }),
        }), 100)
      )
    );

    render(<DocumentUpload />);

    const file = createMockFile();
    const input = screen.getByLabelText(/click to upload/i);
    await userEvent.upload(input, file);

    const uploadButton = screen.getByRole('button', { name: /upload document/i });
    await userEvent.click(uploadButton);

    expect(screen.getByText('Uploading...')).toBeInTheDocument();
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    expect(uploadButton).toBeDisabled();
  });

  it('disables upload button when no file is selected', () => {
    localStorage.getItem.mockReturnValue(mockToken);
    render(<DocumentUpload />);

    const uploadButton = screen.getByRole('button', { name: /upload document/i });
    expect(uploadButton).toBeDisabled();
  });

  it('accepts only allowed file types', () => {
    localStorage.getItem.mockReturnValue(mockToken);
    render(<DocumentUpload />);

    const input = screen.getByLabelText(/click to upload/i);
    expect(input).toHaveAttribute('accept', '.txt,.docx,.pdf');
  });
});
