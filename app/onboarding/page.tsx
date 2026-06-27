'use client';
import { useState } from 'react';
import { api } from '../../lib/api';

const STEPS = ['welcome', 'profile', 'invite', 'channels', 'done'] as const;
type Step = typeof STEPS[number];

export default function OnboardingPage() {
  const [step,        setStep]        = useState<Step>('welcome');
  const [displayName, setDisplayName] = useState('');
  const [designation, setDesignation] = useState('');
  const [inviteEmails,setInviteEmails]= useState('');
  const [saving,      setSaving]      = useState(false);

  const stepIndex = STEPS.indexOf(step);
  const progress  = (stepIndex / (STEPS.length - 1)) * 100;

  async function saveProfile() {
    if (!displayName.trim()) return;
    setSaving(true);
    await api.updateProfile({ displayName: displayName.trim(), designation: designation.trim() });
    setSaving(false);
    setStep('invite');
  }

  async function sendInvites() {
    if (inviteEmails.trim()) {
      setSaving(true);
      const emails = inviteEmails.split(/[\n,;]/).map(e => e.trim()).filter(e => e.includes('@'));
      if (emails.length > 0) {
        const rolesRes = await api.orgRoles();
        const roles = rolesRes?.data || [];
        const memberRole = roles.find((r: any) => r.name === 'member') || roles[0];
        if (memberRole) await api.inviteMembers(emails, memberRole.id);
      }
      setSaving(false);
    }
    setStep('channels');
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 mb-4">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h1 className="text-white text-2xl font-bold">Welcome to Deemona Teams</h1>
          <p className="text-gray-400 text-sm mt-1">Let's get your workspace ready</p>
        </div>

        {/* Progress bar */}
        {step !== 'done' && (
          <div className="mb-8">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Step {stepIndex + 1} of {STEPS.length - 1}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <div className="bg-gray-800 rounded-full h-1.5">
              <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Step: Welcome */}
        {step === 'welcome' && (
          <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center space-y-6">
            <div className="text-6xl">🎉</div>
            <div>
              <h2 className="text-white text-xl font-bold mb-2">Your workspace is ready!</h2>
              <p className="text-gray-400 text-sm">Deemona Teams brings your team's chat, tasks, and meetings together in one place. Let's take a quick tour.</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: '💬', label: 'Real-time chat' },
                { icon: '📋', label: 'Kanban boards' },
                { icon: '📹', label: 'Video meetings' },
              ].map(f => (
                <div key={f.label} className="bg-gray-800 rounded-xl p-3 text-center">
                  <div className="text-2xl mb-1">{f.icon}</div>
                  <div className="text-xs text-gray-400">{f.label}</div>
                </div>
              ))}
            </div>
            <button onClick={() => setStep('profile')}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-xl text-sm transition-colors">
              Get started →
            </button>
          </div>
        )}

        {/* Step: Profile */}
        {step === 'profile' && (
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-5">
            <div>
              <h2 className="text-white text-lg font-bold">Set up your profile</h2>
              <p className="text-gray-500 text-sm mt-1">Let your team know who you are</p>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Your name *</label>
              <input value={displayName} onChange={e => setDisplayName(e.target.value)}
                placeholder="Abhishek Sharma"
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2.5 text-sm border border-gray-700 focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">What do you do? <span className="text-gray-600">(optional)</span></label>
              <input value={designation} onChange={e => setDesignation(e.target.value)}
                placeholder="e.g. Founder, Developer, Designer"
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2.5 text-sm border border-gray-700 focus:outline-none focus:border-emerald-500" />
            </div>
            <div className="flex gap-3">
              <button onClick={saveProfile} disabled={saving || !displayName.trim()}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl text-sm">
                {saving ? 'Saving...' : 'Continue →'}
              </button>
              <button onClick={() => setStep('invite')} className="text-gray-500 hover:text-gray-300 text-sm px-4">Skip</button>
            </div>
          </div>
        )}

        {/* Step: Invite */}
        {step === 'invite' && (
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-5">
            <div>
              <h2 className="text-white text-lg font-bold">Invite your team</h2>
              <p className="text-gray-500 text-sm mt-1">Deemona Teams works best with your whole team</p>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Email addresses <span className="text-gray-600">(optional)</span></label>
              <textarea value={inviteEmails} onChange={e => setInviteEmails(e.target.value)} rows={4}
                placeholder="john@company.com&#10;jane@company.com&#10;team@company.com"
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2.5 text-sm border border-gray-700 focus:outline-none focus:border-emerald-500 resize-none" />
              <p className="text-xs text-gray-600 mt-1">They'll receive an email invitation to join</p>
            </div>
            <div className="flex gap-3">
              <button onClick={sendInvites} disabled={saving}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl text-sm">
                {saving ? 'Sending...' : inviteEmails.trim() ? '✉️ Send invites →' : 'Skip →'}
              </button>
            </div>
          </div>
        )}

        {/* Step: Channels */}
        {step === 'channels' && (
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-5">
            <div>
              <h2 className="text-white text-lg font-bold">Explore your workspace</h2>
              <p className="text-gray-500 text-sm mt-1">Here's what's waiting for you</p>
            </div>
            <div className="space-y-3">
              {[
                { icon: '💬', title: 'Channels', desc: 'Chat with your team in real-time. Use #general to start.', link: '/', color: 'emerald' },
                { icon: '📋', title: 'Boards', desc: 'Manage tasks with drag-and-drop Kanban boards.', link: '/', color: 'blue' },
                { icon: '📹', title: 'Meetings', desc: 'Start instant video calls or schedule for later.', link: '/', color: 'purple' },
                { icon: '⚙️', title: 'Settings', desc: 'Invite more team members and customize your workspace.', link: '/settings', color: 'orange' },
              ].map(item => (
                <a key={item.title} href={item.link}
                  className="flex items-center gap-4 p-3 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors">
                  <div className="text-2xl">{item.icon}</div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white">{item.title}</div>
                    <div className="text-xs text-gray-500">{item.desc}</div>
                  </div>
                  <span className="text-gray-600">›</span>
                </a>
              ))}
            </div>
            <button onClick={() => setStep('done')}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-xl text-sm">
              Go to workspace →
            </button>
          </div>
        )}

        {/* Step: Done */}
        {step === 'done' && (
          <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center space-y-6">
            <div className="text-6xl">🚀</div>
            <div>
              <h2 className="text-white text-xl font-bold">You're all set!</h2>
              <p className="text-gray-400 text-sm mt-2">Your Deemona Teams workspace is ready. Start collaborating with your team.</p>
            </div>
            <a href="/" className="block w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-xl text-sm transition-colors">
              Open workspace →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
