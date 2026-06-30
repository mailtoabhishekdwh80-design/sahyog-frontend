'use client';
import { useState, useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export default function SignupPage() {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [joinToken,   setJoinToken]   = useState<string | null>(null);
  const [inviteChecked, setInviteChecked] = useState(false);
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setInviteToken(params.get('invite'));
    setJoinToken(params.get('join'));
    setInviteChecked(true);
  }, []);

  // True whenever the user is joining an existing workspace via either link type —
  // used throughout to decide whether to show/require the org name+slug fields
  const isJoining = !!(inviteToken || joinToken);

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

    if (!isJoining && (!form.orgName)) {
      setError('Workspace name is required'); return;
    }
    if (!form.displayName || !form.email || !form.password) {
      setError('All fields are required'); return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters'); return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match'); return;
    }
    if (!isJoining && !/^[a-z0-9-]+$/.test(form.orgSlug)) {
      setError('Organization slug can only contain lowercase letters, numbers and hyphens'); return;
    }

    setLoading(true);
    try {
      const body: any = {
        displayName: form.displayName,
        email:       form.email,
        password:    form.password,
      };
      if (inviteToken) {
        body.inviteToken = inviteToken;
      } else if (joinToken) {
        body.joinToken = joinToken;
      } else {
        body.orgName = form.orgName;
        body.orgSlug = form.orgSlug;
      }

      const res = await fetch(`${API}/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data?.data?.accessToken) {
        // Store token and redirect
        localStorage.setItem('sahyog_token',   data.data.accessToken);
        localStorage.setItem('sahyog_refresh', data.data.refreshToken);
        window.location.href = '/workspace';
      } else {
        setError(data?.error?.message || data?.error || 'Registration failed');
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
          <h1 className="text-white text-2xl font-bold">{inviteChecked && isJoining ? 'Join your team' : 'Create your workspace'}</h1>
          <p className="text-gray-400 text-sm mt-1">{inviteChecked && isJoining ? 'Set up your account to start collaborating' : 'Start collaborating with your team on Deemona Teams'}</p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-4">
          {error && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Invite banner */}
          {inviteChecked && inviteToken && (
            <div className="bg-emerald-900/30 border border-emerald-700 text-emerald-300 text-sm rounded-lg px-3 py-2.5">
              🎉 You're joining an existing workspace via invite. Just fill in your details below.
            </div>
          )}
          {inviteChecked && joinToken && (
            <div className="bg-emerald-900/30 border border-emerald-700 text-emerald-300 text-sm rounded-lg px-3 py-2.5">
              🎉 You're joining a workspace via its shared invite link. Just fill in your details below.
            </div>
          )}

          {/* Organization fields — only shown when creating a brand new workspace */}
          {inviteChecked && !isJoining && (
            <>
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
            </>
          )}

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

          {/* Legal consent checkboxes */}
          <div style={{background:'#f9fafb',border:'1px solid #e5e7eb',borderRadius:10,padding:16,marginBottom:8}}>
            <p style={{fontSize:13,color:'#374151',fontWeight:600,margin:'0 0 12px'}}>Required agreements — please read before signing up</p>
            <label style={{display:'flex',alignItems:'flex-start',gap:8,marginBottom:10,cursor:'pointer'}}>
              <input type="checkbox" id="chk-terms" style={{marginTop:3,accentColor:'#248046',flexShrink:0}} />
              <span style={{fontSize:12,color:'#374151',lineHeight:1.5}}>
                I have read and agree to the{' '}
                <a href="/legal/terms" target="_blank" style={{color:'#248046',fontWeight:600}}>Terms &amp; Conditions</a>,
                including the <strong>disclaimer that the platform owner is not liable for any financial loss</strong> and
                that no legal action can be taken against the platform owner.
              </span>
            </label>
            <label style={{display:'flex',alignItems:'flex-start',gap:8,marginBottom:10,cursor:'pointer'}}>
              <input type="checkbox" id="chk-privacy" style={{marginTop:3,accentColor:'#248046',flexShrink:0}} />
              <span style={{fontSize:12,color:'#374151',lineHeight:1.5}}>
                I have read and agree to the{' '}
                <a href="/legal/privacy" target="_blank" style={{color:'#248046',fontWeight:600}}>Privacy Policy</a>{' '}
                and consent to my personal data being processed under the DPDP Act 2023.
              </span>
            </label>
            <label style={{display:'flex',alignItems:'flex-start',gap:8,cursor:'pointer'}}>
              <input type="checkbox" id="chk-aup" style={{marginTop:3,accentColor:'#248046',flexShrink:0}} />
              <span style={{fontSize:12,color:'#374151',lineHeight:1.5}}>
                I agree to the{' '}
                <a href="/legal/acceptable-use" target="_blank" style={{color:'#248046',fontWeight:600}}>Acceptable Use Policy</a>{' '}
                and{' '}
                <a href="/legal/copyright" target="_blank" style={{color:'#248046',fontWeight:600}}>Copyright Policy</a>.
              </span>
            </label>
          </div>

          <button
            onClick={() => {
              const t = (document.getElementById('chk-terms') as HTMLInputElement)?.checked;
              const p = (document.getElementById('chk-privacy') as HTMLInputElement)?.checked;
              const a = (document.getElementById('chk-aup') as HTMLInputElement)?.checked;
              if (!t || !p || !a) {
                alert('Please read and accept all legal agreements before creating your account.');
                return;
              }
              handleSignup();
            }}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors mt-2"
          >
            {loading ? 'Creating workspace...' : 'Create workspace'}
          </button>

          <p style={{textAlign:'center',fontSize:11,color:'#9ca3af',marginTop:8}}>
            <a href="/legal" target="_blank" style={{color:'#9ca3af'}}>View all legal documents</a>
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
