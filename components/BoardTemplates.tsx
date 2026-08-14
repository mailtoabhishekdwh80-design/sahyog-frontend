'use client';
import { useState } from 'react';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  lists: { name: string; tasks: string[] }[];
}

const TEMPLATES: Template[] = [
  {
    id: 'scrum',
    name: 'Scrum Sprint',
    description: 'Agile sprint board with backlog, active sprint, and review columns',
    icon: '🚀',
    category: 'Engineering',
    lists: [
      { name: 'Product Backlog', tasks: ['User story: Login flow', 'User story: Dashboard', 'API documentation', 'Performance optimization'] },
      { name: 'Sprint Backlog', tasks: ['Set up CI/CD pipeline', 'Write unit tests', 'Code review process'] },
      { name: 'In Progress', tasks: ['Feature: User auth', 'Bug: Fix login redirect'] },
      { name: 'In Review', tasks: ['PR: Add search feature'] },
      { name: 'Done', tasks: ['Project setup', 'Database schema', 'Initial deployment'] },
    ],
  },
  {
    id: 'kanban',
    name: 'Simple Kanban',
    description: 'Classic 3-column Kanban board for any team',
    icon: '📋',
    category: 'General',
    lists: [
      { name: 'To Do', tasks: ['Research competitors', 'Create wireframes', 'User interviews', 'Define requirements'] },
      { name: 'In Progress', tasks: ['Design mockups', 'Write content'] },
      { name: 'Done', tasks: ['Project kickoff', 'Stakeholder alignment'] },
    ],
  },
  {
    id: 'bug-tracker',
    name: 'Bug Tracker',
    description: 'Track and prioritize bugs from report to resolution',
    icon: '🐛',
    category: 'Engineering',
    lists: [
      { name: 'Reported', tasks: ['Login page crash on mobile', 'Image upload timeout', 'Search not returning results'] },
      { name: 'Triaged', tasks: ['Payment gateway error', 'Email notifications delayed'] },
      { name: 'In Progress', tasks: ['Fix memory leak in dashboard'] },
      { name: 'Fixed', tasks: ['404 error on profile page'] },
      { name: 'Closed', tasks: ['Typo in onboarding email'] },
    ],
  },
  {
    id: 'product-roadmap',
    name: 'Product Roadmap',
    description: 'Quarterly roadmap planning for product teams',
    icon: '🗺️',
    category: 'Product',
    lists: [
      { name: 'Ideas & Backlog', tasks: ['AI-powered search', 'Mobile app', 'Dark mode', 'API marketplace'] },
      { name: 'Q1 2026', tasks: ['User onboarding redesign', 'Performance improvements', 'Analytics dashboard'] },
      { name: 'Q2 2026', tasks: ['Mobile app beta', 'Third-party integrations', 'Enterprise SSO'] },
      { name: 'Q3 2026', tasks: ['AI features v2', 'Custom domains', 'Advanced reporting'] },
      { name: 'Shipped', tasks: ['Core platform v1', 'Team collaboration', 'File sharing'] },
    ],
  },
  {
    id: 'marketing',
    name: 'Marketing Calendar',
    description: 'Plan and track marketing campaigns and content',
    icon: '📣',
    category: 'Marketing',
    lists: [
      { name: 'Ideas', tasks: ['Blog: India SaaS landscape', 'Case study: Enterprise client', 'Webinar: Product demo', 'LinkedIn campaign'] },
      { name: 'Scheduled', tasks: ['Product Hunt launch', 'Email newsletter Q3'] },
      { name: 'In Progress', tasks: ['Landing page redesign', 'SEO optimization'] },
      { name: 'In Review', tasks: ['Press release draft'] },
      { name: 'Published', tasks: ['Blog: Team productivity tips', 'Twitter campaign #IndiaSaaS'] },
    ],
  },
  {
    id: 'hiring',
    name: 'Hiring Pipeline',
    description: 'Track candidates through your recruitment process',
    icon: '👥',
    category: 'HR',
    lists: [
      { name: 'Applications', tasks: ['Senior Backend Engineer x3', 'Product Designer x1', 'Sales Manager x2'] },
      { name: 'Screening', tasks: ['Rahul Gupta - Backend', 'Priya Sharma - Design'] },
      { name: 'Interview', tasks: ['Arjun Mehta - DevOps'] },
      { name: 'Offer', tasks: ['Vikram Singh - Frontend'] },
      { name: 'Hired', tasks: ['Anita Verma - Product', 'Deepika Nair - QA'] },
    ],
  },
  {
    id: 'sales',
    name: 'Sales Pipeline',
    description: 'Track deals from prospecting to close',
    icon: '💼',
    category: 'Sales',
    lists: [
      { name: 'Prospecting', tasks: ['TCS Innovation Labs', 'Infosys Digital', 'Wipro IT', 'HCL Tech'] },
      { name: 'Qualified', tasks: ['Unitech Technologies', 'Zenith Corp'] },
      { name: 'Proposal', tasks: ['MindTree Solutions'] },
      { name: 'Negotiation', tasks: ['Tech Mahindra'] },
      { name: 'Closed Won', tasks: ['Deemona Enterprise (500 seats)', 'StartupHub (100 seats)'] },
    ],
  },
  {
    id: 'okr',
    name: 'OKR Tracker',
    description: 'Track Objectives and Key Results for your team',
    icon: '🎯',
    category: 'Strategy',
    lists: [
      { name: 'Objectives', tasks: ['Launch enterprise product', 'Achieve product-market fit', 'Build world-class team', 'Reach INR 1Cr ARR'] },
      { name: 'Key Results', tasks: ['10 enterprise clients', '70% DAU/MAU ratio', 'NPS > 70', '< 2% monthly churn'] },
      { name: 'On Track', tasks: ['DAU/MAU: 68%', 'NPS: 72', 'Enterprise clients: 8'] },
      { name: 'At Risk', tasks: ['ARR target: 60% achieved'] },
      { name: 'Achieved', tasks: ['Team of 10 hired', 'Product v2 launched'] },
    ],
  },
];

interface BoardTemplatesProps {
  onSelect: (template: Template) => void;
  onClose: () => void;
}

export default function BoardTemplates({ onSelect, onClose }: BoardTemplatesProps) {
  const categories = ['All', ...Array.from(new Set(TEMPLATES.map(t => t.category)))];
  const [activeCategory, setActiveCategory] = useState('All');
  const [preview, setPreview] = useState<Template | null>(null);

  const filtered = activeCategory === 'All' ? TEMPLATES : TEMPLATES.filter(t => t.category === activeCategory);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', zIndex: 1000 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ margin: 'auto', background: '#0F172A', border: '1px solid #1E40AF', borderRadius: 16, width: '90vw', maxWidth: 860, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}>

        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #1E3A5F', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ color: '#F1F5F9', fontWeight: 700, fontSize: 16 }}>Board Templates</div>
            <div style={{ fontSize: 12, color: '#475569' }}>Start with a pre-built board for your team</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 22 }}>×</button>
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Categories sidebar */}
          <div style={{ width: 160, borderRight: '1px solid #1E3A5F', padding: '12px 8px', flexShrink: 0 }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                style={{ width: '100%', textAlign: 'left', padding: '7px 12px', background: activeCategory === cat ? '#1E3A5F' : 'none', border: 'none', borderRadius: 8, color: activeCategory === cat ? '#60A5FA' : '#94A3B8', fontSize: 13, cursor: 'pointer', fontWeight: activeCategory === cat ? 700 : 400, marginBottom: 2 }}>
                {cat}
              </button>
            ))}
          </div>

          {/* Templates grid */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            {preview ? (
              // Preview mode
              <div>
                <button onClick={() => setPreview(null)} style={{ background: 'none', border: 'none', color: '#60A5FA', cursor: 'pointer', fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                  ← Back to templates
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <span style={{ fontSize: 32 }}>{preview.icon}</span>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#F1F5F9' }}>{preview.name}</div>
                    <div style={{ fontSize: 13, color: '#64748B' }}>{preview.description}</div>
                  </div>
                  <button onClick={() => { onSelect(preview); onClose(); }}
                    style={{ marginLeft: 'auto', background: '#1D4ED8', border: 'none', borderRadius: 10, padding: '8px 20px', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                    Use Template
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
                  {preview.lists.map(list => (
                    <div key={list.name} style={{ minWidth: 180, background: '#1E293B', borderRadius: 10, padding: 12, border: '1px solid #334155' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{list.name}</div>
                      {list.tasks.map(task => (
                        <div key={task} style={{ background: '#0F172A', borderRadius: 6, padding: '6px 8px', marginBottom: 6, fontSize: 12, color: '#E2E8F0', border: '1px solid #1E3A5F' }}>
                          {task}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Grid mode
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                {filtered.map(template => (
                  <div key={template.id}
                    style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 12, padding: 16, cursor: 'pointer', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#1D4ED8'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#334155'}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{template.icon}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9', marginBottom: 4 }}>{template.name}</div>
                    <div style={{ fontSize: 12, color: '#64748B', marginBottom: 12, lineHeight: 1.4 }}>{template.description}</div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
                      {template.lists.slice(0, 3).map(l => (
                        <span key={l.name} style={{ fontSize: 10, padding: '2px 6px', background: '#0F172A', color: '#475569', borderRadius: 4, border: '1px solid #1E3A5F' }}>{l.name}</span>
                      ))}
                      {template.lists.length > 3 && <span style={{ fontSize: 10, color: '#334155' }}>+{template.lists.length - 3} more</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setPreview(template)}
                        style={{ flex: 1, background: '#1E293B', border: '1px solid #334155', borderRadius: 6, padding: '5px 10px', color: '#94A3B8', fontSize: 11, cursor: 'pointer' }}>
                        Preview
                      </button>
                      <button onClick={() => { onSelect(template); onClose(); }}
                        style={{ flex: 1, background: '#1D4ED8', border: 'none', borderRadius: 6, padding: '5px 10px', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                        Use
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
