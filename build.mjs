import { readFile, writeFile } from 'node:fs/promises';
import { renderSite, escapeHtml } from './render.js';
import { siteConfig } from './site.config.js';
import { content } from './content.js';

const c = content.en;
const title = escapeHtml(`${siteConfig.brand} — ${c.title}`);
const canonical = siteConfig.publicUrl ? `<link rel="canonical" href="${escapeHtml(siteConfig.publicUrl)}"><meta property="og:url" content="${escapeHtml(siteConfig.publicUrl)}">` : '';
// A small classic-script bundle also runs when index.html is opened via file://.
// Sources retain their modules for development and Node tests; no runtime dependencies.
const sources = await Promise.all(['site.config.js', 'content.js', 'render.js', 'motion.js', 'app.js'].map(file => readFile(file, 'utf8')));
const bundle = sources.map(source => source.replace(/^import .+;\r?\n/gm, '').replace(/^export /gm, '')).join('\n');
await writeFile('site.bundle.js', `(() => {\n'use strict';\n${bundle}\n})();\n`);
await writeFile('index.html', `<!doctype html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#0C0D14">
  <title>${title}</title>
  <meta name="description" content="${escapeHtml(c.meta)}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${escapeHtml(c.meta)}">
  <meta property="og:locale" content="en_US">
  ${canonical}
  <link rel="icon" type="image/svg+xml" href="assets/favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="styles.css">
  <script defer src="site.bundle.js"></script>
</head>
<body><div id="site">${renderSite('en')}</div></body>
</html>\n`);
console.log('Built index.html with complete, readable HTML.');
