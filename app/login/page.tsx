'use client';
import { useState } from 'react';
import { api } from '../../lib/api';

export default function LoginPage() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleLogin() {
    setLoading(true); setError('');
    const result = await api.login(email, password);
    if (result.ok) {
      window.location.href = '/workspace';
    } else {
      setError(result.error || 'Login failed');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-600 mb-4">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <h1 className="text-slate-900 text-2xl font-bold">Deemona Teams</h1>
          <p className="text-slate-600 text-base mt-1">Sign in to your workspace</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 text-base rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-base text-slate-600 mb-1.5 font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full bg-slate-100 text-slate-900 rounded-lg px-3 py-2.5 text-base border border-slate-300 focus:outline-none focus:border-emerald-500 placeholder-gray-500"
            />
          </div>

          <div>
            <label className="block text-base text-slate-600 mb-1.5 font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="••••••••"
              className="w-full bg-slate-100 text-slate-900 rounded-lg px-3 py-2.5 text-base border border-slate-300 focus:outline-none focus:border-emerald-500 placeholder-gray-500"
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-base transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <div className="flex items-center justify-between pt-1">
            <p className="text-base text-gray-500">Demo: admin@deemona.com</p>
            <a href="/forgot-password" className="text-base text-emerald-700 hover:text-emerald-700">
              Forgot password?
            </a>
          </div>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-slate-300"></div>
            <span className="mx-3 text-base text-gray-600">or</span>
            <div className="flex-grow border-t border-slate-300"></div>
          </div>

          
          <a
            href="https://sahyog-api-ajbr.onrender.com/api/v1/auth/google"
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-medium py-2.5 rounded-lg text-base transition-colors border border-gray-200"
          >
            <span style={{fontWeight:900,fontSize:16,color:"#4285F4",fontFamily:"serif"}}>G</span>
            Continue with Google
          </a>
        </div>

        {/* Signup link — inside the max-w-sm container */}
        <p className="text-center text-base text-gray-500 mt-6">
          Don't have an account?{' '}
          <a href="/signup" className="text-emerald-700 hover:text-emerald-700">Create workspace</a>
        </p>
      </div>
    </div>
  );
}
