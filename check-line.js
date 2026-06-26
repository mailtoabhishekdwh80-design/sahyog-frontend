const fs = require('fs');
const lines = fs.readFileSync('components/WorkspaceShell.tsx', 'utf8').split('\n');
// Line 772 (index 771) has extra )}
console.log('Line 770:', lines[769]);
console.log('Line 771:', lines[770]);
console.log('Line 772:', lines[771]);
console.log('Line 773:', lines[772]);
