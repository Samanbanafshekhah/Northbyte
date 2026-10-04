import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = process.cwd();
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml' };
http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const route = pathname === '/' ? '/index.html' : pathname === '/login' || pathname === '/login/' ? '/login/index.html' : pathname === '/register' || pathname === '/register/' ? '/register/index.html' : pathname === '/dashboard' || pathname.startsWith('/dashboard/') ? '/dashboard/index.html' : pathname;
    const file = resolve(root, `.${route}`);
    if (!file.startsWith(root + sep) || !types[extname(file)]) {
      res.writeHead(404).end('Not found'); return;
    }
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': `${types[extname(file)]}${extname(file) === '.png' ? '' : '; charset=utf-8'}`, 'Cache-Control': 'no-cache' });
    res.end(data);
  } catch { res.writeHead(404).end('Not found'); }
}).listen(4173, '127.0.0.1', () => console.log('NorthByte: http://127.0.0.1:4173'));
