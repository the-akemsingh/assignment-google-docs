import React, { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await login(email);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to log in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Login</h1>
      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
        disabled={isLoading}
      />
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Log in'}
      </button>
    </form>
  );
};