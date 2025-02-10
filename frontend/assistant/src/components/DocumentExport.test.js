import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import DocumentExport from './DocumentExport';
import * as config from '../config';

// Mock the config to use the correct base URL
jest.mock('../config', () => ({
  __esModule: true,
  default: 'http://127.0.0.1:8000',
}));

// Mock fetch and localStorage
const mockFetch = jest.fn();
global.fetch = mockFetch;
global.localStorage = {
  getItem: jest.fn(() => 'mock-token'),
};

// Mock URL methods
const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();
window.URL.createObjectURL = mockCreateObjectURL;
window.URL.revokeObjectURL = mockRevokeObjectURL;

describe('DocumentExport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('renders export button with icon', () => {
    render(<DocumentExport id="123" />);
    const button = screen.getByRole('button', { name: /export/i });
    
    expect(button).toBeInTheDocument();
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('handles successful export', async () => {
    const mockBlob = new Blob(['test content'], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });
    mockCreateObjectURL.mockReturnValue('mock-url');

    render(<DocumentExport id="123" />);
    const button = screen.getByRole('button', { name: /export/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'http://127.0.0.1:8000/documents/123/export/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
          },
        }
      );
      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('mock-url');
    });

    // Verify anchor cleanup
    expect(document.querySelector('a')).toBeNull();
  });

  it('handles export failure', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<DocumentExport id="123" />);
    const button = screen.getByRole('button', { name: /export/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error exporting document:',
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });

  it('handles missing access token', async () => {
    localStorage.getItem.mockReturnValueOnce(null);
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<DocumentExport id="123" />);
    const button = screen.getByRole('button', { name: /export/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockFetch).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error: No access token available for export'
      );
    });

    consoleSpy.mockRestore();
  });
});
