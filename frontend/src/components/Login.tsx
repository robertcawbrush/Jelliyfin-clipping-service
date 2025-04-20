import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await login(username, password);
    } catch (err) {
      console.error('Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-dark-bg)' }}>
      <div className="max-w-md w-full space-y-8 p-8 rounded-lg shadow-lg" style={{ backgroundColor: 'var(--color-dark-surface)' }}>
        <div>
          <h2 className="text-center text-3xl font-extrabold" style={{ color: 'var(--color-dark-text)' }}>
            Sign in to your Jellyfin account
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium" style={{ color: 'var(--color-dark-text)' }}>
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 rounded-md shadow-sm"
                style={{ 
                  backgroundColor: 'var(--color-dark-bg)',
                  color: 'var(--color-dark-text)',
                  borderColor: 'var(--color-dark-text-secondary)'
                }}
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium" style={{ color: 'var(--color-dark-text)' }}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 block w-full px-3 py-2 rounded-md shadow-sm"
                style={{ 
                  backgroundColor: 'var(--color-dark-bg)',
                  color: 'var(--color-dark-text)',
                  borderColor: 'var(--color-dark-text-secondary)'
                }}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 rounded-md shadow-sm text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-dark-primary)' }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}; 