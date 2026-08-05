import fs from 'fs';
import path from 'path';

// 1. Update src/lib/supabase.js
const supabasePath = path.join('src', 'lib', 'supabase.js');
let supabaseCode = fs.readFileSync(supabasePath, 'utf8');
if (!supabaseCode.includes('getAuthClient')) {
  supabaseCode += `\nexport function getAuthClient(request) {
  const authHeader = request.headers.get('Authorization');
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader || '' } }
  });
}\n`;
  fs.writeFileSync(supabasePath, supabaseCode);
}

// 2. Helper to patch API routes
function patchApiRoute(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  code = code.replace(/import \{ supabase \} from '\.\.\/\.\.\/lib\/supabase';/g, "import { supabase, getAuthClient } from '../../lib/supabase';");
  
  // Replace `const { data, error } = await supabase` with `const { data, error } = await getAuthClient(request)`
  // This is tricky because GET doesn't always have `request`. 
  // Let's modify export async function GET() to GET({ request })
  code = code.replace(/export async function GET\(\) \{/g, 'export async function GET({ request }) {');
  
  // Replace `supabase.from(` with `getAuthClient(request).from(`
  code = code.replace(/supabase\.from/g, 'getAuthClient(request).from');
  code = code.replace(/supabase\.auth/g, 'getAuthClient(request).auth');
  
  fs.writeFileSync(filePath, code);
}

patchApiRoute(path.join('src', 'pages', 'api', 'items.js'));
patchApiRoute(path.join('src', 'pages', 'api', 'history.js'));
patchApiRoute(path.join('src', 'pages', 'api', 'templates.js'));

console.log("Patched API routes");

// 3. Update frontend components to pass Authorization header
// In fetch calls, we need to add the header.
// A simpler way is to patch the global fetch if we can, but let's just patch the components.

function patchFetchInFile(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  
  // We'll inject a helper `authFetch` at the top of the <script> block
  const helper = `
  async function authFetch(url, options = {}) {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const headers = options.headers || {};
    if (token) headers['Authorization'] = \`Bearer \${token}\`;
    return fetch(url, { ...options, headers });
  }
  `;
  
  // Replace `fetch(` with `authFetch(`
  if (!code.includes('async function authFetch')) {
    code = code.replace(/<script>/, `<script>\n${helper}`);
    code = code.replace(/await fetch\(/g, 'await authFetch(');
    fs.writeFileSync(filePath, code);
  }
}

patchFetchInFile(path.join('src', 'components', 'ShoppingList.astro'));
patchFetchInFile(path.join('src', 'components', 'AddItemForm.astro'));
patchFetchInFile(path.join('src', 'components', 'BudgetBar.astro'));
patchFetchInFile(path.join('src', 'components', 'HistoryManager.astro'));
patchFetchInFile(path.join('src', 'components', 'TemplateManager.astro'));

console.log("Patched frontend components");
