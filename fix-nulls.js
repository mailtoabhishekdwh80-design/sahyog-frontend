const fs = require('fs');
let buf = fs.readFileSync('components/WorkspaceShell.tsx');
// Remove null bytes
let clean = buf.toString('utf8').replace(/\0/g, '').replace(/\/\/ fixed\s*$/m, '').trimEnd() + '\n';
fs.writeFileSync('components/WorkspaceShell.tsx', clean, 'utf8');
const lines = clean.split('\n');
console.log('Last 3 lines:', lines.slice(-4).join(' | '));
