import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from './CustomComponents';
import { Button } from './CustomComponents';
import { Input } from './CustomComponents';
import apiUrl from '../config';


const AuthComponent = () => {
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let response;
      let url;

      if (isSigningUp) {
        url = `${apiUrl}/user/registration/`;
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username,
            email,
            password1: password,
            password2: confirmPassword,
          }),
        });
      } else {
        url = `${apiUrl}/user-auth/login/`;
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username,
            email,
            password,
          }),
        });
      }

      if (response.ok) {
        const data = await response.json();

        localStorage.setItem('authToken', data.token);
        navigate('/documents');
      } else {
        const errorData = await response.json();
        setError(errorData.detail);
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
    }
  };

  const handleToggleSignUp = () => {
    setIsSigningUp((prev) => !prev);
    setError(null);
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">
          {isSigningUp ? 'Sign Up' : 'Sign In'}
        </h2>

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

          {isSigningUp && (
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
          )}

          <div className="mb-4">
            <label htmlFor="password1" className="block font-medium mb-1">
              Password
            </label>
            <Input
              id="password1"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

	     {isSigningUp && (
			 <div className="mb-4">
			  <label htmlFor="confirmPassword" className="block font-medium mb-1">
				  Confirm Password
				</label>
				<Input
				  id="confirmPassword"
				  type="password"
				  value={confirmPassword}
				  onChange={(e) => setPassword(e.target.value)}
				  required
				/>
			  </div>
		 )}

          <div className="flex justify-between items-center">
            <Button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white">
              {isSigningUp ? 'Sign Up' : 'Sign In'}
            </Button>
            <button
              type="button"
              className="text-blue-500 hover:text-blue-600"
              onClick={handleToggleSignUp}
            >
              {isSigningUp
                ? 'Already have an account? Sign In'
                : 'Don\'t have an account? Sign Up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthComponent;
