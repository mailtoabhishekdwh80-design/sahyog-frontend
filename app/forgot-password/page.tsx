'use client';
import { useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('');
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email) { setError('Please enter your email'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/password/forgot`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      });
      await res.json();
      // Always show success to prevent email enumeration
      setSent(true);
    } catch {
      setError('Cannot connect to server. Please try again.');
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
          <h1 className="text-white text-2xl font-bold">Reset your password</h1>
          <p className="text-gray-400 text-sm mt-1">
            {sent ? 'Check your inbox' : "We'll send you a reset link"}
          </p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          {sent ? (
            /* Success state */
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto">
                <span className="text-3xl">📧</span>
              </div>
              <div>
                <p className="text-white font-medium">Email sent!</p>
                <p className="text-gray-400 text-sm mt-1">
                  If <span className="text-emerald-400">{email}</span> is registered,
                  you'll receive a password reset link shortly.
                </p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 text-xs text-gray-400 text-left space-y-1">
                <p>• Check your spam/junk folder</p>
                <p>• The link expires in 1 hour</p>
                <p>• You can only use the link once</p>
              </div>
              <button
                onClick={() => { setSent(false); setEmail(''); }}
                className="text-sm text-emerald-400 hover:text-emerald-300"
              >
                Try a different email
              </button>
            </div>
          ) : (
            /* Form state */
            <div className="space-y-4">
              {error && (
                <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  placeholder="you@company.com"
                  autoFocus
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2.5 text-sm border border-gray-700 focus:outline-none focus:border-emerald-500 placeholder-gray-500"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Remember your password?{' '}
          <a href="/login" className="text-emerald-400 hover:text-emerald-300">Sign in</a>
        </p>
      </div>
    </div>
  );
}
