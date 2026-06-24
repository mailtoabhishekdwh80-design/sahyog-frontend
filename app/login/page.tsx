'use client';
import { useState } from 'react';
import { api } from '../../lib/api';

export default function LoginPage() {
  const [email, setEmail]       = useState('admin@deemona.com');
  const [password, setPassword] = useState('Demo@2026');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError('');
    const result = await api.login(email, password);
    if (result.ok) {
      window.location.href = '/';
    } else {
      setError(result.error || 'Login failed');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-600 mb-4">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <h1 className="text-white text-2xl font-bold">Sahyog</h1>
          <p className="text-gray-400 text-sm mt-1">Sign in to your workspace</p>
        </div>

        {/* Form */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-4">
          {error && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <p className="text-center text-xs text-gray-500 pt-1">
            Demo: admin@deemona.com / Demo@2026
          </p>
        </div>
      </div>
    </div>
  );
}
