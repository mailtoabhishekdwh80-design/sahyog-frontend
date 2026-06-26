const fs = require('fs');
const lines = fs.readFileSync('lib/api.ts', 'utf8').split('\n');
let found = false;
const result = lines.filter((line, i) => {
  if (line.includes('getUploadUrl:') || line.includes('confirmUpload:')) {
    if (!found) { found = true; return true; }
    // Remove the second occurrence and its next line
    return false;
  }
  return true;
});
fs.writeFileSync('lib/api.ts', result.join('\n'));
const c = (fs.readFileSync('lib/api.ts','utf8').match(/getUploadUrl/g)||[]).length;
console.log('getUploadUrl count:', c);
