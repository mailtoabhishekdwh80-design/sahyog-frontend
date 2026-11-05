'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

function ResetForm() {
  const searchParams  = useSearchParams();
  const token         = searchParams.get('token');

  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
    } else {
      setTokenValid(true);
    }
  }, [token]);

  async function handleReset() {
    setError('');
    if (!password) { setError('Please enter a new password'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/password/reset`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok && !data?.error) {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => { window.location.href = '/login'; }, 3000);
      } else {
        setError(data?.error?.message || 'Reset failed. The link may have expired.');
      }
    } catch {
      setError('Cannot connect to server. Please try again.');
    }
    setLoading(false);
  }

  // Password strength
  const strength = password.length === 0 ? 0
    : password.length < 6  ? 1
    : password.length < 8  ? 2
    : password.length < 12 ? 3
    : 4;

  const strengthLabel = ['', 'Too short', 'Weak', 'Good', 'Strong'];
  const strengthColor = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500'];

  if (tokenValid === false) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
          <span className="text-3xl">⚠️</span>
        </div>
        <div>
          <p className="text-slate-900 font-medium">Invalid reset link</p>
          <p className="text-slate-600 text-sm mt-1">
            This password reset link is invalid or has expired.
          </p>
        </div>
        <a href="/forgot-password"
          className="inline-block bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          Request a new link
        </a>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
          <span className="text-3xl">✅</span>
        </div>
        <div>
          <p className="text-slate-900 font-medium">Password reset successfully!</p>
          <p className="text-slate-600 text-sm mt-1">
            Redirecting you to login in 3 seconds...
          </p>
        </div>
        <a href="/login" className="text-emerald-700 hover:text-emerald-700 text-sm">
          Go to login now →
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 text-sm rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div>
        <label className="block text-[13px] text-slate-600 mb-1.5 font-medium">New password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Min. 8 characters"
          autoFocus
          className="w-full bg-slate-100 text-slate-900 rounded-lg px-3 py-2.5 text-sm border border-slate-300 focus:outline-none focus:border-emerald-500 placeholder-gray-500"
        />
        {/* Strength bar */}
        {password && (
          <div className="mt-2 space-y-1">
            <div className="flex gap-1">
              {[1,2,3,4].map(i => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColor[strength] : 'bg-slate-200'}`} />
              ))}
            </div>
            <p className={`text-[13px] ${strength >= 3 ? 'text-emerald-700' : strength === 2 ? 'text-yellow-700' : 'text-red-700'}`}>
              {strengthLabel[strength]}
            </p>
          </div>
        )}
      </div>

      <div>
        <label className="block text-[13px] text-slate-600 mb-1.5 font-medium">Confirm new password</label>
        <input
          type="password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleReset()}
          placeholder="Repeat new password"
          className={`w-full bg-gray-800 text-white rounded-lg px-3 py-2.5 text-sm border focus:outline-none focus:border-emerald-500 placeholder-gray-500 ${
            confirm && confirm !== password ? 'border-red-300' : 'border-slate-300'
          }`}
        />
        {confirm && confirm !== password && (
          <p className="text-[13px] text-red-700 mt-1">Passwords do not match</p>
        )}
      </div>

      {/* Requirements checklist */}
      <div className="bg-slate-100 rounded-lg p-3 space-y-1">
        {[
          { label: 'At least 8 characters',         met: password.length >= 8 },
          { label: 'Contains a number',              met: /\d/.test(password) },
          { label: 'Contains a special character',   met: /[^a-zA-Z0-9]/.test(password) },
          { label: 'Passwords match',                met: password === confirm && confirm !== '' },
        ].map(req => (
          <div key={req.label} className="flex items-center gap-2">
            <span className={`text-[13px] ${req.met ? 'text-emerald-700' : 'text-gray-600'}`}>
              {req.met ? '✓' : '○'}
            </span>
            <span className={`text-[13px] ${req.met ? 'text-slate-700' : 'text-gray-600'}`}>
              {req.label}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={handleReset}
        disabled={loading || password.length < 8 || password !== confirm}
        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
      >
        {loading ? 'Resetting password...' : 'Reset password'}
      </button>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-600 mb-4">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <h1 className="text-slate-900 text-2xl font-bold">Set new password</h1>
          <p className="text-slate-600 text-sm mt-1">Choose a strong password for your account</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <Suspense fallback={<div className="text-slate-600 text-sm text-center py-4">Loading...</div>}>
            <ResetForm />
          </Suspense>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Remember your password?{' '}
          <a href="/login" className="text-emerald-700 hover:text-emerald-700">Sign in</a>
        </p>
      </div>
    </div>
  );
}
