'use client';
export default function PrivacyPage() {
  return (
    <div style={{minHeight:'100vh',background:'#f9fafb',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'}}>
      <div style={{maxWidth:860,margin:'0 auto',padding:'48px 24px'}}>
        <div style={{marginBottom:32}}><a href="/signup" style={{color:'#248046',textDecoration:'none',fontSize:14}}>← Back to signup</a></div>
        <div style={{background:'#fff',borderRadius:16,border:'1px solid #e5e7eb',padding:48,boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
          <div style={{marginBottom:32,paddingBottom:24,borderBottom:'2px solid #e5e7eb'}}>
            <h1 style={{fontSize:32,fontWeight:700,color:'#111827',margin:'0 0 8px'}}>Privacy Policy</h1>
            <p style={{color:'#6b7280',fontSize:14,margin:0}}>Deemona Teams — Deemona Technologies Pvt. Ltd.</p>
            <p style={{color:'#6b7280',fontSize:14,margin:'4px 0 0'}}>Last updated: 28 June 2026</p>
          </div>
          {[
            { title:'1. Introduction', content:`Deemona Technologies Pvt. Ltd. ("we", "us", "our") is committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use Deemona Teams. This policy complies with India's Digital Personal Data Protection Act, 2023 (DPDP Act) and applicable international standards.` },
            { title:'2. Information We Collect', content:`2.1 Account Information: Name, email address, phone number, organisation name, designation, profile picture, and password (encrypted).

2.2 Usage Data: Messages, files, tasks, meeting recordings, and other content you create on the Platform.

2.3 Technical Data: IP address, browser type, device information, operating system, access times, and pages viewed.

2.4 Communication Data: Messages sent via WhatsApp integration, email notifications, and in-app communications.

2.5 Payment Data: If applicable, billing information processed through our payment providers. We do not store full payment card details.` },
            { title:'3. How We Use Your Information', content:`We use your personal data to:
(a) Provide, operate, and maintain the Platform;
(b) Create and manage your account;
(c) Send notifications, reminders, and service communications;
(d) Process transactions and send related information;
(e) Monitor and analyse usage to improve the Platform;
(f) Comply with legal obligations under Indian law;
(g) Prevent fraud, abuse, and security threats;
(h) Respond to support requests and enquiries.` },
            { title:'4. Legal Basis for Processing', content:`Under the DPDP Act 2023, we process your data based on:
(a) Your consent (which you may withdraw at any time);
(b) Contractual necessity to provide the Service;
(c) Legitimate interests in operating and improving the Platform;
(d) Legal obligations under applicable Indian law.` },
            { title:'5. Data Sharing and Disclosure', content:`We do not sell your personal data. We may share data with:

5.1 Service Providers: Twilio (WhatsApp/SMS), LiveKit (video conferencing), Cloudflare (storage), Resend (email), and Render (hosting), each bound by data processing agreements.

5.2 Legal Requirements: We may disclose data if required by law, court order, or government authority under the Information Technology Act, 2000, or other applicable legislation.

5.3 Business Transfers: In the event of a merger, acquisition, or sale, user data may be transferred as part of the business assets.

5.4 With Your Consent: We may share data with third parties when you have expressly consented.` },
            { title:'6. Data Storage and Security', content:`6.1 Your data is stored on servers located in Singapore (Render Cloud) with backups. By using the Platform, you consent to this transfer.

6.2 We implement industry-standard security measures including encryption at rest and in transit (TLS 1.3), access controls, and regular security audits.

6.3 Despite our best efforts, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security and shall not be liable for any breach beyond our reasonable control.` },
            { title:'7. Your Rights Under DPDP Act 2023', content:`As a Data Principal under India's DPDP Act, you have the right to:
(a) Access information about your personal data being processed;
(b) Correction and erasure of inaccurate or incomplete data;
(c) Grievance redressal through our Data Protection Officer;
(d) Nominate another individual to exercise rights on your behalf in case of death or incapacity;
(e) Withdraw consent at any time (which may affect your ability to use certain features).

To exercise these rights, contact: privacy@deemona.com` },
            { title:'8. Data Retention', content:`We retain your personal data for as long as your account is active or as needed to provide services. Upon account deletion, we delete your data within 90 days, except where retention is required by law or for legitimate business purposes such as fraud prevention.` },
            { title:'9. Cookies', content:`We use essential cookies necessary for the Platform to function. Please see our Cookie Policy for details. You may disable cookies through your browser settings, but this may affect Platform functionality.` },
            { title:'10. Children\'s Privacy', content:`The Platform is not intended for individuals under 18 years of age. We do not knowingly collect personal data from minors. If you believe a minor has provided us with personal data, please contact us immediately.` },
            { title:'11. Changes to This Policy', content:`We may update this Privacy Policy from time to time. We will notify you of significant changes via email or through the Platform. Your continued use after changes constitutes acceptance of the updated policy.` },
            { title:'12. Data Protection Officer', content:`Our Data Protection Officer can be contacted at:
Email: dpo@deemona.com
Deemona Technologies Pvt. Ltd., Delhi, India

You also have the right to lodge a complaint with the Data Protection Board of India once established under the DPDP Act 2023.` },
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
