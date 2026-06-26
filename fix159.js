const fs = require('fs');
const lines = fs.readFileSync('lib/api.ts', 'utf8').split('\n');
lines.splice(158, 1);
fs.writeFileSync('lib/api.ts', lines.join('\n'));
console.log('Line 158 now:', lines[157]);
console.log('Line 159 now:', lines[158]);
