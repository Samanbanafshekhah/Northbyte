import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { createMessaging } from './messaging/api.mjs';
import { laravelRoute,proxyLaravel } from './messaging/laravel-proxy.mjs';
const root = process.cwd();
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml' };
const port = Number(process.env.PORT || 4173);
const messaging = await createMessaging({ origin: process.env.PUBLIC_ORIGIN || `http://127.0.0.1:${port}` });
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if(laravelRoute(url.pathname)){proxyLaravel(req,res);return;}
    if (await messaging.handle(req,res,url)) return;
    const pathname = decodeURIComponent(url.pathname);
    const route = pathname === '/' ? '/index.html' : pathname === '/login' || pathname === '/login/' ? '/login/index.html' : pathname === '/register' || pathname === '/register/' ? '/register/index.html' : pathname === '/dashboard' || pathname.startsWith('/dashboard/') ? '/dashboard/index.html' : pathname;
    const file = resolve(root, `.${route}`);
    if (!['GET','HEAD'].includes(req.method) || !file.startsWith(root + sep) || !types[extname(file)] || /(?:^|\/)(?:private|messaging|backend|tests|\.[^/]*)(?:\/|$)/.test(pathname) || /^\/admin-ui\/.*\.html$/.test(pathname)) {
      res.writeHead(404).end('Not found'); return;
    }
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': `${types[extname(file)]}${extname(file) === '.png' ? '' : '; charset=utf-8'}`, 'Cache-Control': 'no-cache', 'X-Content-Type-Options':'nosniff', 'Referrer-Policy':'same-origin', 'X-Frame-Options':'DENY', 'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net; img-src 'self' blob: data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'" });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch { res.writeHead(404).end('Not found'); }
});
server.requestTimeout = 30000;
server.headersTimeout = 15000;
server.listen(port, process.env.HOST || '127.0.0.1', () => console.log(`NorthByte: http://127.0.0.1:${port}`));
for (const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>{ messaging.close(); server.close(()=>process.exit(0)); });
