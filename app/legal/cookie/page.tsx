'use client';
export default function CookiePage() {
  return (
    <div style={{minHeight:'100vh',background:'#f9fafb',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'}}>
      <div style={{maxWidth:860,margin:'0 auto',padding:'48px 24px'}}>
        <div style={{marginBottom:32}}><a href="/signup" style={{color:'#248046',textDecoration:'none',fontSize:14}}>← Back to signup</a></div>
        <div style={{background:'#fff',borderRadius:16,border:'1px solid #e5e7eb',padding:48,boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
          <div style={{marginBottom:32,paddingBottom:24,borderBottom:'2px solid #e5e7eb'}}>
            <h1 style={{fontSize:32,fontWeight:700,color:'#111827',margin:'0 0 8px'}}>Cookie Policy</h1>
            <p style={{color:'#6b7280',fontSize:14,margin:0}}>Deemona Teams — Deemona Technologies Pvt. Ltd. | Last updated: 28 June 2026</p>
          </div>
          {[
            { title:'1. What Are Cookies', content:`Cookies are small text files placed on your device when you visit our Platform. They help us recognise your device, remember your preferences, and provide a better user experience.` },
            { title:'2. Types of Cookies We Use', content:`2.1 Essential Cookies (Required): These cookies are necessary for the Platform to function. They include:
• Authentication tokens (sahyog_token) — keeps you logged in
• Session cookies — maintains your session state
• Security cookies — protects against CSRF attacks

You cannot opt out of essential cookies as the Platform cannot function without them.

2.2 Preference Cookies: Store your preferences such as:
• Theme (dark/light mode)
• Notification preferences
• Language settings
• Draft messages

2.3 Analytics Cookies (Optional): We may use analytics tools to understand how users interact with the Platform to improve it. These are anonymised and do not identify you personally.` },
            { title:'3. Local Storage', content:`In addition to cookies, we use browser local storage to store:
• Authentication tokens
• User preferences and settings
• Draft messages
• Notification preferences
• Starred messages

This data is stored on your device and is not transmitted to third parties unless necessary to provide the Service.` },
            { title:'4. Third-Party Cookies', content:`Some features of the Platform may use third-party services that set their own cookies, including LiveKit (video conferencing) and analytics providers. We do not control these cookies. Please refer to the respective privacy policies of these providers.` },
            { title:'5. Managing Cookies', content:`You can control and delete cookies through your browser settings. Most browsers allow you to:
• View what cookies are stored
• Delete all or specific cookies
• Block cookies from specific sites
• Block all cookies

Note that disabling cookies may affect the functionality of the Platform, particularly authentication features.` },
            { title:'6. Consent', content:`By using the Platform, you consent to our use of cookies as described in this policy. If you do not consent, please disable cookies in your browser settings or discontinue use of the Platform.` },
          ].map((s,i) => (
            <div key={i} style={{marginBottom:28}}>
              <h2 style={{fontSize:18,fontWeight:700,color:'#111827',marginBottom:10,paddingBottom:8,borderBottom:'1px solid #f3f4f6'}}>{s.title}</h2>
              <div style={{fontSize:15,color:'#374151',lineHeight:1.8,whiteSpace:'pre-line'}}>{s.content}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
