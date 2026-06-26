const fs = require('fs');
let content = fs.readFileSync('components/WorkspaceShell.tsx', 'utf8');
const OLD = '        {/* User footer */}\n        <div className="px-3 py-2 border-t border-gray-800">\n          <button onClick={() => { api.logout(); window.location.href = \'/login\'; }}';
const NEW = '        {/* User footer */}\n        <div className="px-3 py-2 border-t border-gray-800 space-y-1">\n          <div className="flex gap-1 mb-1">\n            <button onClick={() => setShowStatus(true)} className="flex-1 text-xs px-2 py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 flex items-center gap-1"><span>{user?.status_emoji || \'??\'}</span><span className="truncate">{user?.status_text || \'Status\'}</span></button>\n            <button onClick={loadBookmarks} className="text-xs px-2 py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300">??</button>\n            <button onClick={loadChannelBrowser} className="text-xs px-2 py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300">??</button>\n          </div>\n          <button onClick={() => { api.logout(); window.location.href = \'/login\'; }}';
const result = content.replace(OLD, NEW);
fs.writeFileSync('components/WorkspaceShell.tsx', result);
console.log('Replaced:', content !== result);
