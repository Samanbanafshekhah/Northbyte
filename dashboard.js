import { siteConfig } from './site.config.js';
import { messaging } from './messages.js';

const app = document.querySelector('#dashboard-app');
let storageKey = 'northbyte-client-workspace-v1';
let draftKey = 'northbyte-project-draft-v1';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const allowedFiles = new Map([
  ['image/png', { extensions: ['png'], limit: 10 * 1024 * 1024 }],
  ['image/jpeg', { extensions: ['jpg', 'jpeg'], limit: 10 * 1024 * 1024 }],
  ['image/webp', { extensions: ['webp'], limit: 10 * 1024 * 1024 }],
  ['application/pdf', { extensions: ['pdf'], limit: 20 * 1024 * 1024 }],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', { extensions: ['docx'], limit: 20 * 1024 * 1024 }],
  ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', { extensions: ['xlsx'], limit: 20 * 1024 * 1024 }],
  ['application/zip', { extensions: ['zip'], limit: 20 * 1024 * 1024 }]
]);
const projectTypes = ['Website', 'Web Application', 'E-commerce', 'Mobile Application', 'Backend / API', 'DevOps / Infrastructure', 'Automation', 'UI/UX Design', 'Existing Project Improvements', 'Other'];
const featureOptions = ['User Registration', 'Login / Authentication', 'Admin Panel', 'Payment Gateway', 'Online Shop', 'Dashboard', 'Notifications', 'Email', 'SMS', 'File Upload', 'Search', 'Filters', 'Reports', 'API Integration', 'Third-party Services', 'Real-time Updates', 'Chat / Messaging', 'Multi-language', 'Role & Permission System', 'Analytics'];
const budgets = ['Not sure yet', 'Under $1,000', '$1,000 – $3,000', '$3,000 – $5,000', '$5,000 – $10,000', '$10,000+', 'Custom'];
const timelines = ['As soon as possible', 'Within 1 month', '1–3 months', '3–6 months', 'Flexible', 'Custom date'];
const steps = ['Basics', 'Details', 'Features', 'Files', 'Budget', 'Review'];
const icons = {
  overview: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>',
  projects: '<path d="M4 6.5h6l2-2h8v15H4zM4 9h16"/>',
  add: '<path d="M12 5v14M5 12h14"/>', messages: '<path d="M4 5h16v11H9l-5 4z"/>',
  files: '<path d="M7 3h7l4 4v14H7zM14 3v5h5"/>', profile: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21c.7-4.5 3.2-7 7.5-7s6.8 2.5 7.5 7"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/>',
  logout: '<path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10"/>', bell: '<path d="M6 9a6 6 0 0 1 12 0c0 7 3 7 3 7H3s3 0 3-7M10 20h4"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>', chevron: '<path d="m9 18 6-6-6-6"/>', close: '<path d="M5 5l14 14M19 5 5 19"/>', upload: '<path d="M12 16V4m-5 5 5-5 5 5M4 16v4h16v-4"/>', check: '<path d="m4 12 5 5L20 6"/>'
};
const icon = name => `<svg class="dash-icon" viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const formatDate = value => new Intl.DateTimeFormat(document.documentElement.lang === 'fa' ? 'fa-IR' : 'en', { dateStyle: 'medium' }).format(new Date(value));
const formatBytes = bytes => bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

const emptyDraft = () => ({ step: 0, title: '', types: [], description: '', goal: '', targetUsers: '', existing: 'new', existingUrl: '', features: [], customFeatures: [], budget: '', timeline: '', customTimeline: '', notes: '', files: [] });
function loadJson(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
const state = loadJson(storageKey, {
  profile: { fullName: '', email: '', phone: '', company: '', country: '', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
  projects: [], notifications: [{ id: 'welcome', text: 'Your client workspace is ready.', time: new Date().toISOString(), read: false }],
  preferences: { projectUpdates: true, messages: true, account: true }
});
let draft = { ...emptyDraft(), ...loadJson(draftKey, {}) };
let transientFiles = [];
let autosaveTimer = 0;
let toastTimer = 0;
let storageAvailable = true;

function saveJson(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { storageAvailable = false; return false; } }
function persist() { return saveJson(storageKey, state); }
function persistDraft(message = true) {
  const saved = saveJson(draftKey, { ...draft, files: transientFiles.map(({ name, size, type }) => ({ name, size, type, needsReselect: true })) });
  const indicator = document.querySelector('[data-save-state]');
  if (indicator && message) { indicator.textContent = saved ? 'Saved' : 'Storage unavailable'; setTimeout(() => { if (indicator) indicator.textContent = ''; }, 1800); }
  if (!saved && message) toast('This browser blocks local draft storage. Keep this page open to preserve your work.', 'error');
}
function scheduleDraftSave() { const indicator = document.querySelector('[data-save-state]'); if (indicator) indicator.textContent = 'Saving…'; clearTimeout(autosaveTimer); autosaveTimer = setTimeout(() => persistDraft(true), 650); }
function toast(message, tone = '') { clearTimeout(toastTimer); let element = document.querySelector('.dash-toast'); if (!element) { element = document.createElement('div'); element.className = 'dash-toast'; document.body.append(element); } element.className = `dash-toast ${tone}`; element.textContent = message; requestAnimationFrame(() => element.classList.add('is-visible')); toastTimer = setTimeout(() => element.classList.remove('is-visible'), 2800); }

const navItems = [
  ['overview', '/dashboard', 'Overview'], ['projects', '/dashboard/projects', 'My Projects'], ['add', '/dashboard/projects/new', 'New Project'], ['messages', '/dashboard/messages', 'Messages'], ['files', '/dashboard/files', 'Files'], ['profile', '/dashboard/profile', 'Profile'], ['settings', '/dashboard/settings', 'Settings']
];
function routeInfo() {
  const path = location.pathname.replace(/\/$/, '') || '/dashboard';
  if (path === '/dashboard/projects/new') return { key: 'new', title: 'New Project', breadcrumb: 'Projects / New request' };
  if (/^\/dashboard\/projects\/[^/]+$/.test(path)) return { key: 'detail', id: decodeURIComponent(path.split('/').at(-1)), title: 'Project Workspace', breadcrumb: 'Projects / Details' };
  const match = navItems.find(([, href]) => href === path);
  return { key: match?.[0] ?? 'overview', title: match?.[2] ?? 'Overview', breadcrumb: match?.[2] ?? 'Overview' };
}
function navigate(path) { history.pushState({}, '', path); render(); scrollTo({ top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth' }); }

function shell(content, route) {
  const unread = state.notifications.filter(item => !item.read).length;
  const messageUnread = messaging.unreadTotal;
  const initials = (state.profile.fullName || 'Client').split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase();
  return `<div class="dashboard-shell">
    <aside class="dash-sidebar" aria-label="Client navigation">
      <a class="brand dash-brand" href="/"><img class="brand-mark" src="/assets/northbyte-mark.svg" width="38" height="38" alt=""><b>NorthByte</b></a>
      <p class="sidebar-label">${messaging.user && messaging.isStaff ? 'TEAM WORKSPACE' : 'CLIENT WORKSPACE'}</p>
      <nav class="dash-nav">${navItems.map(([name, href, label]) => `<a href="${href}" data-route class="${route.key === name || route.key === 'detail' && name === 'projects' ? 'active' : ''}">${icon(name)}<span>${label}</span>${name === 'messages' ? `<b data-message-unread ${messageUnread?'':'hidden'}>${messageUnread}</b>` : ''}</a>`).join('')}</nav>
      <div class="sidebar-status"><span class="live-dot"></span><div><b>Workspace online</b><small>${siteConfig.projectApiBase ? 'Connected to project API' : 'Live messaging · Local projects'}</small></div></div>
      <button class="sidebar-logout" type="button" data-logout>${icon('logout')}<span>Logout</span></button>
    </aside>
    <div class="dash-overlay" data-menu-close></div>
    <div class="dashboard-main">
      <header class="dash-header"><div class="header-leading"><button class="menu-button" type="button" data-menu aria-label="Open navigation">${icon('menu')}</button><div><p>${messaging.user && messaging.isStaff ? 'TEAM PORTAL' : 'CLIENT PORTAL'}</p><h1>${escapeHtml(route.title)}</h1></div></div><div class="dash-header-actions"><div class="notification-wrap"><button class="notification-button" type="button" data-notifications aria-label="Notifications">${icon('bell')}${unread ? `<b>${unread}</b>` : ''}</button><div class="notification-popover" data-notification-panel><div><strong>Notifications</strong><button type="button" data-read-all>Mark all read</button></div>${state.notifications.length ? state.notifications.slice(0, 5).map(item => `<article class="${item.read ? '' : 'unread'}"><i></i><p>${escapeHtml(item.text)}<small>${formatDate(item.time)}</small></p></article>`).join('') : '<p class="empty-mini">You are all caught up.</p>'}</div></div><button class="user-chip" type="button" data-user-menu><span>${escapeHtml(initials)}</span><div><b>${escapeHtml(state.profile.fullName || 'Client account')}</b><small>${escapeHtml(state.profile.email || 'Workspace profile')}</small></div>${icon('chevron')}</button><div class="user-popover" data-user-panel><a href="/dashboard/profile" data-route>${icon('profile')}Profile</a><a href="/dashboard/settings" data-route>${icon('settings')}Settings</a><button type="button" data-logout>${icon('logout')}Logout</button></div></div></header>
      <main id="dashboard-content" class="dash-content" tabindex="-1"><div class="dash-breadcrumb"><span>NorthByte</span><i>/</i>${escapeHtml(route.breadcrumb)}</div>${content}</main>
    </div>
  </div>`;
}

function summaryCards() {
  const projects = state.projects;
  const values = [['Projects', projects.length], ['Drafts', projects.filter(p => p.status === 'Draft').length], ['Under Review', projects.filter(p => ['Submitted', 'Under Review', 'Need More Information'].includes(p.status)).length], ['In Progress', projects.filter(p => ['Approved', 'Planning', 'In Progress', 'Testing'].includes(p.status)).length], ['Completed', projects.filter(p => p.status === 'Completed').length]];
  return `<div class="summary-grid">${values.map(([label, value], index) => `<article class="summary-card"><span>0${index + 1}</span><p>${label}</p><strong>${value}</strong><i></i></article>`).join('')}</div>`;
}
function projectCard(project) {
  return `<article class="project-list-card"><div class="project-card-top"><span class="status status-${project.status.toLowerCase().replaceAll(' ', '-')}"><i></i>${escapeHtml(project.status)}</span><small>${formatDate(project.updatedAt)}</small></div><h3><a href="/dashboard/projects/${encodeURIComponent(project.id)}" data-route>${escapeHtml(project.title)}</a></h3><p>${escapeHtml(project.description || 'No description added yet.')}</p><div class="project-meta"><span>${escapeHtml(project.types?.join(', ') || 'Unspecified')}</span><span>${project.files?.length || 0} files</span></div><a class="project-open" href="/dashboard/projects/${encodeURIComponent(project.id)}" data-route>Open workspace ${icon('chevron')}</a></article>`;
}
function overviewView() {
  const firstName = state.profile.fullName.trim().split(/\s+/)[0];
  const latest = state.projects.slice().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 3);
  return `<section class="welcome-panel"><div><p class="eyebrow"><span class="live-dot"></span>PROJECT WORKSPACE</p><h2>Welcome back${firstName ? `, ${escapeHtml(firstName)}` : ''}</h2><p>Manage your project ideas, files, and requests from one focused workspace.</p></div><a class="dash-primary" href="/dashboard/projects/new" data-route>${icon('add')}Start a New Project</a><div class="welcome-orbit" aria-hidden="true"><i></i><i></i><i></i></div></section>${summaryCards()}<section class="dash-section"><div class="section-bar"><div><p>RECENT ACTIVITY</p><h2>Your projects</h2></div><a href="/dashboard/projects" data-route>View all ${icon('chevron')}</a></div>${latest.length ? `<div class="project-card-grid">${latest.map(projectCard).join('')}</div>` : emptyProjects()}</section>`;
}
function emptyProjects() { return `<div class="dash-empty"><div class="empty-graphic" aria-hidden="true"><span>{ }</span><i></i><i></i><i></i></div><h3>Turn your idea into a project</h3><p>Tell us what you want to build and we’ll prepare it for team review.</p><a class="dash-primary" href="/dashboard/projects/new" data-route>Start Your First Project ${icon('chevron')}</a></div>`; }
function projectsView() { return `<section class="dash-section page-section"><div class="section-bar"><div><p>PROJECT REQUESTS</p><h2>My Projects</h2></div><a class="dash-primary compact" href="/dashboard/projects/new" data-route>${icon('add')}New Project</a></div>${state.projects.length ? `<div class="project-card-grid">${state.projects.map(projectCard).join('')}</div>` : emptyProjects()}</section>`; }

function choiceCards(values, selected, field) { return `<div class="choice-grid">${values.map(value => `<label class="choice-card ${selected.includes(value) ? 'selected' : ''}"><input type="checkbox" name="${field}" value="${escapeHtml(value)}" ${selected.includes(value) ? 'checked' : ''}><span>${icon('check')}</span><b>${escapeHtml(value)}</b></label>`).join('')}</div>`; }
function radioCards(values, selected, field) { return `<div class="choice-grid compact-choices">${values.map(value => `<label class="choice-card ${selected === value ? 'selected' : ''}"><input type="radio" name="${field}" value="${escapeHtml(value)}" ${selected === value ? 'checked' : ''}><span>${icon('check')}</span><b>${escapeHtml(value)}</b></label>`).join('')}</div>`; }
function field(label, name, value = '', attributes = '') { return `<label class="dash-field"><span>${label}</span><input name="${name}" value="${escapeHtml(value)}" ${attributes}><small class="field-message" data-error-for="${name}"></small></label>`; }
function textarea(label, name, value = '', placeholder = '') { return `<label class="dash-field"><span>${label}</span><textarea name="${name}" rows="5" placeholder="${escapeHtml(placeholder)}">${escapeHtml(value)}</textarea><small class="field-message" data-error-for="${name}"></small></label>`; }

function formStep() {
  if (draft.step === 0) return `<div class="step-heading"><span>01</span><div><h2>Project Basics</h2><p>Give the request a clear name and choose what you need.</p></div></div>${field('Project title', 'title', draft.title, 'placeholder="Online booking system for my business" maxlength="140" required')}<fieldset><legend>Project type <small>Select one or more</small></legend>${choiceCards(projectTypes, draft.types, 'types')}</fieldset>`;
  if (draft.step === 1) return `<div class="step-heading"><span>02</span><div><h2>Project Details</h2><p>Help us understand the idea, outcome, and people using it.</p></div></div>${textarea('Tell us about your idea', 'description', draft.description, 'Describe what you want to build, what problem it solves, and how you imagine it working.')}${textarea('Project goal', 'goal', draft.goal, 'What should this project help you achieve?')}${field('Target users', 'targetUsers', draft.targetUsers, 'placeholder="Who will use this product?"')}<fieldset><legend>Do you already have an existing project?</legend>${radioCards(['No, this is a new project', 'Yes, I already have a project', 'I want to redesign / improve an existing project'], draft.existingLabel || 'No, this is a new project', 'existingLabel')}</fieldset>${draft.existingLabel && draft.existingLabel !== 'No, this is a new project' ? field('Existing website / app URL', 'existingUrl', draft.existingUrl, 'type="url" placeholder="https://"') : ''}`;
  if (draft.step === 2) return `<div class="step-heading"><span>03</span><div><h2>Features</h2><p>Select useful starting points and add anything specific to your product.</p></div></div>${choiceCards(featureOptions, draft.features, 'features')}<div class="custom-feature"><input type="text" data-custom-feature placeholder="Add a custom feature"><button type="button" data-add-feature>${icon('add')}Add feature</button></div><div class="custom-tags">${draft.customFeatures.map((value, index) => `<span>${escapeHtml(value)}<button type="button" data-remove-feature="${index}" aria-label="Remove ${escapeHtml(value)}">×</button></span>`).join('')}</div>`;
  if (draft.step === 3) return `<div class="step-heading"><span>04</span><div><h2>References & Files</h2><p>Add visual references, requirements, or existing project files.</p></div></div><div class="upload-zone" data-drop-zone tabindex="0">${icon('upload')}<h3>Drop your references here</h3><p>PNG, JPG, WEBP up to 10 MB · PDF, DOCX, XLSX or ZIP up to 20 MB</p><button type="button" data-choose-files>Choose files</button><input type="file" data-file-input multiple hidden accept=".png,.jpg,.jpeg,.webp,.pdf,.docx,.xlsx,.zip"></div><div class="upload-list">${transientFiles.map((file, index) => `<article><div class="file-preview">${file.preview ? `<img src="${file.preview}" alt="">` : `<span>${escapeHtml(file.name.split('.').at(-1).toUpperCase())}</span>`}</div><div><b>${escapeHtml(file.name)}</b><small>${formatBytes(file.size)} · Ready</small><i><span></span></i></div><button type="button" data-remove-file="${index}" aria-label="Remove ${escapeHtml(file.name)}">×</button></article>`).join('') || '<p class="empty-mini">No files selected yet.</p>'}</div><p class="upload-note">Files stay in this browser until a secure project API is connected and you submit the request.</p>`;
  if (draft.step === 4) return `<div class="step-heading"><span>05</span><div><h2>Budget & Timeline</h2><p>Share a useful range. You can keep either answer flexible.</p></div></div><fieldset><legend>Estimated budget</legend>${radioCards(budgets, draft.budget, 'budget')}</fieldset><fieldset><legend>Desired timeline</legend>${radioCards(timelines, draft.timeline, 'timeline')}</fieldset>${draft.timeline === 'Custom date' ? field('Preferred date', 'customTimeline', draft.customTimeline, 'type="date"') : ''}${textarea('Additional notes', 'notes', draft.notes, 'Anything else the team should know?')}`;
  return reviewStep();
}
function reviewRow(title, value, step) { return `<article><div><span>${title}</span><p>${value || '<em>Not provided</em>'}</p></div><button type="button" data-edit-step="${step}">Edit</button></article>`; }
function reviewStep() { const features = [...draft.features, ...draft.customFeatures]; return `<div class="step-heading"><span>06</span><div><h2>Review & Submit</h2><p>Check the request before it is prepared for the NorthByte team.</p></div></div><div class="review-list">${reviewRow('Project', `<strong>${escapeHtml(draft.title)}</strong><small>${escapeHtml(draft.description)}</small>`, 0)}${reviewRow('Type', draft.types.map(value => `<b>${escapeHtml(value)}</b>`).join(''), 0)}${reviewRow('Features', features.map(value => `<b>${escapeHtml(value)}</b>`).join(''), 2)}${reviewRow('Budget & timeline', `<strong>${escapeHtml(draft.budget || 'Not specified')}</strong><small>${escapeHtml(draft.timeline || 'Not specified')}</small>`, 4)}${reviewRow('Attachments', transientFiles.map(file => `<b>${escapeHtml(file.name)}</b>`).join('') || 'No attachments', 3)}</div>${siteConfig.projectApiBase ? '' : '<p class="preview-notice"><span class="live-dot"></span>Preview mode: submission will be stored only in this browser until a secure project API is configured.</p>'}`; }

function newProjectView() {
  return `<section class="project-form-shell"><div class="form-topbar"><div><p>NEW PROJECT REQUEST</p><span data-save-state></span></div><button type="button" class="draft-button" data-save-draft>Save as Draft</button></div><ol class="step-progress">${steps.map((label, index) => `<li class="${index === draft.step ? 'current' : index < draft.step ? 'complete' : ''}"><button type="button" data-step="${index}" ${index > draft.step ? 'disabled' : ''}><span>${String(index + 1).padStart(2, '0')}</span><b>${label}</b></button><i></i></li>`).join('')}</ol><form class="project-step-form" data-project-form novalidate><div class="step-panel" data-step-panel>${formStep()}</div><div class="step-actions">${draft.step ? '<button type="button" class="dash-secondary" data-back>Back</button>' : '<a class="dash-secondary" href="/dashboard/projects" data-route>Cancel</a>'}<button type="submit" class="dash-primary">${draft.step === steps.length - 1 ? 'Submit Project Request' : `Continue ${icon('chevron')}`}</button></div></form></section>`;
}

function statusSteps(status) { const all = ['New Request', 'Under Review', 'Approved', 'In Development', 'Testing', 'Completed']; const aliases = { Planning: 'Approved', Draft: 'New Request', Submitted:'New Request', 'In Progress':'In Development', 'Awaiting Client Information':'Under Review','Proposal Sent':'Under Review','Need More Information': 'Under Review' }; const current = Math.max(0, all.indexOf(aliases[status] || status)); return `<ol class="project-timeline">${all.map((label, index) => `<li class="${index < current ? 'done' : index === current ? 'current' : ''}"><span>${index < current ? icon('check') : String(index + 1).padStart(2, '0')}</span><div><b>${label}</b><small>${index < current ? 'Completed' : index === current ? 'Current stage' : 'Pending'}</small></div></li>`).join('')}</ol>`; }
function detailView(id) {
  const project = state.projects.find(item => item.id === id);
  if (!project) return `<div class="dash-empty"><h2>Project not found</h2><p>This project is not available in your workspace.</p><a class="dash-primary" href="/dashboard/projects" data-route>Back to My Projects</a></div>`;
  const features = [...(project.features || []), ...(project.customFeatures || [])];
  return `<section class="project-workspace"><header><div><span class="status status-${project.status.toLowerCase().replaceAll(' ', '-')}"><i></i>${escapeHtml(project.status)}</span><h2>${escapeHtml(project.title)}</h2><p>Submitted ${formatDate(project.createdAt)}</p></div><button class="dash-secondary" type="button" data-project-menu>•••</button></header><div class="workspace-grid"><div class="workspace-main"><section class="workspace-card"><div class="card-title"><p>PROJECT INFORMATION</p><h3>Overview</h3></div><p class="workspace-copy">${escapeHtml(project.description || 'No description provided.')}</p><dl><div><dt>Goal</dt><dd>${escapeHtml(project.goal || 'Not provided')}</dd></div><div><dt>Target users</dt><dd>${escapeHtml(project.targetUsers || 'Not provided')}</dd></div><div><dt>Type</dt><dd>${escapeHtml(project.types?.join(', ') || 'Not specified')}</dd></div><div><dt>Budget</dt><dd>${escapeHtml(project.budget || 'Not specified')}</dd></div><div><dt>Timeline</dt><dd>${escapeHtml(project.timeline || 'Not specified')}</dd></div></dl></section><section class="workspace-card"><div class="card-title"><p>REQUIREMENTS</p><h3>Requested Features</h3></div><div class="feature-tags">${features.length ? features.map(value => `<span>${escapeHtml(value)}</span>`).join('') : '<p class="empty-mini">No features specified.</p>'}</div></section><section class="workspace-card"><div class="card-title"><p>FILES</p><h3>Attachments</h3></div>${project.files?.length ? `<div class="dashboard-files">${project.files.map(file => `<article><div class="file-type">${escapeHtml(file.name.split('.').at(-1).toUpperCase())}</div><div><b>${escapeHtml(file.name)}</b><small>${formatBytes(file.size)} · ${formatDate(project.createdAt)}</small></div>${file.id?`<a href="/api/client/files/${encodeURIComponent(file.id)}" target="_blank" rel="noopener">Download</a>`:`<small>Local reference — reselect to upload</small>`}</article>`).join('')}</div>` : '<p class="empty-mini">No files attached.</p>'}</section><section class="workspace-card"><div class="card-title"><p>COMMUNICATION</p><h3>Messages</h3></div><div class="message-empty"><p>Keep questions, files, and updates together in a private project conversation.</p><button class="dash-primary compact" type="button" data-discuss-project="${escapeHtml(project.id)}">Discuss This Project</button></div></section></div><aside class="workspace-side"><section class="workspace-card"><div class="card-title"><p>PROGRESS</p><h3>Project Timeline</h3></div>${statusSteps(project.status)}</section><section class="workspace-card"><div class="card-title"><p>ACTIVITY</p><h3>Latest updates</h3></div><ol class="activity-list">${project.activity.map(item => `<li><i></i><p>${escapeHtml(item.text)}<small>${formatDate(item.time)}</small></p></li>`).join('')}</ol></section></aside></div></section>`;
}
function filesView() { const files = state.projects.flatMap(project => (project.files || []).map(file => ({ ...file, project: project.title, date: project.createdAt }))); return `<section class="dash-section page-section"><div class="section-bar"><div><p>PRIVATE REFERENCES</p><h2>Files</h2></div></div>${files.length ? `<div class="dashboard-files">${files.map(file => `<article><div class="file-type">${escapeHtml(file.name.split('.').at(-1).toUpperCase())}</div><div><b>${escapeHtml(file.name)}</b><small>${escapeHtml(file.project)} · ${formatBytes(file.size)}</small></div><a href="/api/client/files/${encodeURIComponent(file.id)}" target="_blank" rel="noopener">Download</a></article>`).join('')}</div>` : `<div class="dash-empty compact-empty"><h3>No project files yet</h3><p>Files added to project requests will be organized here.</p></div>`}</section>`; }
function messagesView() { return messaging.view(); }

function profileView() { const p = state.profile; return `<section class="settings-layout"><aside><div class="profile-avatar">${escapeHtml((p.fullName || 'C').slice(0, 1).toUpperCase())}<button type="button" title="Profile image upload requires storage">+</button></div><h2>${escapeHtml(p.fullName || 'Your profile')}</h2><p>Keep essential contact details current.</p></aside><form class="settings-card" data-profile-form><div class="card-title"><p>PERSONAL DETAILS</p><h3>Profile information</h3></div><div class="form-grid">${field('Full name', 'fullName', p.fullName, 'autocomplete="name" required')}${field('Email', 'email', p.email, 'type="email" autocomplete="email" required')}${field('Phone', 'phone', p.phone, 'type="tel" autocomplete="tel"')}${field('Company name', 'company', p.company, 'autocomplete="organization"')}${field('Country', 'country', p.country, 'autocomplete="country-name"')}${field('Timezone', 'timezone', p.timezone)}</div><button class="dash-primary" type="submit">Save Profile</button></form></section>`; }
function settingsView() { const p = state.preferences; return `<div class="settings-stack"><form class="settings-card" data-password-form><div class="card-title"><p>SECURITY</p><h3>Change password</h3></div><div class="form-grid">${field('Current password', 'currentPassword', '', 'type="password" autocomplete="current-password" required')}${field('New password', 'newPassword', '', 'type="password" autocomplete="new-password" minlength="8" required')}${field('Confirm new password', 'confirmPassword', '', 'type="password" autocomplete="new-password" minlength="8" required')}</div><button class="dash-primary" type="submit" ${siteConfig.authEndpoint ? '' : 'disabled'}>Update Password</button>${siteConfig.authEndpoint ? '' : '<p class="settings-note">Connect the authentication API to enable password updates.</p>'}</form><form class="settings-card" data-preferences-form><div class="card-title"><p>EMAIL PREFERENCES</p><h3>Notifications</h3></div><div class="preference-list">${[['projectUpdates', 'Project status updates'], ['messages', 'New messages'], ['account', 'Important account notices']].map(([name, label]) => `<label><span><b>${label}</b><small>Receive relevant updates by email.</small></span><input type="checkbox" name="${name}" ${p[name] ? 'checked' : ''}><i></i></label>`).join('')}</div><button class="dash-primary compact" type="submit">Save Preferences</button></form><section class="settings-card danger-card"><div class="card-title"><p>SESSIONS</p><h3>Account access</h3></div><p>Sign out from this browser. Signing out from all devices requires backend session support.</p><div><button class="dash-secondary" type="button" data-logout>Logout</button><button class="dash-secondary" type="button" disabled>Logout from all devices</button></div></section></div>`; }

function render() {
  messaging.unmount();
  const route = routeInfo();
  const views = { overview: overviewView, projects: projectsView, new: newProjectView, messages: messagesView, files: filesView, profile: profileView, settings: settingsView };
  const content = route.key === 'detail' ? detailView(route.id) : (views[route.key] || overviewView)();
  app.innerHTML = shell(content, route);
  bindShell();
  bindView(route);
  if (route.key === 'messages') messaging.mount(document.querySelector('#messages-root'));
  requestAnimationFrame(() => document.documentElement.classList.add('dashboard-ready'));
}

function bindShell() {
  document.querySelectorAll('[data-route]').forEach(link => link.addEventListener('click', event => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); navigate(link.getAttribute('href')); }));
  document.querySelector('[data-menu]')?.addEventListener('click', () => document.body.classList.add('menu-open'));
  document.querySelector('[data-menu-close]')?.addEventListener('click', () => document.body.classList.remove('menu-open'));
  document.querySelector('[data-notifications]')?.addEventListener('click', () => document.querySelector('[data-notification-panel]').classList.toggle('open'));
  document.querySelector('[data-user-menu]')?.addEventListener('click', () => document.querySelector('[data-user-panel]').classList.toggle('open'));
  document.querySelector('[data-read-all]')?.addEventListener('click', () => { state.notifications.forEach(item => { item.read = true; }); persist(); render(); });
  document.querySelectorAll('[data-logout]').forEach(button => button.addEventListener('click', async () => { try { await messaging.api('auth/logout',{method:'POST',body:{}}); sessionStorage.removeItem('northbyte-demo-session'); messaging.source?.close(); location.assign('/login'); } catch { toast('Sign out could not be completed. Please retry.','error'); } }));
}

function syncDraftFromForm(form) {
  const data = new FormData(form);
  ['title', 'description', 'goal', 'targetUsers', 'existingLabel', 'existingUrl', 'budget', 'timeline', 'customTimeline', 'notes'].forEach(name => { if (data.has(name)) draft[name] = String(data.get(name)); });
  if (form.querySelector('[name="types"]')) draft.types = data.getAll('types').map(String);
  if (form.querySelector('[name="features"]')) draft.features = data.getAll('features').map(String);
}
function validateStep(form) {
  syncDraftFromForm(form);
  form.querySelectorAll('.field-message').forEach(element => { element.textContent = ''; });
  if (draft.step === 0 && !draft.title.trim()) { form.querySelector('[data-error-for="title"]').textContent = 'Please enter a project title.'; form.elements.title.focus(); return false; }
  if (draft.step === 0 && !draft.types.length) { toast('Select at least one project type.', 'error'); return false; }
  if (draft.step === 1 && !draft.description.trim()) { form.querySelector('[data-error-for="description"]').textContent = 'Please describe your project idea.'; form.elements.description.focus(); return false; }
  return true;
}
function handleFiles(files) {
  [...files].forEach(file => {
    const rule = allowedFiles.get(file.type);
    const extension = file.name.split('.').at(-1).toLowerCase();
    if (!rule || !rule.extensions.includes(extension)) { toast(`${file.name}: unsupported file type.`, 'error'); return; }
    if (file.size > rule.limit) { toast(`${file.name}: file is too large.`, 'error'); return; }
    const safeName = file.name.replace(/[^a-zA-Z0-9._ -]/g, '_').slice(0, 120);
    transientFiles.push({ file, name: safeName, size: file.size, type: file.type, preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : '' });
  });
  draft.files = transientFiles.map(({ name, size, type }) => ({ name, size, type }));
  persistDraft(false); render();
}
async function submitProject() {
  const project = { ...draft, id: crypto.randomUUID(), status: siteConfig.projectApiBase ? 'New Request' : 'Draft', files: transientFiles.map(({ name, size, type }) => ({ name, size, type })), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), activity: [{ text: siteConfig.projectApiBase ? 'Project submitted' : 'Project saved locally', time: new Date().toISOString() }] };
  if (siteConfig.projectApiBase) {
    const payload = new FormData(); payload.append('project', JSON.stringify({ ...project, files: undefined })); transientFiles.forEach(item => payload.append('files[]', item.file, item.name));
    const response = await fetch(`${siteConfig.projectApiBase.replace(/\/$/, '')}/projects`, { method: 'POST', credentials: 'same-origin', headers:{'X-CSRF-Token':messaging.csrf,Accept:'application/json'}, body: payload });
    if (!response.ok) throw new Error('Submission failed');
    Object.assign(project, await response.json(),{server:true});
  }
  state.projects.unshift(project); state.notifications.unshift({ id: crypto.randomUUID(), text: siteConfig.projectApiBase ? 'Your project request was submitted.' : 'Your project draft was saved in this browser.', time: new Date().toISOString(), read: false }); persist(); try { localStorage.removeItem(draftKey); } catch { storageAvailable = false; } draft = emptyDraft(); transientFiles.forEach(file => { if (file.preview) URL.revokeObjectURL(file.preview); }); transientFiles = [];
  app.querySelector('#dashboard-content').innerHTML = `<div class="submission-success"><div>${icon('check')}</div><p>${siteConfig.projectApiBase ? 'PROJECT SUBMITTED' : 'LOCAL PREVIEW SAVED'}</p><h2>${siteConfig.projectApiBase ? 'Your project request has been submitted.' : 'Your project request is saved in this browser.'}</h2><span>${siteConfig.projectApiBase ? 'Our team will review your requirements and update you here.' : 'Connect the secure project API before using this workflow with real client data.'}</span><div><a class="dash-primary" href="/dashboard/projects/${encodeURIComponent(project.id)}" data-route>View Project</a><button class="dash-secondary" type="button" data-discuss-project="${escapeHtml(project.id)}">Discuss This Project</button></div></div>`;
  bindShell(); bindView({key:'success'});
}
function bindProjectForm() {
  const form = document.querySelector('[data-project-form]'); if (!form) return;
  form.addEventListener('input', () => { syncDraftFromForm(form); scheduleDraftSave(); });
  form.addEventListener('change', event => { syncDraftFromForm(form); if (event.target.matches('[type="checkbox"],[type="radio"]')) render(); else scheduleDraftSave(); });
  form.addEventListener('submit', async event => { event.preventDefault(); if (!validateStep(form)) return; if (draft.step < steps.length - 1) { draft.step += 1; persistDraft(false); render(); return; } const button = form.querySelector('[type="submit"]'); button.disabled = true; button.textContent = 'Submitting…'; try { await submitProject(); } catch { button.disabled = false; button.textContent = 'Submit Project Request'; toast('The project could not be submitted. Please try again.', 'error'); } });
  document.querySelector('[data-back]')?.addEventListener('click', () => { syncDraftFromForm(form); draft.step -= 1; persistDraft(false); render(); });
  document.querySelector('[data-save-draft]')?.addEventListener('click', () => { syncDraftFromForm(form); persistDraft(true); toast('Draft saved in this browser.'); });
  document.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => { syncDraftFromForm(form); draft.step = Number(button.dataset.step); render(); }));
  document.querySelectorAll('[data-edit-step]').forEach(button => button.addEventListener('click', () => { draft.step = Number(button.dataset.editStep); render(); }));
  document.querySelector('[data-add-feature]')?.addEventListener('click', () => { const input = document.querySelector('[data-custom-feature]'); const value = input.value.trim(); if (value && !draft.customFeatures.includes(value)) { draft.customFeatures.push(value); persistDraft(false); render(); } });
  document.querySelectorAll('[data-remove-feature]').forEach(button => button.addEventListener('click', () => { draft.customFeatures.splice(Number(button.dataset.removeFeature), 1); persistDraft(false); render(); }));
  const fileInput = document.querySelector('[data-file-input]'); document.querySelector('[data-choose-files]')?.addEventListener('click', () => fileInput.click()); fileInput?.addEventListener('change', () => handleFiles(fileInput.files));
  const dropZone = document.querySelector('[data-drop-zone]'); if (dropZone) { ['dragenter', 'dragover'].forEach(type => dropZone.addEventListener(type, event => { event.preventDefault(); dropZone.classList.add('dragging'); })); ['dragleave', 'drop'].forEach(type => dropZone.addEventListener(type, event => { event.preventDefault(); dropZone.classList.remove('dragging'); })); dropZone.addEventListener('drop', event => handleFiles(event.dataTransfer.files)); dropZone.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); fileInput.click(); } }); }
  document.querySelectorAll('[data-remove-file]').forEach(button => button.addEventListener('click', () => { const [removed] = transientFiles.splice(Number(button.dataset.removeFile), 1); if (removed?.preview) URL.revokeObjectURL(removed.preview); persistDraft(false); render(); }));
}
function bindView(route) {
  if (route.key === 'new') bindProjectForm();
  document.querySelectorAll('[data-discuss-project]').forEach(button=>button.addEventListener('click',async()=>{button.disabled=true;try{const project=state.projects.find(p=>p.id===button.dataset.discussProject);navigate(await openProjectDiscussion(project));}catch(error){toast(error.message,'error');button.disabled=false;}}));
  document.querySelector('[data-profile-form]')?.addEventListener('submit', event => { event.preventDefault(); const data = new FormData(event.currentTarget); Object.assign(state.profile, Object.fromEntries(data)); persist(); toast('Profile saved.'); render(); });
  document.querySelector('[data-preferences-form]')?.addEventListener('submit', event => { event.preventDefault(); const data = new FormData(event.currentTarget); Object.keys(state.preferences).forEach(key => { state.preferences[key] = data.has(key); }); persist(); toast('Email preferences saved.'); });
  document.querySelector('[data-password-form]')?.addEventListener('submit', event => event.preventDefault());
}


async function loadServerProjects(){
 try{const response=await fetch('/api/client/projects?per_page=100',{credentials:'same-origin',headers:{Accept:'application/json'}});if(!response.ok)return;const result=await response.json();const local=state.projects;const ids=new Set(result.data.map(p=>p.id));state.projects=[...result.data.map(p=>({...local.find(x=>x.id===p.id),...p,server:true})),...local.filter(p=>!ids.has(p.id)&&!p.server).map(p=>({...p,localOnly:true}))];persist();}catch{toast('Project service is unavailable. Your saved drafts are still available.','error');}
}
async function openProjectDiscussion(project){
 if(project.localOnly){const response=await fetch('/api/client/projects/import',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json',Accept:'application/json','X-CSRF-Token':messaging.csrf},body:JSON.stringify(project)});if(!response.ok)throw new Error('Project could not be synchronized.');const saved=await response.json();Object.assign(project,saved,{server:true,localOnly:false});persist();}
 const response=await fetch('/api/client/projects/'+encodeURIComponent(project.id)+'/discuss',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json',Accept:'application/json','X-CSRF-Token':messaging.csrf},body:'{}'});if(!response.ok)throw new Error('The project conversation could not be opened.');const data=await response.json();await messaging.refreshInbox();return '/dashboard/messages?conversation='+encodeURIComponent(data.conversation_id);
}

async function initialize() {
  document.documentElement.lang = 'en'; document.documentElement.dir = 'ltr';
  if (!reducedMotion.matches) document.documentElement.classList.add('motion-enabled');
  if (siteConfig.sessionEndpoint) {
    try { const response = await fetch(siteConfig.sessionEndpoint, { credentials: 'same-origin', headers: { Accept: 'application/json' } }); if (!response.ok) { location.replace('/login'); return; } const session = await response.json(); if(session.user?.role !== 'client'){location.replace('/admin/dashboard');return;} if (session.user) { const fallback = state.profile.email === session.user.email ? structuredClone(state) : { profile: {}, projects: [], notifications: [], preferences: {projectUpdates:true,messages:true,account:true} }; storageKey += ':' + session.user.id; draftKey += ':' + session.user.id; Object.assign(state, loadJson(storageKey, fallback)); draft = { ...emptyDraft(), ...loadJson(draftKey, {}) }; Object.assign(state.profile, session.user); } messaging.getProjects=()=>state.projects; messaging.configure(session.user,session.csrf,{toast,onUnread:count=>{document.querySelectorAll('[data-message-unread]').forEach(element=>{element.textContent=count;element.hidden=!count;});}}); } catch { app.innerHTML = '<div class="dashboard-boot error">The secure workspace could not be reached. Please try again.</div>'; return; }
  } else if (siteConfig.demoAuth?.enabled) {
    try {
      const demoUser = JSON.parse(sessionStorage.getItem('northbyte-demo-session'));
      if (!demoUser?.email || demoUser.email !== siteConfig.demoAuth.user.email) { location.replace('/login'); return; }
      Object.assign(state.profile, demoUser);
    } catch { location.replace('/login'); return; }
  }
  await loadServerProjects();
  render();
}
window.addEventListener('popstate', render);
initialize();
