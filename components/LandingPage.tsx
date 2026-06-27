'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

export default function LandingPage() {
  const router = useRouter();
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    document.querySelectorAll('.reveal').forEach(el => observerRef.current?.observe(el));
    const handleScroll = () => {
      const nav = document.getElementById('lp-nav');
      if (nav) nav.style.background = window.scrollY > 50 ? 'rgba(3,7,18,0.97)' : 'rgba(3,7,18,0.85)';
    };
    window.addEventListener('scroll', handleScroll);
    return () => { observerRef.current?.disconnect(); window.removeEventListener('scroll', handleScroll); };
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box}
        :root{--green:#059669;--green-dark:#047857;--green-light:#34d399;--green-bg:#0d2a1a;--bg:#030712;--bg2:#111827;--bg3:#1a2035;--text:#f9fafb;--text2:#9ca3af;--text3:#6b7280;--border:#1f2937;--border2:#374151;--radius:12px;--radius-lg:20px}
        html{scroll-behavior:smooth}
        body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--bg);color:var(--text);overflow-x:hidden}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .reveal{opacity:0;transform:translateY(28px);transition:all .7s ease}
        .reveal.visible{opacity:1;transform:translateY(0)}
        .lp-nav{position:fixed;top:0;left:0;right:0;z-index:100;padding:16px 40px;display:flex;align-items:center;justify-content:space-between;background:rgba(3,7,18,0.85);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);transition:background .3s}
        .nav-brand{font-size:20px;font-weight:600;color:#fff}
        .nav-brand span{color:var(--green-light)}
        .nav-links{display:flex;gap:28px;list-style:none}
        .nav-links button{background:none;border:none;color:var(--text2);font-size:14px;cursor:pointer;transition:color .2s;font-family:inherit}
        .nav-links button:hover{color:#fff}
        .nav-cta{display:flex;gap:10px}
        .btn{padding:10px 20px;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;border:none;transition:all .2s;display:inline-flex;align-items:center;gap:6px;font-family:inherit}
        .btn-outline{background:transparent;color:#fff;border:1px solid var(--border2)}.btn-outline:hover{background:var(--bg2)}
        .btn-green{background:var(--green);color:#fff}.btn-green:hover{background:var(--green-dark);transform:translateY(-1px)}
        .btn-lg{padding:14px 28px;font-size:15px;border-radius:10px}
        .hero{padding:160px 40px 100px;text-align:center;position:relative;overflow:hidden}
        .hero::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background:radial-gradient(ellipse at 50% 0%,rgba(5,150,105,0.12),transparent 70%);pointer-events:none}
        .hero-badge{display:inline-flex;align-items:center;gap:8px;background:var(--green-bg);border:1px solid rgba(52,211,153,0.3);color:var(--green-light);font-size:12px;font-weight:500;padding:6px 14px;border-radius:20px;margin-bottom:28px;animation:fadeInUp .6s ease both}
        .hero h1{font-size:clamp(36px,5vw,62px);font-weight:600;line-height:1.1;margin-bottom:20px;color:#fff;animation:fadeInUp .6s .1s ease both}
        .hero h1 .hl{color:var(--green-light)}
        .hero-sub{font-size:18px;color:var(--text2);max-width:580px;margin:0 auto 40px;line-height:1.7;animation:fadeInUp .6s .2s ease both}
        .hero-cta{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;animation:fadeInUp .6s .3s ease both}
        .hero-img{margin-top:70px;animation:fadeInUp .8s .4s ease both}
        .mockup{background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;max-width:860px;margin:0 auto;box-shadow:0 40px 80px rgba(0,0,0,0.4)}
        .mock-bar{background:#0f172a;padding:12px 16px;display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--border)}
        .dot{width:10px;height:10px;border-radius:50%}
        .mock-body{display:grid;grid-template-columns:190px 1fr;height:260px}
        .mock-side{background:#0a0f1e;padding:14px;border-right:1px solid var(--border);overflow:hidden}
        .mock-org{font-size:10px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px}
        .mock-item{font-size:11px;color:var(--text3);padding:5px 8px;border-radius:5px;margin-bottom:2px}
        .mock-item.active{background:rgba(5,150,105,0.15);color:var(--green-light)}
        .mock-sec{font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin:10px 0 5px;padding:0 8px}
        .mock-main{padding:14px;background:#0d1117;display:flex;flex-direction:column;gap:10px;overflow:hidden}
        .mock-msg{display:flex;gap:8px}
        .mock-av{width:26px;height:26px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;color:#fff}
        .mock-txt p{font-size:11px;color:#d1d5db;margin-bottom:2px}
        .mock-txt span{font-size:9px;color:var(--text3)}
        .mock-ai{background:rgba(5,150,105,0.08);border:1px solid rgba(52,211,153,0.15);border-radius:8px;padding:8px 10px}
        .mock-ai p{font-size:11px;color:var(--green-light)}
        section{padding:90px 40px}
        .container{max-width:1080px;margin:0 auto}
        .sec-label{font-size:11px;font-weight:600;color:var(--green);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px}
        .sec-title{font-size:clamp(28px,3.5vw,40px);font-weight:600;margin-bottom:14px;color:#fff}
        .sec-sub{font-size:16px;color:var(--text2);max-width:520px;margin-bottom:48px;line-height:1.7}
        .stats-bar{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-top:56px}
        .stat-c{background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius);padding:26px 20px;text-align:center;transition:border-color .3s;position:relative;overflow:hidden}
        .stat-c::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--green);transform:scaleX(0);transition:transform .3s}
        .stat-c:hover{border-color:var(--green)}.stat-c:hover::before{transform:scaleX(1)}
        .stat-n{font-size:40px;font-weight:600;color:var(--green-light);margin-bottom:5px}
        .stat-l{font-size:13px;color:var(--text2)}
        .feat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px}
        .feat-c{background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius);padding:26px;transition:all .3s}
        .feat-c:hover{border-color:rgba(52,211,153,.3);transform:translateY(-3px)}
        .feat-ic{width:46px;height:46px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;margin-bottom:16px}
        .feat-c h3{font-size:16px;font-weight:600;margin-bottom:7px;color:#fff}
        .feat-c p{font-size:13px;color:var(--text2);line-height:1.65}
        .steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:0;position:relative}
        .steps::before{content:'';position:absolute;top:27px;left:12%;right:12%;height:1px;background:linear-gradient(90deg,var(--green),rgba(52,211,153,.2))}
        .step{text-align:center;padding:0 20px}
        .step-n{width:54px;height:54px;border-radius:50%;background:var(--green-bg);border:2px solid var(--green);color:var(--green-light);font-size:18px;font-weight:600;display:flex;align-items:center;justify-content:center;margin:0 auto 18px}
        .step h3{font-size:15px;font-weight:600;margin-bottom:7px;color:#fff}
        .step p{font-size:13px;color:var(--text2);line-height:1.6}
        .india-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;margin-top:44px}
        .india-c{background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:var(--radius);padding:22px;display:flex;align-items:flex-start;gap:14px;transition:all .3s}
        .india-c:hover{background:rgba(5,150,105,.06);border-color:rgba(52,211,153,.2)}
        .india-ic{width:46px;height:46px;background:var(--green-bg);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;color:var(--green-light);flex-shrink:0}
        .india-c h4{font-size:14px;font-weight:600;margin-bottom:4px;color:#fff}
        .india-c p{font-size:12px;color:var(--text2);line-height:1.55}
        .pricing-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:14px;margin-top:44px}
        .plan-c{background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius-lg);padding:30px;position:relative;transition:transform .3s}
        .plan-c.featured{border-color:var(--green);background:linear-gradient(135deg,var(--bg2),rgba(5,150,105,.05))}
        .plan-c:hover{transform:translateY(-4px)}
        .pop-badge{position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:var(--green);color:#fff;font-size:11px;font-weight:600;padding:4px 16px;border-radius:20px;white-space:nowrap}
        .plan-name{font-size:12px;font-weight:600;color:var(--text2);text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px}
        .plan-price{font-size:40px;font-weight:600;color:#fff;margin-bottom:4px}
        .plan-period{font-size:13px;color:var(--text2);margin-bottom:22px}
        .plan-desc{font-size:13px;color:var(--text2);margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid var(--border);line-height:1.6}
        .plan-feats{list-style:none;display:flex;flex-direction:column;gap:10px;margin-bottom:26px}
        .plan-feats li{font-size:13px;color:var(--text2);display:flex;align-items:center;gap:9px}
        .plan-feats li::before{content:'✓';width:17px;height:17px;background:var(--green-bg);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;color:var(--green-light);flex-shrink:0}
        .plan-btn{width:100%;padding:12px;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;border:none;font-family:inherit}
        .plan-btn.p{background:var(--green);color:#fff}.plan-btn.p:hover{background:var(--green-dark)}
        .plan-btn.s{background:transparent;color:#fff;border:1px solid var(--border2)}.plan-btn.s:hover{background:var(--bg3)}
        .test-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:14px;margin-top:44px}
        .test-c{background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius);padding:26px;transition:border-color .3s}
        .test-c:hover{border-color:rgba(52,211,153,.2)}
        .stars{color:#fbbf24;font-size:13px;margin-bottom:14px;letter-spacing:2px}
        .test-c blockquote{font-size:14px;color:var(--text);line-height:1.7;margin-bottom:18px;font-style:italic}
        .t-auth{display:flex;align-items:center;gap:11px;padding-top:14px;border-top:1px solid var(--border)}
        .t-av{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600;color:#fff;flex-shrink:0}
        .t-info p:first-child{font-size:13px;font-weight:600;color:#fff}
        .t-info p:last-child{font-size:11px;color:var(--text3)}
        .form-card{background:rgba(255,255,255,.02);border:1px solid var(--border);border-radius:var(--radius-lg);padding:34px}
        .form-card h3{font-size:20px;font-weight:600;margin-bottom:6px;color:#fff}
        .form-card>p{font-size:13px;color:var(--text2);margin-bottom:26px}
        .form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .form-group{margin-bottom:14px}
        .form-group label{display:block;font-size:12px;font-weight:500;color:var(--text2);margin-bottom:5px}
        .form-group input,.form-group select,.form-group textarea{width:100%;background:rgba(255,255,255,.04);border:1px solid var(--border2);border-radius:8px;padding:11px 13px;color:#fff;font-size:13px;font-family:inherit;transition:border-color .2s;outline:none}
        .form-group input::placeholder,.form-group textarea::placeholder{color:var(--text3)}
        .form-group input:focus,.form-group select:focus,.form-group textarea:focus{border-color:var(--green);background:rgba(5,150,105,.05)}
        .form-group select option{background:#1a2035;color:#fff}
        .form-group textarea{resize:vertical;min-height:100px}
        .form-sub{width:100%;padding:13px;background:var(--green);color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;margin-top:4px;font-family:inherit}
        .form-sub:hover{background:var(--green-dark);transform:translateY(-1px)}
        .form-ok{display:none;text-align:center;padding:28px}
        .form-ok h4{font-size:18px;font-weight:600;color:var(--green-light);margin:12px 0 8px}
        .form-ok p{color:var(--text2);font-size:13px}
        .final-cta{padding:120px 40px;text-align:center;position:relative;overflow:hidden}
        .final-cta::before{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:600px;height:400px;background:radial-gradient(ellipse,rgba(5,150,105,.12),transparent 70%);pointer-events:none}
        .final-cta h2{font-size:clamp(30px,4vw,50px);font-weight:600;margin-bottom:14px;color:#fff}
        .final-cta p{font-size:17px;color:var(--text2);margin-bottom:40px}
        .cta-note{font-size:12px;color:var(--text3);margin-top:14px}
        footer{background:#030712;border-top:1px solid var(--border);padding:56px 40px 36px}
        .ft-top{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:40px;margin-bottom:44px}
        .ft-logo{font-size:20px;font-weight:600;color:#fff}
        .ft-logo span{color:var(--green-light)}
        .ft-brand p{font-size:13px;color:var(--text2);margin:10px 0 18px;line-height:1.7;max-width:240px}
        .ft-badges{display:flex;gap:8px}
        .ft-badge{background:var(--green-bg);border:1px solid rgba(52,211,153,.2);color:var(--green-light);font-size:10px;padding:3px 9px;border-radius:5px}
        .ft-col h4{font-size:12px;font-weight:600;color:#fff;margin-bottom:14px;text-transform:uppercase;letter-spacing:.5px}
        .ft-col ul{list-style:none;display:flex;flex-direction:column;gap:9px}
        .ft-col ul a,.ft-col ul button{font-size:13px;color:var(--text2);text-decoration:none;transition:color .2s;background:none;border:none;cursor:pointer;font-family:inherit;padding:0;text-align:left}
        .ft-col ul a:hover,.ft-col ul button:hover{color:#fff}
        .ft-bot{border-top:1px solid var(--border);padding-top:26px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}
        .ft-bot p{font-size:12px;color:var(--text3)}
        @media(max-width:768px){.lp-nav{padding:14px 20px}.nav-links{display:none}section{padding:70px 20px}.hero{padding:120px 20px 80px}.steps::before{display:none}.ft-top{grid-template-columns:1fr 1fr}.form-row{grid-template-columns:1fr}.contact-grid{grid-template-columns:1fr !important}}
      `}</style>

      {/* NAV */}
      <nav className="lp-nav" id="lp-nav">
        <div className="nav-brand">Deemona <span>Teams</span></div>
        <ul className="nav-links">
          <li><button onClick={() => scrollTo('features')}>Features</button></li>
          <li><button onClick={() => scrollTo('how-it-works')}>How it works</button></li>
          <li><button onClick={() => scrollTo('pricing')}>Pricing</button></li>
          <li><button onClick={() => scrollTo('contact')}>Contact</button></li>
        </ul>
        <div className="nav-cta">
          <button className="btn btn-outline" onClick={() => router.push('/login')}>Sign in</button>
          <button className="btn btn-green" onClick={() => router.push('/signup')}>Start free</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-badge">&#127823; Built for Indian teams by Deemona Technologies</div>
        <h1>Where Indian teams <span className="hl">collaborate</span><br/>and get things done</h1>
        <p className="hero-sub">Messaging, boards, meetings, and AI — all in one platform. With GST invoicing, UPI payments, and WhatsApp notifications built-in.</p>
        <div className="hero-cta">
          <button className="btn btn-green btn-lg" onClick={() => router.push('/signup')}>&#128640; Start free trial</button>
          <button className="btn btn-outline btn-lg" onClick={() => scrollTo('features')}>See all features</button>
        </div>
        <div className="hero-img">
          <div className="mockup">
            <div className="mock-bar">
              <div className="dot" style={{background:'#ef4444'}}/>
              <div className="dot" style={{background:'#f59e0b'}}/>
              <div className="dot" style={{background:'#22c55e'}}/>
              <span style={{fontSize:11,color:'#4b5563',marginLeft:12}}>Deemona Teams — Deemona HQ</span>
            </div>
            <div className="mock-body">
              <div className="mock-side">
                <div className="mock-org">Deemona HQ</div>
                <div className="mock-sec">Channels</div>
                <div className="mock-item active"># general</div>
                <div className="mock-item"># engineering</div>
                <div className="mock-item"># sales</div>
                <div className="mock-sec">Boards</div>
                <div className="mock-item">Sprint Board</div>
                <div className="mock-item">Sales CRM</div>
                <div className="mock-sec">Navigation</div>
                <div className="mock-item">Meetings</div>
              </div>
              <div className="mock-main">
                <div className="mock-msg">
                  <div className="mock-av" style={{background:'#059669'}}>A</div>
                  <div className="mock-txt"><p>Sprint 1 planning meeting tomorrow at 10 AM. Please review backlog!</p><span>Abhishek Sharma &bull; 9:53 am</span></div>
                </div>
                <div className="mock-msg">
                  <div className="mock-av" style={{background:'#7c3aed'}}>K</div>
                  <div className="mock-txt"><p>Operations team is fully set up. All processes documented!</p><span>Kavita Rao &bull; 9:54 am</span></div>
                </div>
                <div className="mock-msg">
                  <div className="mock-av" style={{background:'#0284c7'}}>R</div>
                  <div className="mock-txt"><p>Design system coming together. Component library ready by end of sprint.</p><span>Rohan Verma &bull; 9:55 am</span></div>
                </div>
                <div className="mock-ai">
                  <p>&#129302; <strong>Deemona AI:</strong> Summarized today&apos;s discussion. I&apos;ve created 6 tasks on Sprint Board automatically.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{padding:'56px 40px',background:'var(--bg2)',borderTop:'1px solid var(--border)',borderBottom:'1px solid var(--border)'}}>
        <div className="container">
          <div className="stats-bar">
            <div className="stat-c reveal"><div className="stat-n">3-in-1</div><div className="stat-l">Replaces Slack + Trello + Teams</div></div>
            <div className="stat-c reveal"><div className="stat-n">AI</div><div className="stat-l">Powered by Claude by Anthropic</div></div>
            <div className="stat-c reveal"><div className="stat-n">WA</div><div className="stat-l">Two-way WhatsApp messaging</div></div>
            <div className="stat-c reveal"><div className="stat-n">India</div><div className="stat-l">GST, UPI, 21 languages built-in</div></div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features">
        <div className="container">
          <div className="sec-label reveal">Features</div>
          <h2 className="sec-title reveal">Everything your team needs</h2>
          <p className="sec-sub reveal">One platform replacing Slack, Trello, and Microsoft Teams — built for Indian businesses.</p>
          <div className="feat-grid">
            {[
              {icon:'&#128172;',bg:'#0d2a1a',title:'Real-time messaging',desc:'Channels, DMs, threads, reactions, voice messages, scheduled messages, file uploads, bookmarks, and @here mentions.'},
              {icon:'&#128203;',bg:'#1e1b4b',title:'Kanban boards',desc:'Drag-and-drop tasks, subtasks, time tracking, dependencies, cover colors, attachments, activity log, and board analytics.'},
              {icon:'&#127909;',bg:'#1c1917',title:'Video meetings',desc:'HD video calls, screen sharing, recording to cloud, whiteboard collaboration, meeting polls, and recurring schedules.'},
              {icon:'&#129302;',bg:'#0c2340',title:'Deemona AI',desc:'AI chat assistant, channel summarizer, and task generator. Describe your project — AI creates all tasks instantly.'},
              {icon:'&#128241;',bg:'#1a2e05',title:'WhatsApp integration',desc:'Send and receive WhatsApp messages from Deemona Teams. Two-way communication for teams on the go.'},
              {icon:'&#128196;',bg:'#2d1515',title:'India-first features',desc:'GST-compliant invoicing, UPI payment links, 21-language support, DPDP Act compliance, and IST defaults.'},
            ].map((f,i) => (
              <div key={i} className="feat-c reveal">
                <div className="feat-ic" style={{background:f.bg}} dangerouslySetInnerHTML={{__html:f.icon}}/>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{background:'var(--bg2)',borderTop:'1px solid var(--border)'}}>
        <div className="container">
          <div className="sec-label reveal">How it works</div>
          <h2 className="sec-title reveal">Up and running in minutes</h2>
          <p className="sec-sub reveal">No complex setup. Your team is collaborating in under 10 minutes.</p>
          <div className="steps">
            {[
              {n:'1',title:'Create workspace',desc:'Sign up and create your team workspace in 60 seconds. Invite members via email or WhatsApp.'},
              {n:'2',title:'Set up channels',desc:'Create channels for your teams — engineering, sales, HR, marketing. Import from Slack if needed.'},
              {n:'3',title:'Add boards',desc:'Pick a template (Scrum, Kanban, CRM) or let AI generate your first board from a description.'},
              {n:'4',title:'Start collaborating',desc:'Chat, meet, manage tasks, and get AI insights — all from one place, on any device.'},
            ].map((s,i) => (
              <div key={i} className="step reveal">
                <div className="step-n">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INDIA */}
      <section style={{background:'var(--bg)',borderTop:'1px solid var(--border)'}}>
        <div className="container">
          <div className="sec-label reveal">Made for India</div>
          <h2 className="sec-title reveal">Built for Bharat</h2>
          <p className="sec-sub reveal">Every feature designed with Indian businesses in mind.</p>
          <div className="india-grid">
            {[
              {ic:'GST',title:'GST invoicing',desc:'Generate GST-compliant invoices from projects. CGST, SGST, IGST handled automatically.'},
              {ic:'UPI',title:'UPI payment links',desc:'Create UPI payment links from invoices. Accept via GPay, PhonePe, Paytm, and all UPI apps.'},
              {ic:'WA',title:'WhatsApp notifications',desc:'Meeting reminders, task updates, and @mentions delivered to WhatsApp — where India is.'},
              {ic:'Hi',title:'21 Indian languages',desc:'Interface and AI support for Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, and 15 more.'},
              {ic:'DPDP',title:'DPDP Act compliance',desc:'Built for India\'s Digital Personal Data Protection Act 2023. Your data stays in India.'},
              {ic:'IST',title:'India-first defaults',desc:'IST timezone, INR currency, Indian date formats, and Indian phone number formats by default.'},
            ].map((c,i) => (
              <div key={i} className="india-c reveal">
                <div className="india-ic">{c.ic}</div>
                <div><h4>{c.title}</h4><p>{c.desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{background:'var(--bg2)',borderTop:'1px solid var(--border)'}}>
        <div className="container">
          <div className="sec-label reveal">Testimonials</div>
          <h2 className="sec-title reveal">Loved by Indian teams</h2>
          <p className="sec-sub reveal">Teams across India are switching to Deemona Teams.</p>
          <div className="test-grid">
            {[
              {q:'"Finally a collaboration tool that understands Indian business. The GST invoicing and WhatsApp notifications are game changers for our field teams."',name:'Rahul Mehta',role:'Founder, TechStartup Delhi',bg:'#059669'},
              {q:'"We replaced Slack, Trello, and Zoom with just Deemona Teams. The AI task generator saves us 3-4 hours every sprint planning session."',name:'Priya Sharma',role:'CTO, Bangalore SaaS Company',bg:'#7c3aed'},
              {q:'"WhatsApp integration means our field sales team stays connected without a laptop. UPI payment links reduced our collection time by 70%."',name:'Amit Patel',role:'Operations Head, Mumbai',bg:'#0284c7'},
            ].map((t,i) => (
              <div key={i} className="test-c reveal">
                <div className="stars">&#11088;&#11088;&#11088;&#11088;&#11088;</div>
                <blockquote>{t.q}</blockquote>
                <div className="t-auth">
                  <div className="t-av" style={{background:t.bg}}>{t.name.charAt(0)}</div>
                  <div className="t-info"><p>{t.name}</p><p>{t.role}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing">
        <div className="container">
          <div className="sec-label reveal">Pricing</div>
          <h2 className="sec-title reveal">Simple, honest pricing</h2>
          <p className="sec-sub reveal">No hidden fees. No per-seat traps. Designed for Indian SMEs and enterprises.</p>
          <div className="pricing-grid">
            <div className="plan-c reveal">
              <div className="plan-name">Starter</div>
              <div className="plan-price">Free</div>
              <div className="plan-period">forever, no credit card needed</div>
              <div className="plan-desc">Perfect for small teams getting started.</div>
              <ul className="plan-feats">
                <li>Up to 5 team members</li>
                <li>3 channels + 1 board</li>
                <li>5 GB storage</li>
                <li>Basic messaging and meetings</li>
              </ul>
              <button className="plan-btn s" onClick={() => router.push('/signup')}>Get started free</button>
            </div>
            <div className="plan-c featured reveal">
              <div className="pop-badge">Most popular</div>
              <div className="plan-name">Growth</div>
              <div className="plan-price">&#8377;999</div>
              <div className="plan-period">per month, billed annually</div>
              <div className="plan-desc">For growing teams that need AI, WhatsApp, and advanced features.</div>
              <ul className="plan-feats">
                <li>Up to 25 team members</li>
                <li>Unlimited channels and boards</li>
                <li>50 GB storage</li>
                <li>Deemona AI assistant</li>
                <li>WhatsApp notifications</li>
                <li>GST invoicing and UPI links</li>
              </ul>
              <button className="plan-btn p" onClick={() => router.push('/signup')}>Start 14-day free trial</button>
            </div>
            <div className="plan-c reveal">
              <div className="plan-name">Enterprise</div>
              <div className="plan-price">Custom</div>
              <div className="plan-period">contact us for pricing</div>
              <div className="plan-desc">For large organisations with compliance needs.</div>
              <ul className="plan-feats">
                <li>Unlimited members</li>
                <li>Custom domain and branding</li>
                <li>SSO and advanced security</li>
                <li>DPDP Act compliance</li>
                <li>Dedicated support manager</li>
              </ul>
              <button className="plan-btn s" onClick={() => scrollTo('contact')}>Contact sales</button>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" style={{background:'var(--bg2)',borderTop:'1px solid var(--border)'}}>
        <div className="container">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:60,alignItems:'start'}} className="contact-grid">
            <div>
              <div className="sec-label reveal">Contact us</div>
              <h2 className="sec-title reveal">Let&apos;s talk about your team</h2>
              <p style={{fontSize:15,color:'var(--text2)',lineHeight:1.7,marginBottom:32}} className="reveal">Whether you&apos;re a 5-person startup or a 500-person enterprise — we&apos;d love to show you how Deemona Teams transforms collaboration.</p>
              {[
                {ic:'&#128231;',title:'Email us',val:'teams@deemona.com'},
                {ic:'&#128241;',title:'WhatsApp',val:'+91 96541 35922'},
                {ic:'&#128205;',title:'Headquarters',val:'Deemona Technologies, Delhi, India'},
              ].map((c,i) => (
                <div key={i} className="reveal" style={{display:'flex',alignItems:'center',gap:14,marginBottom:16,padding:14,background:'rgba(255,255,255,.03)',borderRadius:10,border:'1px solid var(--border)'}}>
                  <div style={{width:40,height:40,background:'var(--green-bg)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}} dangerouslySetInnerHTML={{__html:c.ic}}/>
                  <div><div style={{fontSize:12,fontWeight:600,marginBottom:2,color:'#fff'}}>{c.title}</div><div style={{fontSize:13,color:'var(--text2)'}}>{c.val}</div></div>
                </div>
              ))}
            </div>
            <div className="reveal">
              <div className="form-card">
                <h3>Get in touch</h3>
                <p>Our team will reach out within 24 hours.</p>
                <div id="lp-form">
                  <div className="form-row">
                    <div className="form-group"><label>First name *</label><input type="text" id="lp-fname" placeholder="Abhishek" required/></div>
                    <div className="form-group"><label>Last name *</label><input type="text" id="lp-lname" placeholder="Sharma" required/></div>
                  </div>
                  <div className="form-group"><label>Work email *</label><input type="email" id="lp-email" placeholder="you@company.com" required/></div>
                  <div className="form-group"><label>Phone / WhatsApp</label><input type="tel" id="lp-phone" placeholder="+91 98765 43210"/></div>
                  <div className="form-row">
                    <div className="form-group"><label>Company</label><input type="text" id="lp-co" placeholder="Acme Technologies"/></div>
                    <div className="form-group"><label>Team size</label>
                      <select id="lp-size"><option value="">Select...</option><option>1-5</option><option>6-25</option><option>26-100</option><option>100+</option></select>
                    </div>
                  </div>
                  <div className="form-group"><label>Message</label><textarea id="lp-msg" placeholder="Tell us about your team..."></textarea></div>
                  <button className="form-sub" onClick={() => {
                    const btn = document.querySelector('.form-sub') as HTMLButtonElement;
                    if(btn){btn.textContent='Sending...';btn.disabled=true;}
                    setTimeout(() => {
                      const f = document.getElementById('lp-form');
                      const s = document.getElementById('lp-success');
                      if(f) f.style.display='none';
                      if(s) s.style.display='block';
                    }, 1200);
                  }}>Send message &#8594;</button>
                </div>
                <div id="lp-success" className="form-ok" style={{display:'none'}}>
                  <div style={{fontSize:44}}>&#9989;</div>
                  <h4>Message sent!</h4>
                  <p>Our team will get back to you within 24 hours on email or WhatsApp.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final-cta">
        <div className="container">
          <div className="reveal" style={{fontSize:46,marginBottom:16}}>&#128640;</div>
          <h2 className="reveal">Ready to replace 3 tools with 1?</h2>
          <p className="reveal">Join Indian teams already collaborating on Deemona Teams.</p>
          <div style={{display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap'}} className="reveal">
            <button className="btn btn-green btn-lg" onClick={() => router.push('/signup')}>Start free — no credit card</button>
            <button className="btn btn-outline btn-lg" onClick={() => scrollTo('contact')}>Talk to us</button>
          </div>
          <p className="cta-note reveal">Free plan available &bull; Setup in 5 minutes &bull; Cancel anytime</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="container">
          <div className="ft-top">
            <div className="ft-brand">
              <div className="ft-logo">Deemona <span>Teams</span></div>
              <p>Collaboration platform built for Indian teams — messaging, boards, meetings, and AI in one place.</p>
              <div className="ft-badges"><span className="ft-badge">Made in India</span><span className="ft-badge">DPDP Compliant</span></div>
            </div>
            <div className="ft-col"><h4>Product</h4><ul>
              <li><button onClick={() => scrollTo('features')}>Features</button></li>
              <li><button onClick={() => scrollTo('pricing')}>Pricing</button></li>
              <li><button onClick={() => scrollTo('how-it-works')}>How it works</button></li>
              <li><button onClick={() => router.push('/signup')}>Sign up</button></li>
            </ul></div>
            <div className="ft-col"><h4>Company</h4><ul>
              <li><a href="#">About Deemona</a></li>
              <li><a href="#">Blog</a></li>
              <li><button onClick={() => scrollTo('contact')}>Contact</button></li>
              <li><a href="#">Careers</a></li>
            </ul></div>
            <div className="ft-col"><h4>Legal</h4><ul>
              <li><a href="#">Privacy policy</a></li>
              <li><a href="#">Terms of service</a></li>
              <li><a href="#">DPDP compliance</a></li>
              <li><a href="#">Cookie policy</a></li>
            </ul></div>
          </div>
          <div className="ft-bot">
            <p>&#169; 2026 Deemona Technologies Pvt. Ltd. All rights reserved.</p>
            <p>Built with &#10084;&#65039; in India</p>
          </div>
        </div>
      </footer>
    </>
  );
}
