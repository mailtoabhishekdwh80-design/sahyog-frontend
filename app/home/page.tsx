'use client';
import { useEffect, useRef, useState } from 'react';

const CITIES = ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Pune', 'Ahmedabad', 'Kolkata'];
const MESSAGES = [
  'Q3 board deck is ready — enc:a8f2...',
  'GST filing approved ✓ — enc:b3d1...',
  'Sprint review at 4 PM IST — enc:c7e9...',
  'Vendor payment processed — enc:f1a4...',
  'New client onboarded 🎉 — enc:d2b8...',
  'Design review in 10 min — enc:e6c3...',
  'UPI transfer confirmed — enc:a9f7...',
  'Production deployed ✅ — enc:b4d2...',
];

function AnimatedMessage({ msg, delay }: { msg: string; delay: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(12px)',
      transition: 'all 0.6s ease',
      background: 'rgba(79,110,247,0.08)',
      border: '1px solid rgba(79,110,247,0.2)',
      borderRadius: 10,
      padding: '10px 14px',
      marginBottom: 8,
      fontSize:14,
      color: '#475569',
      fontFamily: 'monospace',
      display: 'flex',
      gap: 10,
      alignItems: 'center'}}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4F6EF7', flexShrink: 0, boxShadow: '0 0 6px #4F6EF7' }} />
      {msg}
    </div>
  );
}

function Counter({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const step = target / 60;
        const timer = setInterval(() => {
          start += step;
          if (start >= target) { setCount(target); clearInterval(timer); }
          else setCount(Math.floor(start));
        }, 16);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);
  return <div ref={ref}>{prefix}{count.toLocaleString()}{suffix}</div>;
}

export default function HomePage() {
  const [msgIndex, setMsgIndex] = useState(0);
  const [liveMessages, setLiveMessages] = useState<{ text: string; from: string; id: number }[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const city = CITIES[Math.floor(Math.random() * CITIES.length)];
      const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
      setLiveMessages(prev => [
        { text: msg, from: city, id: ++idRef.current },
        ...prev.slice(0, 5)
      ]);
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ background: '#F1F5F9', color: '#0F172A', fontFamily: "'Inter', -apple-system, sans-serif", minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── NAV ───────────────────────────────────────────────── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, borderBottom: '1px solid rgba(15,23,42,0.05)', backdropFilter: 'blur(20px)', background: 'rgba(255,255,255,0.90)', padding: '0 40px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #4F6EF7, #7B5EEB)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900 }}>D</div>
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>Deemona Teams</span>
          <span style={{ fontSize:12, background: 'rgba(79,110,247,0.15)', color: '#4F46E5', border: '1px solid rgba(79,110,247,0.3)', borderRadius: 20, padding: '2px 8px', fontWeight: 600 }}>BETA</span>
        </div>
        <div style={{ display: 'flex', gap: 32, fontSize: 14, color: '#64748B' }}>
          {['Features', 'Security', 'India', 'Pricing'].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`} style={{ color: '#64748B', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#0F172A'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#64748B'}>
              {item}
            </a>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <a href="/login" style={{ fontSize: 14, color: '#64748B', textDecoration: 'none', padding: '8px 20px', borderRadius: 8 }}>Sign in</a>
          <a href="/signup" style={{ fontSize: 14, background: '#4F6EF7', color: '#fff', textDecoration: 'none', padding: '8px 20px', borderRadius: 8, fontWeight: 600 }}>Get started free</a>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '100px 40px 60px', maxWidth: 1280, margin: '0 auto', gap: 80 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)', borderRadius: 20, padding: '6px 14px', marginBottom: 28 }}>
            <span style={{ fontSize: 16 }}>🇮🇳</span>
            <span style={{ fontSize:14, color: '#B45309', fontWeight: 600 }}>Built for India. Ready for the world.</span>
          </div>
          <h1 style={{ fontSize: 72, fontWeight: 900, lineHeight: 1.05, letterSpacing: -2, margin: '0 0 24px' }}>
            The collaboration<br />
            platform <span style={{ background: 'linear-gradient(135deg, #4F6EF7, #7B5EEB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>India</span><br />
            deserves.
          </h1>
          <p style={{ fontSize: 20, color: '#64748B', lineHeight: 1.7, maxWidth: 500, margin: '0 0 40px' }}>
            Deemona Teams is a full-stack enterprise collaboration platform with encrypted messaging, real-time video, AI-powered workflows, and built-in India compliance — at a fraction of Slack or Teams' cost.
          </p>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <a href="/signup" style={{ fontSize: 16, background: '#4F6EF7', color: '#fff', textDecoration: 'none', padding: '14px 32px', borderRadius: 12, fontWeight: 700, boxShadow: '0 0 32px rgba(79,110,247,0.4)' }}>
              Start free — no card needed →
            </a>
            <a href="https://github.com/mailtoabhishekdwh80-design/sahyog-frontend" target="_blank" style={{ fontSize: 14, color: '#64748B', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>View on GitHub</span>
              <span style={{ fontSize: 18 }}>↗</span>
            </a>
          </div>
          <div style={{ display: 'flex', gap: 32, marginTop: 48, paddingTop: 48, borderTop: '1px solid rgba(15,23,42,0.05)' }}>
            {[['180+', 'Features shipped'], ['AES-256', 'Encryption standard'], ['500', 'Max meeting participants'], ['₹0', 'Setup cost']].map(([val, label]) => (
              <div key={label}>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#4F46E5' }}>{val}</div>
                <div style={{ fontSize:13, color: '#64748B', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Live message wall */}
        <div style={{ width: 380, flexShrink: 0 }}>
          <div style={{ background: 'rgba(15,23,42,0.02)', border: '1px solid rgba(15,23,42,0.06)', borderRadius: 20, padding: 24, backdropFilter: 'blur(20px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize:14, color: '#64748B' }}>Live — encrypted messages across India</span>
            </div>
            <div style={{ minHeight: 320 }}>
              {liveMessages.map((m, i) => (
                <div key={m.id} style={{ opacity: 1 - i * 0.15, transform: `scale(${1 - i * 0.02})`, transformOrigin: 'top', transition: 'all 0.4s ease', background: i === 0 ? 'rgba(79,110,247,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${i === 0 ? 'rgba(79,110,247,0.3)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 10, padding: '10px 14px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize:12, color: '#4F46E5', fontWeight: 600 }}>📍 {m.from}</span>
                    <span style={{ fontSize:12, color: '#64748B' }}>now</span>
                  </div>
                  <div style={{ fontSize:13, color: '#475569', fontFamily: 'monospace' }}>{m.text}</div>
                </div>
              ))}
              {liveMessages.length === 0 && (
                <div style={{ textAlign: 'center', color: '#64748B', paddingTop: 60 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🔐</div>
                  <div style={{ fontSize:14 }}>Encryption active. Waiting for messages...</div>
                </div>
              )}
            </div>
            <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 8, fontSize:12, color: '#15803D', fontFamily: 'monospace' }}>
              ✓ All messages encrypted with AES-256-GCM before storage
            </div>
          </div>
        </div>
      </section>

      {/* ── MARKET OPPORTUNITY ────────────────────────────────── */}
      <section style={{ background: 'rgba(79,110,247,0.04)', borderTop: '1px solid rgba(79,110,247,0.1)', borderBottom: '1px solid rgba(79,110,247,0.1)', padding: '80px 40px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ fontSize:14, color: '#B45309', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>The Opportunity</div>
            <h2 style={{ fontSize: 48, fontWeight: 900, letterSpacing: -1, margin: '0 0 16px' }}>India pays ₹1 lakh crore<br />for foreign software every year.</h2>
            <p style={{ fontSize: 18, color: '#64748B', maxWidth: 600, margin: '0 auto' }}>Not a single Indian enterprise collaboration platform exists at scale. Deemona Teams is built to change that.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
            {[
              { number: '75M', label: 'SME employees in India without proper collaboration tools', color: '#4F46E5' },
              { number: '₹85K Cr', label: 'Annual SaaS spend by Indian enterprises on foreign platforms', color: '#B45309' },
              { number: '0', label: 'Credible Indian alternatives to Slack or Microsoft Teams', color: '#DC2626' },
              { number: '30%', label: 'YoY growth in Indian SaaS adoption — fastest in Asia-Pacific', color: '#15803D' },
            ].map(stat => (
              <div key={stat.label} style={{ background: 'rgba(15,23,42,0.02)', border: '1px solid rgba(15,23,42,0.05)', borderRadius: 16, padding: 28 }}>
                <div style={{ fontSize: 42, fontWeight: 900, color: stat.color, marginBottom: 10 }}>{stat.number}</div>
                <div style={{ fontSize: 14, color: '#64748B', lineHeight: 1.5 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────── */}
      <section id="features" style={{ padding: '100px 40px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 80 }}>
          <div style={{ fontSize:14, color: '#4F46E5', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>What We Built</div>
          <h2 style={{ fontSize: 52, fontWeight: 900, letterSpacing: -1.5, margin: 0 }}>Every tool your team needs.<br />One platform. One price.</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
          {[
            {
              icon: '💬',
              title: 'Encrypted Messaging',
              desc: 'Channel messaging, direct messages, group DMs, threads, reactions, voice messages, and scheduled messages. All content encrypted with AES-256-GCM before reaching our database.',
              tags: ['AES-256-GCM', 'Threads', 'Reactions', 'Voice'],
              color: '#4F46E5'},
            {
              icon: '🎥',
              title: 'Real Video Meetings',
              desc: 'WebRTC video powered by LiveKit. Up to 500 participants per meeting. Full host controls — mute, lock, remove, co-host. Agenda, resources, attendance, recording.',
              tags: ['LiveKit WebRTC', '500 participants', 'Recording', 'Host controls'],
              color: '#4F46E5'},
            {
              icon: '📋',
              title: 'Kanban Boards',
              desc: 'Full-featured project management with drag-and-drop Kanban, task cards, checklists, time tracking, file attachments, comments, subtasks, and AI task generation.',
              tags: ['Drag & drop', 'Time tracking', 'AI tasks', 'Subtasks'],
              color: '#0E7490',
            },
            {
              icon: '🤖',
              title: 'AI-Powered Features',
              desc: 'Channel summarisation, smart task generation from project descriptions, AI meeting notes, intelligent search, and a built-in AI assistant — all powered by Anthropic Claude.',
              tags: ['Claude API', 'Summarisation', 'Smart search', 'Auto tasks'],
              color: '#6D28D9'},
            {
              icon: '🔒',
              title: 'Enterprise Security',
              desc: 'Security Center with threat monitoring, conditional access policies, FIDO2/WebAuthn passkey support, session management, device trust, and zero-trust architecture roadmap.',
              tags: ['FIDO2', 'Conditional access', 'Threat monitoring', 'Sessions'],
              color: '#DC2626'},
            {
              icon: '📊',
              title: 'Compliance Center',
              desc: 'SOC2 Type II readiness with 22 automated controls, GDPR and DPDP Act 2023 compliance, legal hold and eDiscovery, data residency controls, and 8 downloadable audit reports.',
              tags: ['SOC2', 'DPDP Act 2023', 'Legal hold', 'eDiscovery'],
              color: '#B45309'},
            {
              icon: '🏢',
              title: 'Enterprise Features',
              desc: 'Message retention policies, information barriers (Finance ↔ Trading Chinese walls), SCIM 2.0 provisioning for Okta/Azure AD, and webinar mode for up to 10,000 attendees.',
              tags: ['SCIM 2.0', 'Info barriers', 'Retention', 'Webinars'],
              color: '#047857'},
            {
              icon: '📱',
              title: 'WhatsApp Integration',
              desc: 'Two-way WhatsApp Business messaging via Twilio. Your team can send and receive WhatsApp messages directly from Deemona Teams — critical for Indian SME workflows.',
              tags: ['Twilio', 'Two-way', 'WhatsApp Business', 'SME-first'],
              color: '#15803D'},
            {
              icon: '🇮🇳',
              title: 'India-First Features',
              desc: 'GST invoice generator, UPI QR code payments, TDS calculator, 9 Indian language support, DPDP Act 2023 compliance, and pricing designed for Indian SME budgets.',
              tags: ['GST', 'UPI', 'DPDP 2023', '9 languages'],
              color: '#B45309'},
          ].map((feature, i) => (
            <div key={feature.title} style={{ background: 'rgba(15,23,42,0.02)', border: '1px solid rgba(15,23,42,0.05)', padding: 32, position: 'relative', transition: 'background 0.2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(15,23,42,0.03)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(15,23,42,0.02)'}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>{feature.icon}</div>
              <h3 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 12px', color: '#0F172A' }}>{feature.title}</h3>
              <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.7, margin: '0 0 20px' }}>{feature.desc}</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {feature.tags.map(tag => (
                  <span key={tag} style={{ fontSize:12, color: feature.color, background: feature.color + '15', border: `1px solid ${feature.color}30`, borderRadius: 20, padding: '2px 8px', fontWeight: 600 }}>{tag}</span>
                ))}
              </div>
              <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: feature.color, opacity: 0.6 }} />
            </div>
          ))}
        </div>
      </section>

      {/* ── SECURITY DEEP DIVE ────────────────────────────────── */}
      <section id="security" style={{ padding: '100px 40px', background: 'rgba(255,255,255,0.90)', borderTop: '1px solid rgba(15,23,42,0.03)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize:14, color: '#DC2626', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>Security</div>
            <h2 style={{ fontSize: 48, fontWeight: 900, letterSpacing: -1.5, margin: '0 0 24px', lineHeight: 1.1 }}>Enterprise-grade security.<br />Not an afterthought.</h2>
            <p style={{ fontSize: 16, color: '#64748B', lineHeight: 1.8, margin: '0 0 40px' }}>
              Every message is encrypted with AES-256-GCM before it touches our database. Even if someone steals the entire database, they see only unreadable ciphertext. The encryption key never lives in code — only in your server environment.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                ['AES-256-GCM', 'Every message encrypted at rest with unique IV per message'],
                ['TLS 1.3', 'All data encrypted in transit — zero plaintext on the wire'],
                ['bcrypt (12 rounds)', 'Passwords hashed — unrecoverable even with DB access'],
                ['JWT RS256', 'Cryptographically signed session tokens, 24h expiry'],
                ['FIDO2 / WebAuthn', 'Hardware security key and passkey support (YubiKey, Face ID)'],
                ['Rate limiting', '100 requests/min per user — brute force protection built in'],
              ].map(([title, desc]) => (
                <div key={title} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize:12, color: '#15803D', flexShrink: 0, marginTop: 2 }}>✓</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>{title}</div>
                    <div style={{ fontSize:14, color: '#64748B', marginTop: 2 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(15,23,42,0.05)', borderRadius: 20, padding: 32, fontFamily: 'monospace' }}>
            <div style={{ fontSize:13, color: '#64748B', marginBottom: 20 }}>// Encryption implementation</div>
            {[
              { line: "encrypt(plaintext: string): string {", color: '#4F6EF7' },
              { line: "  const iv = randomBytes(12);", color: '#64748B' },
              { line: "  const cipher = createCipheriv(", color: '#64748B' },
              { line: "    'aes-256-gcm', key, iv", color: '#15803D' },
              { line: "  );", color: '#64748B' },
              { line: "  const encrypted = cipher.update(", color: '#64748B' },
              { line: "    plaintext, 'utf8'", color: '#15803D' },
              { line: "  );", color: '#64748B' },
              { line: "  const authTag = cipher.getAuthTag();", color: '#64748B' },
              { line: "  // Pack IV + AuthTag + Ciphertext", color: '#64748B' },
              { line: "  return 'enc:' + packed.toString('base64');", color: '#B45309' },
              { line: "}", color: '#4F6EF7' },
            ].map((item, i) => (
              <div key={i} style={{ fontSize:14, color: item.color, lineHeight: 1.8 }}>{item.line}</div>
            ))}
            <div style={{ marginTop: 24, padding: '12px 16px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 8 }}>
              <div style={{ fontSize:12, color: '#15803D' }}>Database row (actual stored value):</div>
              <div style={{ fontSize:12, color: '#64748B', marginTop: 4, wordBreak: 'break-all' }}>enc:OgYZ4cUaW2qbxCshXG+0toG3DIFsPzuelLTvmOwyYvWL...</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── INDIA SECTION ─────────────────────────────────────── */}
      <section id="india" style={{ padding: '100px 40px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ fontSize:14, color: '#B45309', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Made for Bharat</div>
            <h2 style={{ fontSize: 52, fontWeight: 900, letterSpacing: -1.5, margin: '0 0 16px' }}>Features no foreign platform<br />will ever build for you.</h2>
            <p style={{ fontSize: 18, color: '#64748B', maxWidth: 600, margin: '0 auto' }}>We understand Indian business compliance, workflows, and infrastructure because we're building this from India, for India.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
            {[
              { icon: '🧾', title: 'GST Invoice Generator', desc: 'Generate GST-compliant invoices directly inside the platform. CGST, SGST, IGST calculations with HSN/SAC codes. Download as PDF.' },
              { icon: '📲', title: 'UPI Payments Integration', desc: 'Generate UPI QR codes for vendor payments and client billing. Works with all UPI apps — GPay, PhonePe, Paytm, BHIM.' },
              { icon: '💰', title: 'TDS Calculator', desc: 'Built-in TDS calculation for contractor and vendor payments. Section 194C, 194J, 194H — automatically computed.' },
              { icon: '💬', title: 'WhatsApp-Native Workflows', desc: 'Two-way WhatsApp Business messaging. 96% of Indian professionals use WhatsApp — now your team\'s conversations are centralized.' },
              { icon: '🌐', title: '9 Indian Languages', desc: 'Interface and notifications in Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati, and Punjabi.' },
              { icon: '⚖️', title: 'DPDP Act 2023 Compliance', desc: 'Full compliance with India\'s Digital Personal Data Protection Act 2023. DPDP nominee designation, data breach notifications, grievance officer.' },
            ].map(feature => (
              <div key={feature.title} style={{ display: 'flex', gap: 20, padding: 28, background: 'rgba(245,166,35,0.04)', border: '1px solid rgba(245,166,35,0.12)', borderRadius: 16 }}>
                <div style={{ fontSize: 36, flexShrink: 0 }}>{feature.icon}</div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 8px', color: '#0F172A' }}>{feature.title}</h3>
                  <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.7, margin: 0 }}>{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VS COMPARISON ─────────────────────────────────────── */}
      <section style={{ padding: '100px 40px', background: 'rgba(255,255,255,0.92)', borderTop: '1px solid rgba(15,23,42,0.03)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <h2 style={{ fontSize: 48, fontWeight: 900, letterSpacing: -1.5, margin: '0 0 16px' }}>Why not just use Slack or Teams?</h2>
            <p style={{ fontSize: 18, color: '#64748B' }}>Because they were built for San Francisco, not for Surat.</p>
          </div>
          <div style={{ border: '1px solid rgba(15,23,42,0.06)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', background: 'rgba(15,23,42,0.02)' }}>
              {['Feature', 'Deemona Teams', 'Slack', 'MS Teams'].map((h, i) => (
                <div key={h} style={{ padding: '16px 20px', fontSize:14, fontWeight: 700, color: i === 1 ? '#4F46E5' : '#64748B', textAlign: i > 0 ? 'center' : 'left', borderBottom: '1px solid rgba(15,23,42,0.05)', borderRight: i < 3 ? '1px solid rgba(15,23,42,0.05)' : 'none' }}>{h}</div>
              ))}
            </div>
            {[
              ['GST Invoice Generator', '✅', '❌', '❌'],
              ['UPI Payments', '✅', '❌', '❌'],
              ['WhatsApp Integration', '✅', '❌', '❌'],
              ['DPDP Act 2023 Compliance', '✅', '❌', '❌'],
              ['9 Indian Languages', '✅', '❌', '❌'],
              ['AES-256-GCM at-rest encryption', '✅', '❌', '❌'],
              ['India-region data storage', '✅', '⚠️', '⚠️'],
              ['SME pricing (₹ per user)', '✅', '❌', '❌'],
              ['Full Kanban boards included', '✅', '❌', '❌'],
              ['Open source', '✅', '❌', '❌'],
            ].map(([feature, ...vals], rowIdx) => (
              <div key={feature} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', background: rowIdx % 2 === 0 ? 'transparent' : 'rgba(15,23,42,0.01)' }}>
                <div style={{ padding: '14px 20px', fontSize: 14, color: '#0F172A', borderRight: '1px solid rgba(15,23,42,0.05)', borderBottom: '1px solid rgba(15,23,42,0.03)' }}>{feature}</div>
                {vals.map((val, i) => (
                  <div key={i} style={{ padding: '14px 20px', fontSize: 16, textAlign: 'center', borderRight: i < 2 ? '1px solid rgba(15,23,42,0.05)' : 'none', borderBottom: '1px solid rgba(15,23,42,0.03)', background: i === 0 ? 'rgba(79,110,247,0.05)' : 'transparent' }}>{val}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TECH STACK / FOR INVESTORS ────────────────────────── */}
      <section style={{ padding: '100px 40px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ fontSize:14, color: '#4F46E5', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>For Investors</div>
            <h2 style={{ fontSize: 52, fontWeight: 900, letterSpacing: -1.5, margin: '0 0 16px' }}>Built right.<br />Built to scale.</h2>
            <p style={{ fontSize: 18, color: '#64748B', maxWidth: 600, margin: '0 auto' }}>A production-ready platform built solo in under 6 months — demonstrating both technical depth and execution speed.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 60 }}>
            {[
              { icon: '⚡', title: 'Production-ready today', items: ['Live at sahyog-frontend-gznm.onrender.com', 'Real users, real data', 'Neon PostgreSQL (never expires)', 'Cloudflare R2 file storage'] },
              { icon: '🏗️', title: 'Scalable architecture', items: ['Next.js 16 + Node.js/TypeScript', 'WebSocket real-time gateway', 'BullMQ job queues with Redis', 'ElasticSearch full-text search ready'] },
              { icon: '🔐', title: 'Enterprise-ready security', items: ['AES-256-GCM message encryption', 'SOC2 Type II readiness (22 controls)', 'SCIM 2.0 for HR system sync', 'Legal hold + eDiscovery built in'] },
            ].map(card => (
              <div key={card.title} style={{ background: 'rgba(15,23,42,0.02)', border: '1px solid rgba(15,23,42,0.06)', borderRadius: 16, padding: 32 }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>{card.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 20px' }}>{card.title}</h3>
                {card.items.map(item => (
                  <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                    <span style={{ color: '#15803D', fontSize: 14, flexShrink: 0, marginTop: 1 }}>→</span>
                    <span style={{ fontSize: 14, color: '#64748B' }}>{item}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Metrics */}
          <div style={{ background: 'linear-gradient(135deg, rgba(79,110,247,0.1), rgba(123,94,235,0.1))', border: '1px solid rgba(79,110,247,0.2)', borderRadius: 20, padding: 48, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 32, textAlign: 'center' }}>
            {[
              { label: 'Features shipped', value: 180, suffix: '+' },
              { label: 'Database tables', value: 43, suffix: '' },
              { label: 'API endpoints', value: 120, suffix: '+' },
              { label: 'Months to build', value: 6, suffix: '' },
              { label: 'Developers', value: 1, suffix: '' },
            ].map(m => (
              <div key={m.label}>
                <div style={{ fontSize: 48, fontWeight: 900, color: '#4F46E5', lineHeight: 1 }}>
                  <Counter target={m.value} suffix={m.suffix} />
                </div>
                <div style={{ fontSize:14, color: '#64748B', marginTop: 8 }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section style={{ padding: '100px 40px', textAlign: 'center', background: 'rgba(79,110,247,0.05)', borderTop: '1px solid rgba(79,110,247,0.1)' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ fontSize: 60, fontWeight: 900, letterSpacing: -2, margin: '0 0 24px', lineHeight: 1.05 }}>
            Ready to give India<br />its own Slack?
          </h2>
          <p style={{ fontSize: 18, color: '#64748B', margin: '0 0 48px', lineHeight: 1.7 }}>
            Whether you're a potential investor, enterprise customer, or team looking for a better tool — Deemona Teams is ready. Built in India. Securing Indian data. Solving Indian problems.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/signup" style={{ fontSize: 18, background: '#4F6EF7', color: '#fff', textDecoration: 'none', padding: '16px 40px', borderRadius: 12, fontWeight: 700, boxShadow: '0 0 40px rgba(79,110,247,0.5)' }}>
              Start free today →
            </a>
            <a href="mailto:abhishek@deemona.com" style={{ fontSize: 18, background: 'transparent', color: '#0F172A', textDecoration: 'none', padding: '16px 40px', borderRadius: 12, fontWeight: 700, border: '1px solid rgba(15,23,42,0.12)' }}>
              Talk to the founder
            </a>
          </div>
          <div style={{ marginTop: 48, display: 'flex', gap: 32, justifyContent: 'center', fontSize:14, color: '#64748B' }}>
            {['✓ No credit card required', '✓ Set up in 2 minutes', '✓ Data stored in Singapore (Asia)', '✓ DPDP Act 2023 compliant'].map(item => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(15,23,42,0.05)', padding: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748B', fontSize:14, maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: 'linear-gradient(135deg, #4F6EF7, #7B5EEB)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize:13, fontWeight: 900 }}>D</div>
          <span style={{ fontWeight: 600, color: '#0F172A' }}>Deemona Teams</span>
          <span>by Deemona Technologies Pvt. Ltd.</span>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          <a href="/legal/privacy" style={{ color: '#64748B', textDecoration: 'none' }}>Privacy</a>
          <a href="/legal/terms" style={{ color: '#64748B', textDecoration: 'none' }}>Terms</a>
          <a href="/legal/security" style={{ color: '#64748B', textDecoration: 'none' }}>Security</a>
          <a href="https://github.com/mailtoabhishekdwh80-design/sahyog-frontend" target="_blank" style={{ color: '#64748B', textDecoration: 'none' }}>GitHub</a>
        </div>
        <div>© 2026 Deemona Technologies. All rights reserved.</div>
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}
