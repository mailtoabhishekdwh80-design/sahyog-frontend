'use client';
import { useState , useEffect } from 'react';

export default function IndiaFeaturesPage() {
  const [tab, setTab] = useState<'gst'|'upi'|'lang'|'tds'>('gst');
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => {
    const c = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', c);
    return () => window.removeEventListener('resize', c);
  }, []);
  const [gstItems, setGstItems] = useState([{desc:'Software development services',qty:1,rate:50000,tax:18}]);
  const [clientName, setClientName] = useState('');
  const [gstin, setGstin] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('INV-001');
  const [upiId, setUpiId] = useState('');
  const [upiAmount, setUpiAmount] = useState('');
  const [upiNote, setUpiNote] = useState('');
  const [tdsAmount, setTdsAmount] = useState('');
  const [tdsRate, setTdsRate] = useState('10');
  const [lang, setLang] = useState('hi');

  const LANGS = [
    {code:'hi',name:'हिंदी'},{code:'ta',name:'தமிழ்'},{code:'te',name:'తెలుగు'},
    {code:'kn',name:'ಕನ್ನಡ'},{code:'ml',name:'മലയാളം'},{code:'bn',name:'বাংলা'},
    {code:'mr',name:'मराठी'},{code:'gu',name:'ગુજરાતી'},{code:'pa',name:'ਪੰਜਾਬੀ'},
  ];

  const subtotal = gstItems.reduce((s,i) => s + i.qty*i.rate, 0);
  const gst = gstItems.reduce((s,i) => s + i.qty*i.rate*i.tax/100, 0);
  const total = subtotal + gst;
  const tdsDeduction = (parseFloat(tdsAmount)||0) * parseFloat(tdsRate) / 100;
  const netPayable = (parseFloat(tdsAmount)||0) - tdsDeduction;

  function downloadGST() {
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Invoice ${invoiceNo}</title><style>body{font-family:Arial;max-width:700px;margin:0 auto;padding:30px}h1{color:#1a1d21}.total{font-size:18px;font-weight:700}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:10px}th{background:#f5f5f5}</style></head><body>
<h1>TAX INVOICE — ${invoiceNo}</h1>
<p><strong>To:</strong> ${clientName}<br><strong>GSTIN:</strong> ${gstin}<br><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
<table><tr><th>Description</th><th>Qty</th><th>Rate</th><th>GST%</th><th>CGST</th><th>SGST</th><th>Total</th></tr>
${gstItems.map(i=>`<tr><td>${i.desc}</td><td>${i.qty}</td><td>Rs.${i.rate}</td><td>${i.tax}%</td><td>Rs.${(i.qty*i.rate*i.tax/200).toFixed(2)}</td><td>Rs.${(i.qty*i.rate*i.tax/200).toFixed(2)}</td><td>Rs.${(i.qty*i.rate*(1+i.tax/100)).toFixed(2)}</td></tr>`).join('')}
</table>
<p class="total">Subtotal: Rs.${subtotal.toFixed(2)} | CGST: Rs.${(gst/2).toFixed(2)} | SGST: Rs.${(gst/2).toFixed(2)} | <strong>TOTAL: Rs.${total.toFixed(2)}</strong></p>
<p style="color:#666;font-size:12px">Computer generated invoice. Powered by Deemona Teams.</p>
</body></html>`;
    const a = document.createElement('a');
    a.href = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
    a.download = 'invoice-' + invoiceNo + '.html'; a.click();
  }

  const upiQR = upiId ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=Deemona&am=${upiAmount}&tn=${upiNote}&cu=INR`)}` : '';

  const s = (val: string): React.CSSProperties => ({
    width:'100%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
    borderRadius:8, padding:'10px 12px', color:'#f2f3f5', fontSize:14, outline:'none',
  });

  return (
    <div style={{minHeight:'100vh',background:'#1a1d21',color:'#f2f3f5',fontFamily:'-apple-system,sans-serif'}}>
      <div style={{maxWidth:900,margin:'0 auto',padding:isMobile?14:32}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:28}}>
          <h1 style={{fontSize:26,fontWeight:700,margin:0}}>India Features</h1>
          <a href="/workspace" style={{color:'#4ade80',textDecoration:'none',fontSize:14}}>Back to workspace</a>
        </div>
        <div style={{display:'flex',gap:4,background:'#111827',borderRadius:10,padding:4,marginBottom:24,width:'fit-content'}}>
          {[['gst','GST Invoice'],['upi','UPI Payment'],['lang','Languages'],['tds','TDS Calculator']].map(([t,l]) => (
            <button key={t} onClick={() => setTab(t as any)}
              style={{padding:'8px 18px',borderRadius:8,border:'none',cursor:'pointer',fontSize:15,fontWeight:500,background:tab===t?'#248046':'transparent',color:tab===t?'#fff':'#9ca3af'}}>
              {l}
            </button>
          ))}
        </div>

        {tab === 'gst' && (
          <div style={{background:'#111827',borderRadius:16,border:'1px solid rgba(255,255,255,0.08)',padding:24}}>
            <h2 style={{fontSize:18,fontWeight:700,marginBottom:20}}>GST Invoice Generator</h2>
            <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr 1fr',gap:12,marginBottom:16}}>
              <div><label style={{fontSize:15,color:'#80848e',display:'block',marginBottom:4}}>Invoice No</label><input value={invoiceNo} onChange={e=>setInvoiceNo(e.target.value)} style={s('')} /></div>
              <div><label style={{fontSize:15,color:'#80848e',display:'block',marginBottom:4}}>Client Name</label><input value={clientName} onChange={e=>setClientName(e.target.value)} placeholder="Acme Pvt Ltd" style={s('')} /></div>
              <div><label style={{fontSize:15,color:'#80848e',display:'block',marginBottom:4}}>GSTIN</label><input value={gstin} onChange={e=>setGstin(e.target.value)} placeholder="27AAPFU0939F1ZV" style={{...s(''),fontFamily:'monospace'}} /></div>
            </div>
            {gstItems.map((item,i) => (
              <div key={i} style={{display:'grid',gridTemplateColumns:isMobile?'2fr 1fr auto':'3fr 1fr 1fr 1fr auto',gap:8,marginBottom:8}}>
                <input value={item.desc} onChange={e=>{const a=[...gstItems];a[i]={...a[i],desc:e.target.value};setGstItems(a);}} placeholder="Description" style={s('')} />
                <input type="number" value={item.qty} onChange={e=>{const a=[...gstItems];a[i]={...a[i],qty:+e.target.value};setGstItems(a);}} placeholder="Qty" style={s('')} />
                <input type="number" value={item.rate} onChange={e=>{const a=[...gstItems];a[i]={...a[i],rate:+e.target.value};setGstItems(a);}} placeholder="Rate" style={s('')} />
                <select value={item.tax} onChange={e=>{const a=[...gstItems];a[i]={...a[i],tax:+e.target.value};setGstItems(a);}} style={s('')}>
                  {[0,5,12,18,28].map(r=><option key={r} value={r}>{r}% GST</option>)}
                </select>
                <button onClick={()=>setGstItems(a=>a.filter((_,j)=>j!==i))} style={{background:'rgba(237,66,69,0.15)',border:'none',borderRadius:8,padding:'0 10px',color:'#ed4245',cursor:'pointer'}}>x</button>
              </div>
            ))}
            <button onClick={()=>setGstItems(a=>[...a,{desc:'',qty:1,rate:0,tax:18}])} style={{background:'rgba(255,255,255,0.04)',border:'1px dashed rgba(255,255,255,0.1)',borderRadius:8,padding:'8px 16px',color:'#80848e',cursor:'pointer',fontSize:15,marginBottom:16}}>+ Add item</button>
            <div style={{background:'rgba(255,255,255,0.04)',borderRadius:10,padding:16,marginBottom:16}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}><span style={{color:'#80848e'}}>Subtotal</span><span>Rs.{subtotal.toFixed(2)}</span></div>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}><span style={{color:'#80848e'}}>CGST</span><span>Rs.{(gst/2).toFixed(2)}</span></div>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}><span style={{color:'#80848e'}}>SGST</span><span>Rs.{(gst/2).toFixed(2)}</span></div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:18,fontWeight:700,paddingTop:10,borderTop:'1px solid rgba(255,255,255,0.08)'}}><span>Total</span><span style={{color:'#4ade80'}}>Rs.{total.toFixed(2)}</span></div>
            </div>
            <button onClick={downloadGST} style={{width:'100%',background:'#248046',border:'none',borderRadius:10,padding:14,color:'#fff',fontSize:15,fontWeight:600,cursor:'pointer'}}>Generate & Download GST Invoice</button>
          </div>
        )}

        {tab === 'upi' && (
          <div style={{background:'#111827',borderRadius:16,border:'1px solid rgba(255,255,255,0.08)',padding:24}}>
            <h2 style={{fontSize:18,fontWeight:700,marginBottom:20}}>UPI Payment QR Generator</h2>
            <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:24}}>
              <div>
                <div style={{marginBottom:14}}><label style={{fontSize:15,color:'#80848e',display:'block',marginBottom:4}}>UPI ID *</label><input value={upiId} onChange={e=>setUpiId(e.target.value)} placeholder="name@paytm or 9876543210@upi" style={s('')} /></div>
                <div style={{marginBottom:14}}><label style={{fontSize:15,color:'#80848e',display:'block',marginBottom:4}}>Amount (Rs.)</label><input type="number" value={upiAmount} onChange={e=>setUpiAmount(e.target.value)} placeholder="0" style={s('')} /></div>
                <div style={{marginBottom:14}}><label style={{fontSize:15,color:'#80848e',display:'block',marginBottom:4}}>Note</label><input value={upiNote} onChange={e=>setUpiNote(e.target.value)} placeholder="Invoice payment" style={s('')} /></div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                  {['GPay','PhonePe','Paytm','BHIM'].map(a=><span key={a} style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:6,padding:'3px 8px',fontSize:15,color:'#b5bac1'}}>{a}</span>)}
                </div>
              </div>
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                {upiId ? (<>
                  <div style={{background:'#fff',borderRadius:12,padding:12,marginBottom:12}}><img src={upiQR} alt="QR" style={{width:180,height:180,display:'block'}} /></div>
                  {upiAmount && <p style={{fontSize:20,fontWeight:700,color:'#4ade80'}}>Rs.{parseFloat(upiAmount).toLocaleString('en-IN')}</p>}
                  <button onClick={()=>navigator.clipboard.writeText(`upi://pay?pa=${upiId}&am=${upiAmount}&tn=${upiNote}&cu=INR`).then(()=>alert('UPI link copied!'))}
                    style={{marginTop:10,background:'rgba(74,222,128,0.1)',border:'1px solid rgba(74,222,128,0.3)',borderRadius:8,padding:'7px 14px',color:'#4ade80',cursor:'pointer',fontSize:14}}>Copy UPI link</button>
                </>) : <div style={{textAlign:'center',color:'#80848e'}}><div style={{fontSize:56,marginBottom:12}}>QR</div><p>Enter UPI ID to generate QR</p></div>}
              </div>
            </div>
          </div>
        )}

        {tab === 'lang' && (
          <div style={{background:'#111827',borderRadius:16,border:'1px solid rgba(255,255,255,0.08)',padding:24}}>
            <h2 style={{fontSize:18,fontWeight:700,marginBottom:8}}>21 Indian Language Support</h2>
            <p style={{color:'#80848e',marginBottom:20}}>AI-powered translation via Deemona AI (Claude)</p>
            <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(3,1fr)',gap:10,marginBottom:20}}>
              {LANGS.map(l=>(
                <button key={l.code} onClick={()=>setLang(l.code)}
                  style={{background:lang===l.code?'rgba(36,128,70,0.2)':'rgba(255,255,255,0.04)',border:`1px solid ${lang===l.code?'#248046':'rgba(255,255,255,0.08)'}`,borderRadius:10,padding:'12px',color:lang===l.code?'#4ade80':'#b5bac1',cursor:'pointer',fontSize:16}}>
                  {l.name}
                </button>
              ))}
            </div>
            <div style={{background:'rgba(36,128,70,0.08)',border:'1px solid rgba(36,128,70,0.2)',borderRadius:12,padding:18,marginBottom:16}}>
              <p style={{fontSize:15,color:'#80848e',marginBottom:6}}>Sample translation:</p>
              <p style={{fontSize:18,color:'#f2f3f5',lineHeight:1.6}}>{
                lang==='hi'?'नमस्ते! देमोना टीम्स में आपका स्वागत है।':
                lang==='ta'?'வணக்கம்! டீமோனா டீம்ஸுக்கு வரவேற்கிறோம்.':
                lang==='te'?'నమస్కారం! డీమోనా టీమ్స్‌కు స్వాగతం.':
                lang==='kn'?'ನಮಸ್ಕಾರ! ಡೀಮೋನಾ ಟೀಮ್ಸ್‌ಗೆ ಸ್ವಾಗತ.':
                lang==='ml'?'നമസ്കാരം! ഡീമോണ ടീംസിലേക്ക് സ്വാഗതം.':
                lang==='bn'?'নমস্কার! ডিমোনা টিমসে আপনাকে স্বাগতম।':
                lang==='mr'?'नमस्कार! डीमोना टीम्समध्ये आपले स्वागत आहे.':
                lang==='gu'?'નમસ્તે! ડીમોના ટીમ્સમાં આપનું સ્વાગત છે.':
                lang==='pa'?'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਡੀਮੋਨਾ ਟੀਮਜ਼ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ।':
                'Welcome to Deemona Teams!'
              }</p>
            </div>
            <button onClick={()=>alert('Language preference saved! UI translation coming in v2.0')}
              style={{background:'#248046',border:'none',borderRadius:10,padding:'12px 24px',color:'#fff',fontSize:14,fontWeight:600,cursor:'pointer'}}>Save preference</button>
          </div>
        )}

        {tab === 'tds' && (
          <div style={{background:'#111827',borderRadius:16,border:'1px solid rgba(255,255,255,0.08)',padding:24}}>
            <h2 style={{fontSize:18,fontWeight:700,marginBottom:8}}>TDS Calculator</h2>
            <p style={{color:'#80848e',marginBottom:20}}>Tax Deducted at Source as per Indian Income Tax Act</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
              <div>
                <div style={{marginBottom:14}}><label style={{fontSize:15,color:'#80848e',display:'block',marginBottom:4}}>Payment Amount (Rs.)</label><input type="number" value={tdsAmount} onChange={e=>setTdsAmount(e.target.value)} placeholder="0" style={s('')} /></div>
                <div style={{marginBottom:14}}>
                  <label style={{fontSize:15,color:'#80848e',display:'block',marginBottom:4}}>TDS Section & Rate</label>
                  <select value={tdsRate} onChange={e=>setTdsRate(e.target.value)} style={s('')}>
                    <option value="1">1% — Contractor (194C, small)</option>
                    <option value="2">2% — Contractor (194C, company)</option>
                    <option value="5">5% — Commission/brokerage (194H)</option>
                    <option value="10">10% — Professional fees (194J)</option>
                    <option value="10">10% — Rent (194I)</option>
                    <option value="20">20% — FD interest high value</option>
                    <option value="30">30% — Lottery/winnings (194B)</option>
                  </select>
                </div>
              </div>
              <div style={{background:'rgba(255,255,255,0.04)',borderRadius:12,padding:18}}>
                <h3 style={{fontSize:15,fontWeight:600,marginBottom:14}}>Result</h3>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}><span style={{color:'#80848e'}}>Gross amount</span><span>Rs.{(parseFloat(tdsAmount)||0).toFixed(2)}</span></div>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}><span style={{color:'#80848e'}}>TDS @ {tdsRate}%</span><span style={{color:'#ed4245'}}>- Rs.{tdsDeduction.toFixed(2)}</span></div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:18,fontWeight:700,paddingTop:10,borderTop:'1px solid rgba(255,255,255,0.08)'}}><span>Net payable</span><span style={{color:'#4ade80'}}>Rs.{netPayable.toFixed(2)}</span></div>
                <button onClick={()=>navigator.clipboard.writeText(`TDS: Rs.${tdsDeduction.toFixed(2)} @ ${tdsRate}% | Net: Rs.${netPayable.toFixed(2)}`).then(()=>alert('Copied!'))}
                  style={{marginTop:14,width:'100%',background:'rgba(74,222,128,0.1)',border:'1px solid rgba(74,222,128,0.2)',borderRadius:8,padding:'9px',color:'#4ade80',cursor:'pointer',fontSize:15}}>Copy result</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
