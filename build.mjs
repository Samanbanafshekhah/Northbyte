import { mkdir, readFile, writeFile } from 'node:fs/promises';
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
await mkdir('login', { recursive: true });
await writeFile('login/index.html', `<!doctype html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#0C0D14">
  <title>${escapeHtml(siteConfig.brand)} — Client login</title>
  <meta name="description" content="Sign in to your ${escapeHtml(siteConfig.brand)} workspace.">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="/styles.css">
  <link rel="stylesheet" href="/login.css">
  <script type="module" defer src="/login.js"></script>
</head>
<body class="login-page">
  <a class="skip-link" href="#login-form">Skip to sign in</a>
  <header class="login-header">
    <a class="brand login-brand" href="/" aria-label="${escapeHtml(siteConfig.brand)} home"><img class="brand-mark" src="/assets/northbyte-mark.svg" width="38" height="38" alt=""><b dir="ltr">${escapeHtml(siteConfig.brand)}</b></a>
    <div class="login-header-actions"><button class="language-switch login-language" type="button" data-login-language aria-label="Switch to Persian"><span aria-hidden="true">◎</span><span>فارسی</span></button><a class="login-home" href="/"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13 8H3m5-5L3 8l5 5"/></svg><span data-copy="back">Back to website</span></a></div>
  </header>
  <main class="login-shell">
    <section class="login-story" aria-labelledby="login-story-title">
      <div class="login-network" aria-hidden="true">
        <svg viewBox="0 0 760 680" preserveAspectRatio="xMidYMid slice">
          <g class="network-lines"><path d="M36 136 188 80 336 186 502 104 712 176"/><path d="M84 410 232 318 390 424 566 322 728 444"/><path d="M188 80 232 318M336 186l54 238m112-320 64 218M84 410l104 154 202-140 168 156"/></g>
          <g class="network-nodes"><circle cx="188" cy="80" r="4"/><circle cx="336" cy="186" r="4"/><circle cx="502" cy="104" r="4"/><circle cx="232" cy="318" r="4"/><circle cx="390" cy="424" r="4"/><circle cx="566" cy="322" r="4"/><circle cx="188" cy="564" r="4"/><circle cx="558" cy="580" r="4"/></g>
          <g class="network-packets"><circle cx="188" cy="80" r="3"/><circle cx="232" cy="318" r="3"/><circle cx="390" cy="424" r="3"/></g>
        </svg>
        <span class="network-label label-api">API / 200</span><span class="network-label label-deploy">DEPLOY / READY</span><span class="network-label label-node">NODE / 04</span>
      </div>
      <div class="story-copy">
        <p class="eyebrow"><span class="live-dot"></span><span data-copy="eyebrow">NORTHBYTE WORKSPACE</span></p>
        <h1 id="login-story-title"><span data-copy="build">Build.</span> <span data-copy="deploy">Deploy.</span><br><em data-copy="scale">Scale.</em></h1>
        <p data-copy="story">Engineering modern digital products from interface to infrastructure.</p>
        <div class="login-disciplines" aria-label="Engineering disciplines"><span>WEB APPS</span><span>BACKEND</span><span>DEVOPS</span><span>CLOUD</span><span>AUTOMATION</span></div>
      </div>
    </section>
    <section class="login-panel" aria-labelledby="login-title">
      <div class="login-glow" aria-hidden="true"></div>
      <div class="login-card" data-login-card>
        <div class="login-card-mark"><img src="/assets/northbyte-mark.svg" width="44" height="44" alt=""><span><b dir="ltr">${escapeHtml(siteConfig.brand)}</b><small data-copy="portal">CLIENT PORTAL</small></span></div>
        <div class="login-heading"><p class="login-kicker" data-copy="secure">SECURE WORKSPACE ACCESS</p><h2 id="login-title" data-copy="welcome">Welcome back</h2><p data-copy="intro">Sign in to continue to your workspace.</p></div>
        <form id="login-form" novalidate>
          <div class="login-field" data-field>
            <input id="login-email" name="email" type="email" autocomplete="email" inputmode="email" placeholder=" " required aria-describedby="email-error">
            <label for="login-email" data-copy="email">Email</label>
            <svg class="field-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5.5h14v9H3zM3.5 6l6.5 5 6.5-5"/></svg>
            <span class="field-error" id="email-error"></span>
          </div>
          <div class="login-field" data-field>
            <input id="login-password" name="password" type="password" autocomplete="current-password" placeholder=" " required minlength="8" aria-describedby="password-error">
            <label for="login-password" data-copy="password">Password</label>
            <svg class="field-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M5.5 9V6.8a4.5 4.5 0 0 1 9 0V9M4 9h12v8H4z"/></svg>
            <button class="password-toggle" type="button" aria-label="Show password" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path class="eye-outline" d="M2.5 12s3.4-5 9.5-5 9.5 5 9.5 5-3.4 5-9.5 5-9.5-5-9.5-5Z"/><circle cx="12" cy="12" r="2.4"/><path class="eye-slash" d="m4 4 16 16"/></svg></button>
            <span class="field-error" id="password-error"></span>
          </div>
          <div class="login-options"><label class="remember"><input name="remember" type="checkbox"><span></span><b data-copy="remember">Remember me</b></label><a href="#login-status" data-forgot data-copy="forgot">Forgot password?</a></div>
          <button class="login-submit" type="submit"><span class="submit-label" data-copy="signIn">Sign in</span><svg class="submit-arrow" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h12M9 3l5 5-5 5"/></svg><span class="submit-loader" aria-hidden="true"></span><svg class="submit-check" viewBox="0 0 18 18" aria-hidden="true"><path d="m3.5 9.2 3.3 3.3 7.7-8"/></svg></button>
          <p class="login-status" id="login-status" role="status" aria-live="polite"></p>
        </form>
        <p class="auth-switch"><span data-copy="newAccount">New to NorthByte?</span> <a href="/register" data-copy="createAccount">Create an account</a></p>
        <div class="login-security"><span><i></i><span data-copy="encrypted">ENCRYPTED CONNECTION</span></span><span dir="ltr">TLS / 1.3</span></div>
      </div>
    </section>
  </main>
</body>
</html>\n`);
await mkdir('register', { recursive: true });
await writeFile('register/index.html', `<!doctype html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#0C0D14">
  <title>${escapeHtml(siteConfig.brand)} — Create account</title>
  <meta name="description" content="Create your ${escapeHtml(siteConfig.brand)} workspace account.">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="/styles.css">
  <link rel="stylesheet" href="/login.css">
  <script type="module" defer src="/register.js"></script>
</head>
<body class="login-page register-page">
  <a class="skip-link" href="#register-form">Skip to registration</a>
  <header class="login-header">
    <a class="brand login-brand" href="/" aria-label="${escapeHtml(siteConfig.brand)} home"><img class="brand-mark" src="/assets/northbyte-mark.svg" width="38" height="38" alt=""><b dir="ltr">${escapeHtml(siteConfig.brand)}</b></a>
    <div class="login-header-actions"><button class="language-switch login-language" type="button" data-register-language aria-label="Switch to Persian"><span aria-hidden="true">◎</span><span>فارسی</span></button><a class="login-home" href="/"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13 8H3m5-5L3 8l5 5"/></svg><span data-copy="back">Back to website</span></a></div>
  </header>
  <main class="login-shell">
    <section class="login-story" aria-labelledby="register-story-title">
      <div class="login-network" aria-hidden="true">
        <svg viewBox="0 0 760 680" preserveAspectRatio="xMidYMid slice"><g class="network-lines"><path d="M36 136 188 80 336 186 502 104 712 176"/><path d="M84 410 232 318 390 424 566 322 728 444"/><path d="M188 80 232 318M336 186l54 238m112-320 64 218M84 410l104 154 202-140 168 156"/></g><g class="network-nodes"><circle cx="188" cy="80" r="4"/><circle cx="336" cy="186" r="4"/><circle cx="502" cy="104" r="4"/><circle cx="232" cy="318" r="4"/><circle cx="390" cy="424" r="4"/><circle cx="566" cy="322" r="4"/><circle cx="188" cy="564" r="4"/><circle cx="558" cy="580" r="4"/></g><g class="network-packets"><circle cx="188" cy="80" r="3"/><circle cx="232" cy="318" r="3"/><circle cx="390" cy="424" r="3"/></g></svg>
        <span class="network-label label-api">IDENTITY / NEW</span><span class="network-label label-deploy">WORKSPACE / READY</span><span class="network-label label-node">ACCESS / SECURE</span>
      </div>
      <div class="story-copy"><p class="eyebrow"><span class="live-dot"></span><span data-copy="eyebrow">JOIN THE WORKSPACE</span></p><h1 id="register-story-title"><span data-copy="start">Start.</span> <span data-copy="build">Build.</span><br><em data-copy="grow">Grow.</em></h1><p data-copy="story">One secure account for projects, delivery updates, and collaboration.</p><div class="login-disciplines" aria-label="Workspace capabilities"><span>PROJECTS</span><span>DELIVERY</span><span>FILES</span><span>UPDATES</span><span>SUPPORT</span></div></div>
    </section>
    <section class="login-panel" aria-labelledby="register-title">
      <div class="login-glow" aria-hidden="true"></div>
      <div class="login-card register-card" data-register-card>
        <div class="login-card-mark"><img src="/assets/northbyte-mark.svg" width="44" height="44" alt=""><span><b dir="ltr">${escapeHtml(siteConfig.brand)}</b><small data-copy="portal">CLIENT PORTAL</small></span></div>
        <div class="login-heading"><p class="login-kicker" data-copy="secure">SECURE WORKSPACE ACCESS</p><h2 id="register-title" data-copy="title">Create account</h2><p data-copy="intro">Set up your details to request workspace access.</p></div>
        <form id="register-form" novalidate>
          <div class="login-field" data-field><input id="register-name" name="name" type="text" autocomplete="name" placeholder=" " required maxlength="100" aria-describedby="name-error"><label for="register-name" data-copy="name">Full name</label><svg class="field-icon" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="6.5" r="3"/><path d="M4 17c.5-3.2 2.5-5 6-5s5.5 1.8 6 5"/></svg><span class="field-error" id="name-error"></span></div>
          <div class="login-field" data-field><input id="register-email" name="email" type="email" autocomplete="email" inputmode="email" placeholder=" " required aria-describedby="register-email-error"><label for="register-email" data-copy="email">Work email</label><svg class="field-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5.5h14v9H3zM3.5 6l6.5 5 6.5-5"/></svg><span class="field-error" id="register-email-error"></span></div>
          <div class="register-passwords">
            <div class="login-field" data-field><input id="register-password" name="password" type="password" autocomplete="new-password" placeholder=" " required minlength="8" aria-describedby="register-password-error"><label for="register-password" data-copy="password">Password</label><svg class="field-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M5.5 9V6.8a4.5 4.5 0 0 1 9 0V9M4 9h12v8H4z"/></svg><button class="password-toggle" type="button" aria-label="Show password" aria-pressed="false" data-password-toggle="register-password"><svg viewBox="0 0 24 24" aria-hidden="true"><path class="eye-outline" d="M2.5 12s3.4-5 9.5-5 9.5 5 9.5 5-3.4 5-9.5 5-9.5-5-9.5-5Z"/><circle cx="12" cy="12" r="2.4"/><path class="eye-slash" d="m4 4 16 16"/></svg></button><span class="field-error" id="register-password-error"></span></div>
            <div class="login-field" data-field><input id="register-confirm" name="confirm" type="password" autocomplete="new-password" placeholder=" " required minlength="8" aria-describedby="confirm-error"><label for="register-confirm" data-copy="confirm">Confirm password</label><svg class="field-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M5.5 9V6.8a4.5 4.5 0 0 1 9 0V9M4 9h12v8H4z"/></svg><span class="field-error" id="confirm-error"></span></div>
          </div>
          <label class="remember register-consent"><input name="terms" type="checkbox" required><span></span><b data-copy="terms">I agree to the account and privacy terms.</b></label>
          <button class="login-submit register-submit" type="submit"><span class="submit-label" data-copy="create">Create account</span><svg class="submit-arrow" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h12M9 3l5 5-5 5"/></svg><span class="submit-loader" aria-hidden="true"></span><svg class="submit-check" viewBox="0 0 18 18" aria-hidden="true"><path d="m3.5 9.2 3.3 3.3 7.7-8"/></svg></button>
          <p class="login-status" id="register-status" role="status" aria-live="polite"></p>
        </form>
        <p class="auth-switch"><span data-copy="haveAccount">Already have an account?</span> <a href="/login" data-copy="signIn">Sign in</a></p>
        <div class="login-security"><span><i></i><span data-copy="encrypted">ENCRYPTED CONNECTION</span></span><span dir="ltr">TLS / 1.3</span></div>
      </div>
    </section>
  </main>
</body>
</html>\n`);
console.log('Built index.html, /login, and /register with complete, readable HTML.');
