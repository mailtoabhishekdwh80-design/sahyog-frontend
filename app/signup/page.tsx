'use client';
import { useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export default function SignupPage() {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [form, setForm] = useState({
    orgName:     '',
    orgSlug:     '',
    displayName: '',
    email:       '',
    password:    '',
    confirm:     '',
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    // Auto-generate slug from org name
    if (field === 'orgName') {
      setForm(prev => ({
        ...prev,
        orgName: value,
        orgSlug: value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
      }));
    }
  }

  async function handleSignup() {
    setError('');

    if (!form.orgName || !form.displayName || !form.email || !form.password) {
      setError('All fields are required'); return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters'); return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match'); return;
    }
    if (!/^[a-z0-9-]+$/.test(form.orgSlug)) {
      setError('Organization slug can only contain lowercase letters, numbers and hyphens'); return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgName:     form.orgName,
          orgSlug:     form.orgSlug,
          displayName: form.displayName,
          email:       form.email,
          password:    form.password,
        }),
      });
      const data = await res.json();
      if (data?.data?.accessToken) {
        // Store token and redirect
        localStorage.setItem('sahyog_token',   data.data.accessToken);
        localStorage.setItem('sahyog_refresh', data.data.refreshToken);
        window.location.href = '/workspace';
      } else {
        setError(data?.error?.message || 'Registration failed');
      }
    } catch {
      setError('Cannot connect to server. Is the backend running?');
    }
    setLoading(false);
  }

  const inputClass = "w-full bg-gray-800 text-white rounded-lg px-3 py-2.5 text-sm border border-gray-700 focus:outline-none focus:border-emerald-500 placeholder-gray-500";

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-600 mb-4">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <h1 className="text-white text-2xl font-bold">Create your workspace</h1>
          <p className="text-gray-400 text-sm mt-1">Start collaborating with your team on Deemona Teams</p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-4">
          {error && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Organization */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Organization name</label>
            <input
              type="text"
              value={form.orgName}
              onChange={e => update('orgName', e.target.value)}
              placeholder="Deemona Technologies"
              className={inputClass}
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">
              Workspace URL
              <span className="text-gray-600 font-normal ml-1">(auto-generated)</span>
            </label>
            <div className="flex items-center bg-gray-800 rounded-lg border border-gray-700 focus-within:border-emerald-500 overflow-hidden">
              <span className="text-gray-500 text-xs px-3 py-2.5 border-r border-gray-700 bg-gray-850 shrink-0">sahyog.in/</span>
              <input
                type="text"
                value={form.orgSlug}
                onChange={e => update('orgSlug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="deemona"
                className="flex-1 bg-transparent text-white text-sm px-3 py-2.5 focus:outline-none placeholder-gray-500"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-800 pt-2">
            <p className="text-xs text-gray-500 mb-3">Your account</p>
          </div>

          {/* Display name */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Full name</label>
            <input
              type="text"
              value={form.displayName}
              onChange={e => update('displayName', e.target.value)}
              placeholder="Abhishek Sharma"
              className={inputClass}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Work email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => update('email', e.target.value)}
              placeholder="abhishek@deemona.com"
              className={inputClass}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={e => update('password', e.target.value)}
              placeholder="Min. 8 characters"
              className={inputClass}
            />
            {/* Password strength */}
            {form.password && (
              <div className="mt-1.5 flex gap-1">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                    form.password.length >= (i + 1) * 2
                      ? form.password.length >= 12 ? 'bg-emerald-500'
                        : form.password.length >= 8 ? 'bg-yellow-500'
                        : 'bg-red-500'
                      : 'bg-gray-700'
                  }`} />
                ))}
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Confirm password</label>
            <input
              type="password"
              value={form.confirm}
              onChange={e => update('confirm', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSignup()}
              placeholder="Repeat password"
              className={`${inputClass} ${form.confirm && form.confirm !== form.password ? 'border-red-700' : ''}`}
            />
            {form.confirm && form.confirm !== form.password && (
              <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
            )}
          </div>

          <button
            onClick={handleSignup}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors mt-2"
          >
            {loading ? 'Creating workspace...' : 'Create workspace'}
          </button>

          <p className="text-center text-xs text-gray-500">
            By signing up you agree to our Terms of Service and Privacy Policy
          </p>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <a href="/login" className="text-emerald-400 hover:text-emerald-300">Sign in</a>
        </p>
      </div>
    </div>
  );
}
