import { siteConfig } from './site.config.js';
import { content, technologies } from './content.js';

export const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const ids = ['services', 'work', 'process', 'team'];
const arrow = '<svg class="icon-arrow icon-arrow-up-right" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 13 13 3M6 3h7v7"/></svg>';
const forwardArrow = '<svg class="icon-arrow icon-arrow-forward" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h12M9 3l5 5-5 5"/></svg>';
const upArrow = '<svg class="icon-arrow icon-arrow-up" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 14V2M3 7l5-5 5 5"/></svg>';
const downArrow = '<svg class="icon-arrow icon-arrow-down" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v12M3 9l5 5 5-5"/></svg>';
const pills = values => values.map(value => `<span>${escapeHtml(value)}</span>`).join('');
const socialIcons = {
  github: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8a9.2 9.2 0 0 0-2.9 17.9c.5.1.6-.2.6-.5v-1.8c-2.5.5-3-.6-3-.6-.4-1-.9-1.3-.9-1.3-.8-.5.1-.5.1-.5.9.1 1.4 1 1.4 1 .8 1.4 2.1 1 2.6.8.1-.6.3-1 .5-1.2-2-.2-4.1-1-4.1-4.5 0-1 .3-1.8 1-2.5-.1-.2-.4-1.2.1-2.5 0 0 .8-.3 2.6 1a9 9 0 0 1 4.8 0c1.8-1.3 2.6-1 2.6-1 .5 1.3.2 2.3.1 2.5.6.7 1 1.5 1 2.5 0 3.5-2.1 4.3-4.1 4.5.3.3.6.8.6 1.6v2.4c0 .3.2.6.6.5A9.2 9.2 0 0 0 12 2.8Z"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.2 8.4a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4ZM4.8 19.2h2.8v-8.6H4.8v8.6ZM9.4 10.6v8.6h2.8v-4.8c0-1.3.2-2.5 1.8-2.5 1.5 0 1.5 1.4 1.5 2.6v4.7h2.8V14c0-2.5-.5-4.4-3.4-4.4-1.4 0-2.3.8-2.7 1.5h-.1v-1.3H9.4Z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="12" cy="12" r="3.7"/><circle cx="17.4" cy="6.8" r=".8" class="social-fill"/></svg>',
};
function socialLinks(social = {}) {
  return `<div class="team-socials" aria-label="Social profiles">${Object.entries(socialIcons).map(([network, icon]) => {
    const url = social[network];
    return /^https?:\/\//.test(url || '')
      ? `<a class="team-social" href="${escapeHtml(url)}" target="_blank" rel="noreferrer" aria-label="${network}">${icon}</a>`
      : `<span class="team-social is-pending" aria-label="${network} profile coming soon">${icon}</span>`;
  }).join('')}</div>`;
}
function sectionHeading(label, title, intro) {
  return `<div class="section-heading"><div><p class="eyebrow">${label}</p><h2>${title}</h2></div><p class="section-intro">${intro}</p></div>`;
}
function languageButton(c, location) {
  return `<button class="language-switch" data-language-switch aria-label="${c.languageLabel}" data-location="${location}"><span aria-hidden="true">◎</span> <span lang="${c.language === 'فارسی' ? 'fa' : 'en'}">${c.language}</span></button>`;
}
export function renderSite(language = 'en') {
  const lang = content[language] ? language : 'en';
  const c = content[lang];
  const brand = escapeHtml(siteConfig.brand);
  const architectureLabels = lang === 'fa' ? ['وب / رابط / تجربه کاربری', 'API / منطق / یکپارچه‌سازی', 'داده / استقرار / نگهداری'] : ['WEB / UI / EXPERIENCE', 'API / LOGIC / INTEGRATIONS', 'DATA / DEPLOY / OPERATE'];
  const architectureFlow = lang === 'fa' ? `طراحی ${forwardArrow} توسعه ${forwardArrow} استقرار` : `DESIGN ${forwardArrow} BUILD ${forwardArrow} DEPLOY`;
  const nav = ids.map((id, i) => `<a href="#${id}">${c.nav[i]}</a>`).join('');
  return `
    <a class="skip-link" href="#main">${c.skip}</a>
    <header class="site-header"><a class="brand" href="#home" aria-label="${brand}"><img class="brand-mark" src="assets/northbyte-mark.svg" width="38" height="38" alt="" aria-hidden="true"><b dir="ltr">${brand}</b></a><nav aria-label="${c.navLabel}">${nav}</nav><div class="header-actions">${languageButton(c, 'header')}<a class="header-cta" href="/login">${c.loginLink} ${arrow}</a></div></header>
    <main id="main">
      <section class="hero section" id="home" aria-labelledby="hero-title">
        <div class="hero-atmosphere" aria-hidden="true"><div class="grid"></div><div class="smoke smoke-one"></div><div class="smoke smoke-two"></div><div class="particles"></div></div>
        <div class="hero-copy"><p class="eyebrow"><span class="live-dot"></span>${c.heroLabel}</p><h1 id="hero-title">${c.heroTitle}</h1><p class="hero-description">${c.heroText}</p><div class="actions"><a class="button primary" href="#contact">${c.primary} ${arrow}</a><a class="text-link" href="#work">${c.secondary}${forwardArrow}</a></div><div class="hero-tags">${pills(c.heroTags)}</div></div>
        <div class="architecture-stage" aria-label="${c.systemLabel}"><div class="architecture-halo" aria-hidden="true"></div><div class="architecture-header"><span class="live-dot"></span>${c.systemLabel}${arrow}</div><div class="architecture-stack">${c.systemNodes.map((label, i) => `<div class="architecture-layer layer-${i}"><span class="layer-number" dir="ltr">0${i + 1}</span><div><h3>${label}</h3><p>${architectureLabels[i]}</p></div><span class="layer-symbol" aria-hidden="true">${['▧', '{ }', '⌘'][i]}</span><i class="signal" aria-hidden="true"></i></div>`).join('')}</div><div class="architecture-footer" aria-hidden="true"><span>⌁</span><span class="architecture-flow">${architectureFlow}</span><span>+</span></div></div>
        <div class="hero-bottom"><a href="#services"><span class="scroll-symbol" aria-hidden="true">${downArrow}</span>${c.scroll}</a><span>${c.systemLabel}</span></div>
      </section>
      <div class="system-band"><div class="system-band-label"><span class="live-dot"></span>${c.systemLabel}</div><div class="system-nodes">${c.systemNodes.map((label, i) => `<span><b dir="ltr">0${i + 1}</b>${label}</span>${i < 2 ? `<i aria-hidden="true">${forwardArrow}</i>` : ''}`).join('')}</div><span class="band-end" aria-hidden="true">&lt; / &gt;</span></div>
      <section class="section services-section" id="services">${sectionHeading(c.servicesLabel, c.servicesTitle, c.servicesIntro)}<div class="service-grid">${c.services.map(([number, title, description, tags], i) => `<article class="service-card"><div class="service-top"><span class="service-icon" aria-hidden="true">${['⌘', '▧', '{ }', '↥', '⤧'][i]}</span><span class="card-index">${number}</span></div><h3>${title}</h3><p>${description}</p><div class="service-tags">${tags}</div></article>`).join('')}<div class="service-visual" aria-hidden="true"><div class="visual-orbit"></div><div class="code-core">&lt;/&gt;</div><span class="code-label label-top">API</span><span class="code-label label-left">UI</span><span class="code-label label-right">OPS</span><span class="code-label label-bottom">DATA</span></div></div></section>
      <section class="section work-section" id="work">${sectionHeading(c.workLabel, c.workTitle, c.workIntro)}<div class="project-grid">${c.projects.map((project, index) => `<article class="project-card"><div class="project-visual visual-${index}" aria-hidden="true"><div class="diagram-toolbar"><span></span><span></span><span></span><i>0${index + 1}</i></div><div class="workflow-diagram">${project.diagram.map((label, i) => `<div class="workflow-step"><span class="workflow-check">${i < 2 ? '✓' : '○'}</span><span>${label}</span><i></i></div>`).join('')}</div><div class="diagram-decoration">{ ${['workflow', 'access', 'commerce'][index]} }</div></div><div class="project-body"><p class="eyebrow">${project.category}</p><h3>${project.title}</h3><p>${project.description}</p><div class="tech-pills" dir="ltr">${pills(project.tech)}</div><details><summary>${c.detail}<span aria-hidden="true">+</span></summary><div class="project-detail"><h4>${c.challenge}</h4><p>${project.challenge}</p><h4>${c.approach}</h4><p>${project.approach}</p><h4>${c.capabilities}</h4><ul>${project.capabilities.map(capability => `<li>${capability}</li>`).join('')}</ul><p class="stack-note">${c.stack}: <bdi>${project.tech.join(' / ')}</bdi></p></div></details></div></article>`).join('')}</div></section>
      <section class="section process-section" id="process">${sectionHeading(c.processLabel, c.processTitle, c.processIntro)}<ol class="process-list">${c.process.map(([title, description], i) => `<li><span class="process-number">${new Intl.NumberFormat(lang, { minimumIntegerDigits: 2 }).format(i + 1)}</span><h3>${title}</h3><p>${description}</p></li>`).join('')}</ol></section>
      <section class="section team-section" id="team">${sectionHeading(c.teamLabel, c.teamTitle, c.teamIntro)}<div class="team-grid">${siteConfig.people.map(member => `<article class="team-card" id="${member.id}"><div class="team-avatar"><img src="${escapeHtml(member.portrait)}" width="1254" height="1254" alt="${c.portraitAlt} ${escapeHtml(member.name[lang])}" loading="lazy" decoding="async"></div><div class="team-info"><p class="team-position">${c[member.role]}</p><h3>${escapeHtml(member.name[lang])}</h3><p class="team-bio">${escapeHtml(member.bio[lang].replaceAll('{brand}', siteConfig.brand))}</p>${socialLinks(member.social)}</div></article>`).join('')}</div><p class="team-note">${c.teamNote}</p></section>
      <section class="section technology-section" id="technology">${sectionHeading(c.techLabel, c.techTitle, c.techIntro)}<div class="technology-list">${pills(technologies)}</div></section>
      <section class="section contact-section" id="contact"><div class="contact-copy"><p class="eyebrow">${c.contactLabel}</p><h2>${c.contactTitle}</h2><p class="section-intro">${c.contactIntro}</p><div class="contact-orbit" aria-hidden="true">${arrow}</div>${siteConfig.contactEmail ? `<a class="contact-address" href="mailto:${escapeHtml(siteConfig.contactEmail)}" dir="ltr">${escapeHtml(siteConfig.contactEmail)}</a>` : ''}</div><form id="contact-form"><div class="form-row"><div><label for="contact-name">${c.nameLabel}</label><input id="contact-name" name="name" autocomplete="name" required maxlength="100" placeholder="${c.namePlaceholder}"></div><div><label for="contact-email">${c.emailLabel}</label><input id="contact-email" name="email" type="email" autocomplete="email" required maxlength="254" dir="ltr" placeholder="${c.emailPlaceholder}"></div></div><label for="contact-idea">${c.ideaLabel}</label><textarea id="contact-idea" name="idea" required rows="5" maxlength="5000" placeholder="${c.ideaPlaceholder}"></textarea><button class="button primary" type="submit" data-contact-submit disabled>${siteConfig.contactEmail ? c.send : c.save}${arrow}</button><p class="form-status" id="form-status" role="status" aria-live="polite">${siteConfig.contactEmail ? c.mailNote : c.localNote}</p><noscript><p class="form-status">${c.noScript}</p></noscript></form></section>
    </main>
    <footer class="site-footer"><div><a class="brand footer-brand" href="#home"><img class="brand-mark" src="assets/northbyte-mark.svg" width="38" height="38" alt="" aria-hidden="true"><b dir="ltr">${brand}</b></a><p>${c.footerStatement}</p></div><nav aria-label="${c.footerNav}">${nav}<a href="#contact">${c.contactLink}</a></nav><div class="footer-bottom"><span><bdi>${brand}</bdi> / ${c.footerKicker}</span>${languageButton(c, 'footer')}<button class="motion-switch" data-motion-toggle aria-pressed="false">${c.reduceMotion}</button><a href="#home">${c.backTop}${upArrow}</a></div></footer>`;
}



