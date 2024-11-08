import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from './CustomComponents';
import { Button } from './CustomComponents';
import { Input } from './CustomComponents';
import apiUrl from '../config';

const SignInComponent = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${apiUrl}/user-auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        localStorage.setItem('accessToken', data.access);
		// localStorage.setItem('refreshToken', data.refresh);
		setupAuthHeader(data.access_token);

        navigate('/documents');
      } else {
        const errorData = await response.json();
        setError(errorData.detail);
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
    }
  };


  const refreshToken = async () => {
	  try {
		  const refresh = localStorage.getItem('refreshToken');
		  const response = await fetch(`${apiUrl}/user-auth/token/refresh/`, {
			  method: 'POST',
			  headers: {
				  'Content-Type': 'application/json',
			  },
			  body: JSON.stringify({
				  refresh,
			  }),
		  });

		  if (response.ok) {
			  const data = await response.json();
			  localStorage.setItem('accessToken', data.access);
			  setupAuthHeader(data.access);
		  } else {
			  handleLogout();
			  throw new Error('Refresh token invalid');
		  }
	  } catch (error) {
		  console.error('Error refreshing token:', error);
		  handleLogout();
		  throw error;
	  }
  };

  const handleLogout = () => {
	  localStorage.removeItem('accessToken');
	  localStorage.removeItem('refreshToken');
	  navigate('/sign-in');
  };

  const setupAuthHeader = (token) => {
	  if (window.axios) {
		  window.axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
	  }
  };

    React.useEffect(() => {
    if (window.axios) {
      window.axios.interceptors.response.use(
        (response) => response,
        async (error) => {
          const originalRequest = error.config;
          
          if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
              const newToken = await refreshToken();
              originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
              return window.axios(originalRequest);
            } catch (refreshError) {
              return Promise.reject(refreshError);
            }
          }
          return Promise.reject(error);
        }
      );
    }
  }, []);

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Sign In</h2>

        {error && (
          <Alert variant="danger">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block font-medium mb-1">
              Username
            </label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="block font-medium mb-1">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-between items-center">
            <Button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white">
              Sign In
            </Button>
            <button
              type="button"
              className="text-blue-500 hover:text-blue-600"
              onClick={() => navigate('/sign-up')}
            >
              Don't have an account? Sign Up
            </button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <a href="#" className="text-blue-500 hover:text-blue-600">
            Forgot Password?
          </a>
        </div>
      </div>
    </div>
  );
};

export default SignInComponent;
