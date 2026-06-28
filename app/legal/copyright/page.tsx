'use client';
export default function CopyrightPage() {
  return (
    <div style={{minHeight:'100vh',background:'#f9fafb',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'}}>
      <div style={{maxWidth:860,margin:'0 auto',padding:'48px 24px'}}>
        <div style={{marginBottom:32}}><a href="/signup" style={{color:'#248046',textDecoration:'none',fontSize:14}}>← Back to signup</a></div>
        <div style={{background:'#fff',borderRadius:16,border:'1px solid #e5e7eb',padding:48,boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
          <div style={{marginBottom:32,paddingBottom:24,borderBottom:'2px solid #e5e7eb'}}>
            <h1 style={{fontSize:32,fontWeight:700,color:'#111827',margin:'0 0 8px'}}>Copyright Policy</h1>
            <p style={{color:'#6b7280',fontSize:14,margin:0}}>Deemona Teams — Deemona Technologies Pvt. Ltd. | Last updated: 28 June 2026</p>
          </div>
          {[
            { title:'1. Ownership of Platform', content:`© 2026 Deemona Technologies Pvt. Ltd. All Rights Reserved.

The Deemona Teams platform, including all software, code, design, text, graphics, user interfaces, visual interfaces, photographs, trademarks, logos, sounds, music, artwork, and computer code (collectively "Content") is owned, controlled, or licensed by Deemona Technologies Pvt. Ltd. and is protected by Indian and international copyright laws, trade dress laws, patent laws, and various other intellectual property rights and unfair competition laws.

No part of the Platform or Content may be copied, reproduced, republished, uploaded, posted, publicly displayed, encoded, translated, transmitted, or distributed in any way to any other computer, server, website, or other medium for publication or distribution, or for any commercial enterprise, without the Company's prior written consent.` },
            { title:'2. Trademarks', content:`"Deemona Teams", "Deemona Technologies", the Deemona logo, and all related names, logos, product and service names, designs, and slogans are trademarks of Deemona Technologies Pvt. Ltd. You must not use such marks without our prior written permission. All other names, logos, product and service names, designs, and slogans on the Platform are the trademarks of their respective owners.` },
            { title:'3. Copyright Infringement Claims (DMCA-equivalent)', content:`If you believe that any content on the Platform infringes your copyright, please send a written notice to our designated agent at:

legal@deemona.com

Subject: Copyright Infringement Claim

Your notice must include:
(a) Your name, address, telephone number, and email address;
(b) A description of the copyrighted work you claim has been infringed;
(c) A description of where the allegedly infringing material is located on the Platform;
(d) A statement that you have a good-faith belief that the disputed use is not authorised by the copyright owner, its agent, or the law;
(e) A statement, made under penalty of perjury, that the above information in your notice is accurate and that you are the copyright owner or authorised to act on the copyright owner's behalf;
(f) Your electronic or physical signature.

We will respond to notices of alleged copyright infringement and will take appropriate action, including removal of the offending content.` },
            { title:'4. Counter-Notice', content:`If you believe your content was wrongly removed, you may submit a counter-notice to legal@deemona.com with:
(a) Identification of the material that was removed;
(b) A statement under penalty of perjury that you have a good-faith belief the material was removed by mistake;
(c) Your name, address, and telephone number;
(d) Your consent to the jurisdiction of the courts of New Delhi, India.` },
            { title:'5. Repeat Infringer Policy', content:`In appropriate circumstances, we will terminate the accounts of users who are found to be repeat infringers of intellectual property rights.` },
            { title:'6. User Content Licence', content:`By uploading, submitting, or posting content to the Platform, you grant Deemona Technologies Pvt. Ltd. a worldwide, non-exclusive, royalty-free, transferable licence to use, reproduce, distribute, prepare derivative works of, display, and perform your content solely in connection with providing and improving the Service. You represent and warrant that you have all rights necessary to grant this licence.` },
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
