const fs = require('fs');
const lines = fs.readFileSync('components/WorkspaceShell.tsx', 'utf8').split('\n');
const seen = new Set();
const result = lines.filter((line, i) => {
  const m = line.match(/const \[(\w+),/);
  const r = line.match(/const (\w+)\s*=/);
  const name = m ? m[1] : (r ? r[1] : null);
  if (name && (name.includes('uploading') || name.includes('fileInputRef') || name.includes('voiceInputRef'))) {
    if (seen.has(name)) { console.log('Removing duplicate at line', i+1, ':', line.trim()); return false; }
    seen.add(name);
  }
  return true;
});
fs.writeFileSync('components/WorkspaceShell.tsx', result.join('\n'));
console.log('Done');
