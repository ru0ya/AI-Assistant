import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignIn from './SignIn'; // Adjust path if needed

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}));

// Mock configuration URL for Django backend
jest.mock('../config', () => ({
  default: 'http://127.0.0.1:8000'
}));

describe('SignIn Component', () => {
  // Setup global mocks
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    global.localStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn()
    };
    global.window.axios = {
      defaults: {
        headers: {
          common: {}
        }
      },
      interceptors: {
        response: {
          use: jest.fn()
        }
      }
    };
  });

  // Helper function to fill the form
  const fillForm = async (user, { username = 'testuser', password = 'password123' } = {}) => {
    await user.type(screen.getByLabelText(/username/i), username);
    await user.type(screen.getByLabelText(/password/i), password);
  };

  it('renders all form elements correctly', () => {
    render(<SignIn />);
    
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /don't have an account\? sign up/i })).toBeInTheDocument();
    expect(screen.getByText(/forgot password\?/i)).toBeInTheDocument();
  });

  it('navigates to sign-up page when clicking the sign-up link', async () => {
    render(<SignIn />);
    
    const signUpLink = screen.getByRole('button', { name: /don't have an account\? sign up/i });
    await userEvent.click(signUpLink);
    
    expect(mockNavigate).toHaveBeenCalledWith('/sign-up');
  });

  it('handles successful login', async () => {
    const user = userEvent.setup();
    render(<SignIn />);

    const mockToken = 'mock-access-token';
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          access: mockToken,
          access_token: mockToken
        })
      })
    );

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith('accessToken', mockToken);
      expect(window.axios.defaults.headers.common['Authorization']).toBe(`Bearer ${mockToken}`);
      expect(mockNavigate).toHaveBeenCalledWith('/documents');
    });

    // Verify API call
    expect(global.fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/user-auth/login/',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'testuser',
          password: 'password123'
        })
      })
    );
  });

  it('displays error message on failed login', async () => {
    const user = userEvent.setup();
    render(<SignIn />);

    const errorMessage = 'Invalid credentials';
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ detail: errorMessage })
      })
    );

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('handles network errors during login', async () => {
    const user = userEvent.setup();
    render(<SignIn />);

    global.fetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')));

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/an error occurred\. please try again later\./i)).toBeInTheDocument();
    });
  });

  it('requires all fields to be filled', async () => {
    render(<SignIn />);
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await userEvent.click(submitButton);
    
    expect(global.fetch).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/username/i)).toBeRequired();
    expect(screen.getByLabelText(/password/i)).toBeRequired();
  });

  describe('Token Refresh', () => {
    it('successfully refreshes token', async () => {
      const user = userEvent.setup();
      render(<SignIn />);

      const mockRefreshToken = 'mock-refresh-token';
      const mockNewToken = 'mock-new-token';
      
      localStorage.getItem.mockReturnValue(mockRefreshToken);
      
      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            access: mockNewToken
          })
        })
      );

      // Trigger the refresh token function through the interceptor
      const interceptorCallback = window.axios.interceptors.response.use.mock.calls[0][1];
      await interceptorCallback({
        response: { status: 401 },
        config: { _retry: false }
      });

      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith('accessToken', mockNewToken);
        expect(window.axios.defaults.headers.common['Authorization']).toBe(`Bearer ${mockNewToken}`);
      });
    });

    it('handles failed token refresh by logging out', async () => {
      render(<SignIn />);

      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ detail: 'Invalid refresh token' })
        })
      );

      // Trigger refresh token
      const interceptorCallback = window.axios.interceptors.response.use.mock.calls[0][1];
      await interceptorCallback({
        response: { status: 401 },
        config: { _retry: false }
      }).catch(() => {});

      await waitFor(() => {
        expect(localStorage.removeItem).toHaveBeenCalledWith('accessToken');
        expect(localStorage.removeItem).toHaveBeenCalledWith('refreshToken');
        expect(mockNavigate).toHaveBeenCalledWith('/sign-in');
      });
    });
  });

  it('sets up axios interceptor on mount', () => {
    render(<SignIn />);
    expect(window.axios.interceptors.response.use).toHaveBeenCalled();
  });
});
