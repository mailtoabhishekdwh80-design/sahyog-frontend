const fs = require('fs');
let content = fs.readFileSync('components/WorkspaceShell.tsx', 'utf8');
const lines = content.split('\n');
// Find and fix lines 768-787 (the broken JSX block)
// Find the line with the broken pattern
let startLine = -1, endLine = -1;
lines.forEach((l, i) => {
  if (l.includes('msg.content?.match') && l.includes('image|file')) startLine = i;
});
if (startLine > 0) {
  // Find the matching closing
  let depth = 0;
  for (let i = startLine; i < Math.min(startLine + 25, lines.length); i++) {
    if (lines[i].includes('formatContent(parseMentions(msg.content))')) { endLine = i + 1; break; }
  }
  if (endLine > 0) {
    const replacement = '                      <p className="text-sm text-gray-300 mt-0.5 break-words leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: formatContent(parseMentions(msg.content)) }} />';
    lines.splice(startLine, endLine - startLine, replacement);
    console.log('Fixed lines', startLine, 'to', endLine);
  }
}
fs.writeFileSync('components/WorkspaceShell.tsx', lines.join('\n'));
console.log('Done. Total lines:', lines.length);
