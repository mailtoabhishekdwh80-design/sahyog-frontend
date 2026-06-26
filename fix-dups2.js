const fs = require('fs');
const lines = fs.readFileSync('components/WorkspaceShell.tsx', 'utf8').split('\n');
const seen = new Set();
const result = lines.filter(line => {
  const m = line.match(/const \[(\w+),/);
  if (m) {
    if (seen.has(m[1])) { console.log('Removing dup:', m[1]); return false; }
    seen.add(m[1]);
  }
  return true;
});
fs.writeFileSync('components/WorkspaceShell.tsx', result.join('\n'));
console.log('Done');
