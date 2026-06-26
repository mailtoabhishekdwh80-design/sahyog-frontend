const fs = require('fs');
let content = fs.readFileSync('lib/api.ts', 'utf8');
// Remove old createDM (the one near dmChannels)
content = content.replace("  dmChannels:  () => apiFetch('/channels?type=direct'),\n  createDM:    (userId: string) =>\n    apiFetch('/channels/dm', { method: 'POST', body: JSON.stringify({ userId }) }),\n\n  // Channel management", "  // Channel management");
fs.writeFileSync('lib/api.ts', content);
const c = (content.match(/createDM/g) || []).length;
console.log('createDM count after fix:', c);
