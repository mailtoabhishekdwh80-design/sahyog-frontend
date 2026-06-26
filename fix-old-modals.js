const fs = require('fs');
let content = fs.readFileSync('components/WorkspaceShell.tsx', 'utf8');
// Remove the old Meeting polls modal block from main component
const start = content.indexOf('      {/* Meeting polls modal */}');
const end = content.indexOf('      {/* Whiteboard modal */}');
if(start > 0 && end > start) {
  content = content.slice(0, start) + content.slice(end);
  console.log('Removed old polls modal');
}
// Remove old whiteboard modal too
const wbStart = content.indexOf('      {/* Whiteboard modal */}');
const wbEnd = content.indexOf('      {/* Analytics modal */}');
if(wbStart > 0 && wbEnd > wbStart) {
  content = content.slice(0, wbStart) + content.slice(wbEnd);
  console.log('Removed old whiteboard modal');
}
fs.writeFileSync('components/WorkspaceShell.tsx', content);
console.log('Done');
