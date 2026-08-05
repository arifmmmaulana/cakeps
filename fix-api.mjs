import fs from 'fs';
import path from 'path';

function fixSupabaseClient(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  // Replace `await supabase` with `await getAuthClient(request)` everywhere in API routes
  code = code.replace(/await supabase/g, 'await getAuthClient(request)');
  fs.writeFileSync(filePath, code);
}

fixSupabaseClient(path.join('src', 'pages', 'api', 'items.js'));
fixSupabaseClient(path.join('src', 'pages', 'api', 'history.js'));
fixSupabaseClient(path.join('src', 'pages', 'api', 'templates.js'));
