'use client';
export default function TermsPage() {
  return (
    <div style={{minHeight:'100vh',background:'#f9fafb',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'}}>
      <div style={{maxWidth:860,margin:'0 auto',padding:'48px 24px'}}>
        <div style={{marginBottom:32}}>
          <a href="/signup" style={{color:'#248046',textDecoration:'none',fontSize:14}}>← Back to signup</a>
        </div>
        <div style={{background:'#fff',borderRadius:16,border:'1px solid #e5e7eb',padding:48,boxShadow:'0 1px 3px rgba(15,23,42,0.02)'}}>
          <div style={{marginBottom:32,paddingBottom:24,borderBottom:'2px solid #e5e7eb'}}>
            <h1 style={{fontSize:32,fontWeight:700,color:'#111827',margin:'0 0 8px'}}>Terms and Conditions</h1>
            <p style={{color:'#64748B',fontSize:14,margin:0}}>Deemona Teams — Deemona Technologies Pvt. Ltd.</p>
            <p style={{color:'#64748B',fontSize:14,margin:'4px 0 0'}}>Last updated: 28 June 2026 | Effective date: 28 June 2026</p>
          </div>

          <div style={{background:'#fef3c7',border:'1px solid #f59e0b',borderRadius:8,padding:16,marginBottom:28}}>
            <p style={{color:'#92400e',fontSize:14,margin:0,fontWeight:600}}>⚠️ IMPORTANT: Please read these Terms carefully before using Deemona Teams. By creating an account or using this platform, you agree to be legally bound by these Terms in their entirety.</p>
          </div>

          {[
            {
              title: '1. Acceptance of Terms',
              content: `By accessing, registering for, or using Deemona Teams ("the Platform", "the Service"), you ("User", "you", "your") acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions ("Terms"), our Privacy Policy, and our Acceptable Use Policy, all of which are incorporated herein by reference.

If you are using the Platform on behalf of an organisation, you represent and warrant that you have the authority to bind that organisation to these Terms. If you do not agree to these Terms, you must immediately cease all use of the Platform.

These Terms constitute a legally binding agreement between you and Deemona Technologies Pvt. Ltd., a company incorporated under the Companies Act, 2013, with its registered office in Delhi, India ("Company", "we", "us", "our").`
            },
            {
              title: '2. Description of Service',
              content: `Deemona Teams is a business collaboration and communication platform that provides messaging, task management, video conferencing, file sharing, and productivity tools for teams and organisations. The Platform is provided "as is" and "as available" for lawful business and personal productivity purposes only.

The Company reserves the right to modify, suspend, or discontinue any feature or the entire Service at any time, with or without notice, at its sole discretion.`
            },
            {
              title: '3. DISCLAIMER OF LIABILITY — FINANCIAL LOSSES',
              content: `3.1 NO FINANCIAL LIABILITY: TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, DEEMONA TECHNOLOGIES PVT. LTD., ITS DIRECTORS, OFFICERS, EMPLOYEES, SHAREHOLDERS, AGENTS, PARTNERS, AFFILIATES, AND LICENSORS SHALL NOT BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, PUNITIVE, OR ANY OTHER DAMAGES OF ANY KIND, INCLUDING BUT NOT LIMITED TO:

(a) LOSS OF REVENUE, PROFITS, INCOME, OR BUSINESS OPPORTUNITIES;
(b) FINANCIAL LOSSES ARISING FROM BUSINESS DECISIONS MADE USING THE PLATFORM;
(c) LOSS OF DATA, INFORMATION, OR BUSINESS RECORDS;
(d) LOSS OF GOODWILL OR BUSINESS REPUTATION;
(e) COSTS OF PROCUREMENT OF SUBSTITUTE SERVICES;
(f) ANY LOSSES RESULTING FROM DOWNTIME, SERVICE INTERRUPTIONS, OR TECHNICAL FAILURES;
(g) LOSSES ARISING FROM UNAUTHORISED ACCESS TO OR ALTERATION OF YOUR TRANSMISSIONS OR DATA;
(h) ANY OTHER LOSSES ARISING FROM YOUR USE OF OR INABILITY TO USE THE SERVICE.

3.2 THIS LIMITATION OF LIABILITY APPLIES REGARDLESS OF THE LEGAL THEORY ON WHICH THE CLAIM IS BASED, INCLUDING CONTRACT, TORT (INCLUDING NEGLIGENCE), STRICT LIABILITY, OR ANY OTHER BASIS, EVEN IF THE COMPANY HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.

3.3 NO LEGAL ACTION PERMITTED FOR FINANCIAL LOSS: By using this Platform, you expressly waive your right to bring any claim, legal action, lawsuit, arbitration, or proceeding of any kind against Deemona Technologies Pvt. Ltd. or any of its officers, directors, employees, or agents in connection with any financial loss, business loss, or economic damage that you may suffer as a result of using or being unable to use this Platform.

3.4 MAXIMUM AGGREGATE LIABILITY: In all events, the Company's maximum aggregate liability for any claims arising out of or related to these Terms or the Service shall not exceed the total amount paid by you to the Company in the three (3) months immediately preceding the event giving rise to the claim, or INR 1,000 (Indian Rupees One Thousand), whichever is lower.

3.5 FINANCIAL TOOL DISCLAIMER: Any GST invoice generators, UPI payment tools, TDS calculators, or financial features provided within the Platform are for informational and convenience purposes only. They do not constitute financial, legal, tax, or accounting advice. You must independently verify all calculations with a qualified Chartered Accountant or financial advisor. The Company accepts no liability for any errors in calculations or any financial consequences arising from their use.`
            },
            {
              title: '4. Limitation on Legal Actions',
              content: `4.1 NO COMPLAINTS OR LEGAL PROCEEDINGS: By accepting these Terms, you unconditionally agree that you shall not file any complaint, grievance, legal notice, lawsuit, arbitration demand, or any other legal or quasi-legal proceeding against Deemona Technologies Pvt. Ltd., its directors, officers, employees, agents, or affiliates in connection with:

(a) Any financial loss or economic damage, direct or indirect;
(b) Loss of business opportunity or profit;
(c) Service downtime or technical interruptions;
(d) Data loss or data breach (subject to applicable law);
(e) Dissatisfaction with the Platform's features or performance.

4.2 INDEMNIFICATION: You agree to indemnify, defend, and hold harmless Deemona Technologies Pvt. Ltd. and its officers, directors, employees, agents, licensors, and service providers from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising out of or relating to your violation of these Terms or your use of the Platform.

4.3 DISPUTE RESOLUTION: Any disputes arising from these Terms shall first be resolved through good-faith negotiation. If unresolved within 30 days, disputes shall be submitted to binding arbitration in New Delhi, India, under the Arbitration and Conciliation Act, 1996. The arbitration shall be conducted in English before a sole arbitrator. The decision of the arbitrator shall be final and binding.

4.4 JURISDICTION: These Terms shall be governed by and construed in accordance with the laws of India. Subject to the arbitration clause above, the courts of New Delhi, India shall have exclusive jurisdiction over any disputes.

4.5 TIME LIMITATION: Any claim arising out of or related to these Terms must be filed within one (1) year after the cause of action arose, failing which the claim is permanently barred.`
            },
            {
              title: '5. User Accounts and Responsibilities',
              content: `5.1 You are solely responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.

5.2 You must immediately notify us of any unauthorised use of your account or any other security breach.

5.3 You are responsible for ensuring that your use of the Platform complies with all applicable laws and regulations, including but not limited to the Information Technology Act, 2000, the Digital Personal Data Protection Act, 2023, and all other applicable Indian laws.

5.4 You must not use the Platform for any unlawful purpose or in any manner that could damage, disable, overburden, or impair the Platform.`
            },
            {
              title: '6. Acceptable Use Policy',
              content: `You agree not to use the Platform to:
(a) Transmit any content that is unlawful, defamatory, obscene, pornographic, or offensive;
(b) Infringe any intellectual property rights of any third party;
(c) Transmit unsolicited commercial messages (spam);
(d) Introduce viruses, malware, or other harmful code;
(e) Engage in any form of harassment, bullying, or discrimination;
(f) Attempt to gain unauthorised access to any part of the Platform;
(g) Conduct any fraudulent activity or misrepresent your identity;
(h) Violate any applicable law or regulation.`
            },
            {
              title: '7. Intellectual Property',
              content: `7.1 COPYRIGHT: All content, features, and functionality of the Platform, including but not limited to text, graphics, logos, button icons, images, audio clips, digital downloads, data compilations, and software, are the exclusive property of Deemona Technologies Pvt. Ltd. and are protected by Indian and international copyright, trademark, patent, trade secret, and other intellectual property laws.

7.2 TRADEMARK: "Deemona Teams", "Deemona Technologies", and all related logos are trademarks of Deemona Technologies Pvt. Ltd. You may not use these marks without prior written consent.

7.3 USER CONTENT: You retain ownership of content you create on the Platform. By uploading content, you grant the Company a worldwide, non-exclusive, royalty-free licence to use, reproduce, and display such content solely for the purpose of providing the Service.

7.4 COPYRIGHT INFRINGEMENT CLAIMS: If you believe your copyright has been infringed on the Platform, please contact legal@deemona.com with full details of the alleged infringement.`
            },
            {
              title: '8. Data Protection and Privacy',
              content: `8.1 The Company processes personal data in accordance with its Privacy Policy, which is incorporated into these Terms by reference.

8.2 The Platform complies with the Digital Personal Data Protection Act, 2023 (DPDP Act). By using the Platform, you consent to the collection and processing of your personal data as described in the Privacy Policy.

8.3 You have the right to access, rectify, and erase your personal data. To exercise these rights, contact privacy@deemona.com.

8.4 The Company implements industry-standard security measures to protect your data, but cannot guarantee absolute security. You acknowledge that data transmission over the internet carries inherent risks.`
            },
            {
              title: '9. Third-Party Services',
              content: `The Platform integrates with third-party services (including but not limited to Twilio for WhatsApp, LiveKit for video, Cloudflare R2 for storage, Resend for email). The Company is not responsible for the availability, accuracy, or content of these third-party services. Your use of such services is subject to their respective terms and privacy policies.`
            },
            {
              title: '10. Service Availability and Modifications',
              content: `10.1 The Company does not guarantee that the Platform will be available at all times. We may experience downtime for maintenance, upgrades, or due to factors beyond our control.

10.2 The Company reserves the right to modify, suspend, or terminate the Service or any user account at any time without prior notice and without liability.

10.3 We reserve the right to update these Terms at any time. Your continued use of the Platform after changes are posted constitutes acceptance of the modified Terms.`
            },
            {
              title: '11. Termination',
              content: `11.1 You may terminate your account at any time by contacting support@deemona.com.

11.2 The Company may terminate or suspend your account immediately, without prior notice or liability, if you breach these Terms.

11.3 Upon termination, your right to use the Platform ceases immediately. Provisions of these Terms that by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, indemnity, and limitations of liability.`
            },
            {
              title: '12. Entire Agreement',
              content: `These Terms, together with the Privacy Policy and Acceptable Use Policy, constitute the entire agreement between you and the Company regarding the Platform and supersede all prior agreements and understandings. If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full force and effect.`
            },
            {
              title: '13. Contact Information',
              content: `For questions about these Terms, please contact:

Deemona Technologies Pvt. Ltd.
Delhi, India
Email: legal@deemona.com
Support: support@deemona.com
Privacy: privacy@deemona.com`
            },
          ].map((section, i) => (
            <div key={i} style={{marginBottom:32}}>
              <h2 style={{fontSize:18,fontWeight:700,color:'#111827',marginBottom:12,paddingBottom:8,borderBottom:'1px solid #f3f4f6'}}>{section.title}</h2>
              <div style={{fontSize:15,color:'#374151',lineHeight:1.8,whiteSpace:'pre-line'}}>{section.content}</div>
            </div>
          ))}

          <div style={{background:'#f0fdf4',border:'1px solid #86efac',borderRadius:8,padding:16,marginTop:32}}>
            <p style={{color:'#166534',fontSize:14,margin:0,fontWeight:600}}>✓ By clicking "I Agree" or creating an account, you confirm that you have read, understood, and agree to these Terms and Conditions in full.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
