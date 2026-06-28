'use client';
export default function AcceptableUsePage() {
  return (
    <div style={{minHeight:'100vh',background:'#f9fafb',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'}}>
      <div style={{maxWidth:860,margin:'0 auto',padding:'48px 24px'}}>
        <div style={{marginBottom:32}}><a href="/signup" style={{color:'#248046',textDecoration:'none',fontSize:14}}>← Back to signup</a></div>
        <div style={{background:'#fff',borderRadius:16,border:'1px solid #e5e7eb',padding:48,boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
          <div style={{marginBottom:32,paddingBottom:24,borderBottom:'2px solid #e5e7eb'}}>
            <h1 style={{fontSize:32,fontWeight:700,color:'#111827',margin:'0 0 8px'}}>Acceptable Use Policy</h1>
            <p style={{color:'#6b7280',fontSize:14,margin:0}}>Deemona Teams — Deemona Technologies Pvt. Ltd. | Last updated: 28 June 2026</p>
          </div>
          {[
            { title:'1. Purpose', content:`This Acceptable Use Policy ("AUP") governs the use of Deemona Teams. By using the Platform, you agree to comply with this AUP. Violations may result in immediate suspension or termination of your account without refund or notice.` },
            { title:'2. Prohibited Content', content:`You must not transmit, post, upload, or share content that:
(a) Is unlawful, defamatory, obscene, pornographic, hateful, or incites violence;
(b) Harasses, threatens, or intimidates any person;
(c) Infringes any intellectual property rights, trademarks, or trade secrets;
(d) Contains false, misleading, or fraudulent information;
(e) Violates the privacy of any person;
(f) Promotes illegal activities, terrorism, or extremism;
(g) Contains sexually explicit material;
(h) Discriminates based on race, religion, gender, sexual orientation, disability, or nationality;
(i) Violates any applicable laws of India or any other jurisdiction.` },
            { title:'3. Prohibited Activities', content:`You must not:
(a) Use the Platform to transmit spam, chain letters, or unsolicited bulk messages;
(b) Attempt to gain unauthorised access to any system, network, or data;
(c) Introduce malware, viruses, ransomware, or any malicious code;
(d) Conduct phishing, social engineering, or identity theft;
(e) Scrape, crawl, or extract data from the Platform without authorisation;
(f) Reverse engineer, decompile, or disassemble the Platform;
(g) Use automated bots or scripts to access the Platform;
(h) Circumvent any security measures or access controls;
(i) Resell or commercialise the Service without written authorisation;
(j) Use the Platform to facilitate cryptocurrency mining;
(k) Impersonate any person or entity.` },
            { title:'4. Data and Storage', content:`You are solely responsible for all content you upload. Do not upload content that:
(a) Contains personally identifiable information of third parties without their consent;
(b) Violates any data protection laws;
(c) Exceeds the storage limits applicable to your plan;
(d) Consists of illegal copies of software or media.` },
            { title:'5. Business Use', content:`The Platform is designed for legitimate business and personal productivity use. You must not use it to conduct or facilitate any business that is illegal under Indian law or the laws of any jurisdiction in which you operate.` },
            { title:'6. Reporting Violations', content:`If you become aware of any violation of this AUP, please report it immediately to: abuse@deemona.com

We take all reports seriously and will investigate and take appropriate action.` },
            { title:'7. Consequences of Violation', content:`Violations of this AUP may result in:
(a) Immediate suspension or termination of your account;
(b) Removal of offending content;
(c) Reporting to relevant law enforcement authorities;
(d) Civil or criminal legal action;
(e) No refund of any fees paid.

The Company reserves the right to determine what constitutes a violation of this AUP in its sole discretion.` },
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
