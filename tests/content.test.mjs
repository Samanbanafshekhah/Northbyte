import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { content } from '../content.js';
import { siteConfig } from '../site.config.js';
import { renderSite } from '../render.js';

test('both languages cover the same content and interaction messages', () => {
  assert.deepEqual(Object.keys(content.en).sort(), Object.keys(content.fa).sort());
  for (const lang of ['en', 'fa']) {
    assert.equal(content[lang].services.length, 5);
    assert.equal(content[lang].projects.length, 3);
    assert.equal(content[lang].process.length, 5);
    assert.ok(content[lang].required && content[lang].localSuccess && content[lang].meta);
  }
});
test('founder is mapped to sunglasses; portraits appear only in team with biographies', () => {
  const founder = siteConfig.people.find(person => person.role === 'founder');
  assert.equal(founder.id, 'saman');
  assert.equal(founder.portrait, 'assets/person-2.png');
  for (const lang of ['en', 'fa']) {
    const sections = [...renderSite(lang).matchAll(/<section\b[^>]*id="([^"]+)"[\s\S]*?<\/section>/g)];
    assert.deepEqual(sections.filter(section => section[0].includes('<img')).map(section => section[1]), ['team']);
    for (const member of siteConfig.people) assert.ok(member.bio[lang].length > 100);
    assert.equal((renderSite(lang).match(/class="team-avatar"/g) || []).length, 2);
  }
});
test('all navigation targets resolve and projects have real details', () => {
  for (const lang of ['en', 'fa']) {
    const html = renderSite(lang);
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(ids).size, ids.length);
    for (const [, target] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(target), target);
    assert.equal([...html.matchAll(/<details>/g)].length, 3);
    assert.ok(!html.includes('undefined'));
  }
});
test('missing contact is explicit; configured contact enables mailto presentation', () => {
  const original = siteConfig.contactEmail;
  try {
    siteConfig.contactEmail = '';
    assert.ok(renderSite('en').includes(content.en.localNote));
    assert.ok(!renderSite('en').includes('href="mailto:'));
    siteConfig.contactEmail = 'team@example.com';
    assert.ok(renderSite('en').includes('href="mailto:team@example.com"'));
    assert.ok(renderSite('fa').includes(content.fa.send));
  } finally { siteConfig.contactEmail = original; }
});
test('generated HTML stays in sync with the renderer', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.ok(html.includes(renderSite('en')));
  assert.ok(html.includes('property="og:description"'));
});

test('login route is generated with accessible auth controls and no fake credentials', async () => {
  const html = await readFile(new URL('../login/index.html', import.meta.url), 'utf8');
  assert.ok(html.includes('autocomplete="email"'));
  assert.ok(html.includes('autocomplete="current-password"'));
  assert.ok(html.includes('data-login-language'));
  assert.equal(siteConfig.authEndpoint, '');
});

test('register route is generated with secure account fields and no fake registration', async () => {
  const html = await readFile(new URL('../register/index.html', import.meta.url), 'utf8');
  assert.ok(html.includes('autocomplete="name"'));
  assert.ok(html.includes('autocomplete="email"'));
  assert.equal((html.match(/autocomplete="new-password"/g) || []).length, 2);
  assert.ok(html.includes('name="terms"'));
  assert.equal(siteConfig.registerEndpoint, '');
});

test('dashboard exposes the project workflow without pretending backend security exists', async () => {
  const html = await readFile(new URL('../dashboard/index.html', import.meta.url), 'utf8');
  const script = await readFile(new URL('../dashboard.js', import.meta.url), 'utf8');
  assert.ok(html.includes('id="dashboard-app"'));
  assert.ok(script.includes("'/dashboard/projects/new'"));
  assert.ok(script.includes('allowedFiles'));
  assert.ok(script.includes('sessionEndpoint'));
  assert.equal(siteConfig.sessionEndpoint, '');
  assert.equal(siteConfig.projectApiBase, '');
  assert.equal(siteConfig.demoAuth.enabled, true);
  assert.ok(siteConfig.demoAuth.email && siteConfig.demoAuth.password);
});
