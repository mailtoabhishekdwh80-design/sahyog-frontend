const fs = require('fs');
const lines = fs.readFileSync('lib/api.ts', 'utf8').split('\n');
console.log('Line 158:', lines[157]);
console.log('Line 159:', lines[158]);
console.log('Line 160:', lines[159]);
