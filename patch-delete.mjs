import fs from 'fs';
import path from 'path';

function patchDelete(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  code = code.replace(/export async function DELETE\(\{ url \}\) \{/g, 'export async function DELETE({ request, url }) {');
  fs.writeFileSync(filePath, code);
}

patchDelete(path.join('src', 'pages', 'api', 'items.js'));
patchDelete(path.join('src', 'pages', 'api', 'history.js'));
patchDelete(path.join('src', 'pages', 'api', 'templates.js'));
