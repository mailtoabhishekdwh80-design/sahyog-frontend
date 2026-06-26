const fs = require('fs');
const lines = fs.readFileSync('components/WorkspaceShell.tsx', 'utf8').split('\n');
let found = false;
let removeStart = -1, removeEnd = -1;
// Find first uploadFile and remove it (keep the second/newer one)
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('async function uploadFile') && !found) {
    found = true;
    removeStart = i;
    // Find end of this function
    let braces = 0;
    for (let j = i; j < lines.length; j++) {
      braces += (lines[j].match(/{/g) || []).length;
      braces -= (lines[j].match(/}/g) || []).length;
      if (braces <= 0 && j > i) { removeEnd = j + 1; break; }
    }
    break;
  }
}
console.log('Removing lines', removeStart+1, 'to', removeEnd);
if (removeStart > 0 && removeEnd > 0) {
  lines.splice(removeStart, removeEnd - removeStart);
}
fs.writeFileSync('components/WorkspaceShell.tsx', lines.join('\n'));
console.log('Done');
