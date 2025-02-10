import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignUpComponent from './SignUpComponent';

// Mock the useNavigate function from react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}));

// Mock the API URL
jest.mock('../config', () => ({
  default: 'http://127.0.0.1:8000'
}));

describe('SignUpComponent', () => {
  // Reset mocks and create a global fetch mock before each test
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  // Helper function to fill out the sign-up form
  const fillForm = async (user, { username = 'testuser', email = 'test@example.com', password1 = 'password123', password2 = 'password123' } = {}) => {
    await user.type(screen.getByLabelText(/username/i), username);
    await user.type(screen.getByLabelText(/email/i), email);
    await user.type(screen.getByLabelText(/^password$/i), password1);
    await user.type(screen.getByLabelText(/confirm password/i), password2);
  };

  it('renders all form fields and buttons', () => {
    render(<SignUpComponent />);
    
    // Check that all form fields and buttons are present
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /already have an account\? sign in/i })).toBeInTheDocument();
  });

  it('navigates to sign-in page when clicking the sign in link', async () => {
    render(<SignUpComponent />);
    
    const signInLink = screen.getByRole('button', { name: /already have an account\? sign in/i });
    await userEvent.click(signInLink);
    
    expect(mockNavigate).toHaveBeenCalledWith('/sign-in');
  });

  it('handles successful registration', async () => {
    const user = userEvent.setup();
    render(<SignUpComponent />);

    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'Registration successful' })
      })
    );

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    // Check that success message appears and API call is correct
    await waitFor(() => {
      expect(screen.getByText(/you have successfully signed up/i)).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/user/registration/',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'testuser',
          email: 'test@example.com',
          password1: 'password123',
          password2: 'password123'
        })
      })
    );

    // Wait for navigation after success message
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/sign-in');
    }, { timeout: 2500 });
  });

  it('displays error message on API error', async () => {
    const user = userEvent.setup();
    render(<SignUpComponent />);

    const errorMessage = 'Invalid email format';
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ detail: errorMessage })
      })
    );

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('handles network errors', async () => {
    const user = userEvent.setup();
    render(<SignUpComponent />);

    global.fetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')));

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/an error occurred\. please try again later\./i)).toBeInTheDocument();
    });
  });

  it('requires all fields to be filled', async () => {
    render(<SignUpComponent />);
    
    const submitButton = screen.getByRole('button', { name: /sign up/i });
    
    // Attempt to submit without filling form fields
    await userEvent.click(submitButton);
    
    // Verify fetch was not called and required attributes are enforced
    expect(global.fetch).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/username/i)).toBeRequired();
    expect(screen.getByLabelText(/email/i)).toBeRequired();
    expect(screen.getByLabelText(/^password$/i)).toBeRequired();
    expect(screen.getByLabelText(/confirm password/i)).toBeRequired();
  });
});
