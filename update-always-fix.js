const fs = require('fs');
let c = fs.readFileSync('always-fix.js', 'utf8');
const extraFix = 
// Remove duplicate poll/whiteboard state from main component (lines 119-127)
const ws2 = c.split('\n');
const toRemove = ['polls,','showPollCreate,','pollQuestion,','pollOptions,','showWhiteboard,','activeMeetingId,'];
let removed = 0;
const cleaned = ws2.filter((line, i) => {
  if(i > 150) return true;
  const isDup = toRemove.some(name => line.includes('const [' + name));
  if(isDup) removed++;
  return !isDup;
});
if(removed > 0) { c = cleaned.join('\n'); }
;
// Insert before the writeFileSync
c = c.replace("fs.writeFileSync('components/WorkspaceShell.tsx', c);", extraFix + "\nfs.writeFileSync('components/WorkspaceShell.tsx', c);");
fs.writeFileSync('always-fix.js', c);
console.log('Updated always-fix.js');
