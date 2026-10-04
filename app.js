import { clamp, getSceneOffset } from './motion.js';
import { content } from './content.js';
import { renderSite } from './render.js';
import { siteConfig } from './site.config.js';

const root = document.querySelector('#site');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let language = 'en';
let manualReduced = false;
try { language = localStorage.getItem('webteam-language') === 'fa' ? 'fa' : 'en'; } catch { /* Storage can be unavailable in private contexts. */ }
let hero, architecture, sections = [], navigation = [];
let frame = 0;
let observer;
let currentSection = '';

function updateMetadata() {
  const c = content[language];
  document.documentElement.lang = language;
  document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr';
  document.title = `${siteConfig.brand} — ${c.title}`;
  document.querySelector('meta[name="description"]').content = c.meta;
  document.querySelector('meta[property="og:title"]').content = document.title;
  document.querySelector('meta[property="og:description"]').content = c.meta;
  document.querySelector('meta[property="og:locale"]').content = language === 'fa' ? 'fa_IR' : 'en_US';
}

function renderMotion() {
  frame = 0;
  const heroRect = hero.getBoundingClientRect();
  const positions = sections.map(section => ({ element: section, top: section.getBoundingClientRect().top }));
  const active = positions.filter(item => item.top <= innerHeight * 0.4).at(-1)?.element.id ?? 'home';
  if (active !== currentSection) {
    currentSection = active;
    navigation.forEach(link => {
      if (link.hash === `#${active}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  if (reduced.matches || manualReduced) return;
  if (heroRect.bottom > 0 && heroRect.top < innerHeight) {
    architecture.style.setProperty('--scene-shift', `${getSceneOffset((90 - heroRect.top) / heroRect.height)}px`);
  }
}
function schedule() { if (!frame) frame = requestAnimationFrame(renderMotion); }

function syncMotionPreference() {
  const isReduced = reduced.matches || manualReduced;
  document.documentElement.classList.toggle('motion-enabled', !isReduced);
  architecture.style.removeProperty('--scene-shift');
  const toggle = document.querySelector('[data-motion-toggle]');
  toggle.setAttribute('aria-pressed', String(isReduced));
  toggle.disabled = reduced.matches;
  schedule();
}

function bindPage() {
  hero = document.querySelector('.hero');
  architecture = document.querySelector('.architecture-stage');
  sections = [...document.querySelectorAll('main > section')];
  navigation = [...document.querySelectorAll('nav a')];
  currentSection = '';
  observer?.disconnect();
  observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      entry.target.dataset.visible = String(entry.isIntersecting);
      if (entry.target.hasAttribute('data-reveal')) entry.target.dataset.inView = String(entry.isIntersecting);
    });
  }, { threshold: 0.06 });
  observer.observe(hero);
  // Animate meaningful content groups instead of stacking transforms on every nested div.
  const revealTargets = document.querySelectorAll('.hero-copy > *, .architecture-stage, .system-band > *, .section-heading > *, .service-card, .service-visual, .project-card, .process-list li, .team-card, .technology-list span, .contact-copy > *, #contact-form, .site-footer > div, .site-footer > nav');
  revealTargets.forEach((element, index) => {
    element.dataset.reveal = '';
    element.style.setProperty('--reveal-delay', `${index % 3 * 65}ms`);
    observer.observe(element);
  });
  document.querySelectorAll('[data-language-switch]').forEach(button => button.addEventListener('click', () => switchLanguage(button.dataset.location)));
  document.querySelector('[data-motion-toggle]').addEventListener('click', () => { manualReduced = !manualReduced; syncMotionPreference(); });
  bindContact();
  document.querySelectorAll('a[href="/login"]').forEach(link => link.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    document.documentElement.classList.add('page-leaving');
    setTimeout(() => { window.location.href = link.href; }, reduced.matches || manualReduced ? 0 : 180);
  }));
  syncMotionPreference();
}

function switchLanguage(location) {
  const anchor = [...sections].reverse().find(section => section.getBoundingClientRect().top <= 125) ?? hero;
  const anchorId = anchor.id;
  const relativeScroll = clamp((scrollY - anchor.offsetTop) / anchor.offsetHeight);
  const values = Object.fromEntries(new FormData(document.querySelector('#contact-form')));
  const expanded = [...document.querySelectorAll('.project-card details')].map(detail => detail.open);
  language = language === 'en' ? 'fa' : 'en';
  try { localStorage.setItem('webteam-language', language); } catch { /* Preference still works in memory. */ }
  root.innerHTML = renderSite(language);
  updateMetadata();
  bindPage();
  Object.entries(values).forEach(([name, value]) => { document.querySelector(`#contact-form [name="${name}"]`).value = value; });
  document.querySelectorAll('.project-card details').forEach((detail, index) => { detail.open = expanded[index]; });
  const nextAnchor = document.getElementById(anchorId);
  window.scrollTo({ top: anchorId === 'home' ? 0 : nextAnchor.offsetTop + relativeScroll * nextAnchor.offsetHeight, behavior: 'instant' });
  document.querySelector(`[data-language-switch][data-location="${location}"]`).focus({ preventScroll: true });
}

function bindContact() {
  const form = document.querySelector('#contact-form');
  form.querySelector('[data-contact-submit]').disabled = false;
  const fields = [...form.querySelectorAll('input, textarea')];
  const c = content[language];
  fields.forEach(field => {
    field.addEventListener('input', () => field.setCustomValidity(''));
    field.addEventListener('invalid', () => field.setCustomValidity(field.validity.valueMissing ? c.required : field.validity.typeMismatch ? c.emailInvalid : ''));
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    fields.forEach(field => {
      field.value = field.value.trim();
      field.setCustomValidity(field.value ? '' : c.required);
    });
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const status = document.querySelector('#form-status');
    const body = `${c.nameLabel}: ${data.get('name').trim()}\n${c.emailLabel}: ${data.get('email').trim()}\n\n${c.ideaLabel}\n${data.get('idea').trim()}\n`;
    status.classList.remove('error');
    try {
      if (siteConfig.contactEmail) {
        window.location.href = `mailto:${encodeURIComponent(siteConfig.contactEmail)}?subject=${encodeURIComponent(c.briefTitle)}&body=${encodeURIComponent(body)}`;
        status.textContent = c.mailSuccess;
      } else {
        const url = URL.createObjectURL(new Blob([body], { type: 'text/plain;charset=utf-8' }));
        const link = Object.assign(document.createElement('a'), { href: url, download: 'project-brief.txt' });
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        status.textContent = c.localSuccess;
      }
    } catch {
      status.textContent = c.contactError;
      status.classList.add('error');
    }
  });
}

if (language !== document.documentElement.lang) root.innerHTML = renderSite(language);
updateMetadata();
bindPage();
window.addEventListener('scroll', schedule, { passive: true });
window.addEventListener('resize', schedule, { passive: true });
reduced.addEventListener('change', syncMotionPreference);
