import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from './CustomComponents';
import { Button } from './CustomComponents';
import { Input } from './CustomComponents';
import apiUrl from '../config';

const SignUpComponent = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password1, setPassword1] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${apiUrl}/user/registration/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password1,
          password2,
        }),
      });


      if (response.ok) {
        const data = await response.json();
        setSuccess(true);
        setError(null);
        setTimeout(() => {
          navigate('/sign-in');
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.detail);
        setSuccess(false);
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
      setSuccess(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Sign Up</h2>

        {error && (
          <Alert variant="danger">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert variant="success">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              You have successfully signed up! Redirecting to the sign-in page...
            </AlertDescription>
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
            <label htmlFor="email" className="block font-medium mb-1">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password1" className="block font-medium mb-1">
              Password
            </label>
            <Input
              id="password1"
              type="password"
              value={password1}
              onChange={(e) => setPassword1(e.target.value)}
              required
	          autoComplete="new-password"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password2" className="block font-medium mb-1">
              Confirm Password
            </label>
            <Input
              id="password2"
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-between items-center">
            <Button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white">
              Sign Up
            </Button>
            <button
              type="button"
              className="text-blue-500 hover:text-blue-600"
              onClick={() => navigate('/sign-in')}
            >
              Already have an account? Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUpComponent;
