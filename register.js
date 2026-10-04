import { siteConfig } from './site.config.js';
import { bindCursorMotion } from './cursor-motion.js';

const copy = {
  en: {
    pageTitle: `${siteConfig.brand} — Create account`, back: 'Back to website', eyebrow: 'JOIN THE WORKSPACE', start: 'Start.', build: 'Build.', grow: 'Grow.', story: 'One secure account for projects, delivery updates, and collaboration.', portal: 'CLIENT PORTAL', secure: 'SECURE WORKSPACE ACCESS', title: 'Create account', intro: 'Set up your details to request workspace access.', name: 'Full name', email: 'Work email', password: 'Password', confirm: 'Confirm password', terms: 'I agree to the account and privacy terms.', create: 'Create account', creating: 'Creating account…', created: 'Account created', haveAccount: 'Already have an account?', signIn: 'Sign in', encrypted: 'ENCRYPTED CONNECTION', language: 'فارسی', languageLabel: 'Switch to Persian', showPassword: 'Show password', hidePassword: 'Hide password', requiredName: 'Enter your full name.', requiredEmail: 'Enter your email address.', invalidEmail: 'Enter a valid email address.', requiredPassword: 'Create a password.', shortPassword: 'Use at least 8 characters.', requiredConfirm: 'Confirm your password.', mismatch: 'Passwords do not match.', requiredTerms: 'Please accept the terms to continue.', unavailable: 'Account registration is not connected yet. Please contact the NorthByte team.', conflict: 'An account already exists for this email.', error: 'We could not create your account. Please try again.'
  },
  fa: {
    pageTitle: `${siteConfig.brand} — ساخت حساب`, back: 'بازگشت به وب‌سایت', eyebrow: 'پیوستن به فضای کاری', start: 'شروع.', build: 'ساخت.', grow: 'رشد.', story: 'یک حساب امن برای پروژه‌ها، گزارش تحویل و همکاری تیمی.', portal: 'پرتال مشتریان', secure: 'دسترسی امن به فضای کاری', title: 'ساخت حساب', intro: 'مشخصات خود را برای درخواست دسترسی وارد کنید.', name: 'نام کامل', email: 'ایمیل کاری', password: 'رمز عبور', confirm: 'تکرار رمز عبور', terms: 'با شرایط حساب و حریم خصوصی موافقم.', create: 'ساخت حساب', creating: 'در حال ساخت حساب…', created: 'حساب ساخته شد', haveAccount: 'از قبل حساب دارید؟', signIn: 'ورود', encrypted: 'اتصال رمزگذاری‌شده', language: 'English', languageLabel: 'Switch to English', showPassword: 'نمایش رمز عبور', hidePassword: 'پنهان کردن رمز عبور', requiredName: 'نام کامل خود را وارد کنید.', requiredEmail: 'ایمیل خود را وارد کنید.', invalidEmail: 'یک ایمیل معتبر وارد کنید.', requiredPassword: 'یک رمز عبور بسازید.', shortPassword: 'حداقل ۸ نویسه وارد کنید.', requiredConfirm: 'رمز عبور را دوباره وارد کنید.', mismatch: 'رمزهای عبور یکسان نیستند.', requiredTerms: 'برای ادامه، شرایط را بپذیرید.', unavailable: 'ثبت‌نام هنوز متصل نشده است. با تیم NorthByte تماس بگیرید.', conflict: 'برای این ایمیل قبلاً حساب ساخته شده است.', error: 'ساخت حساب انجام نشد. دوباره تلاش کنید.'
  }
};

const root = document.documentElement;
const card = document.querySelector('[data-register-card]');
const form = document.querySelector('#register-form');
const nameField = document.querySelector('#register-name');
const email = document.querySelector('#register-email');
const password = document.querySelector('#register-password');
const confirmPassword = document.querySelector('#register-confirm');
const terms = form.elements.terms;
const status = document.querySelector('#register-status');
const submit = document.querySelector('.register-submit');
const submitLabel = submit.querySelector('.submit-label');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let language = 'en';
try { language = localStorage.getItem('webteam-language') === 'fa' ? 'fa' : 'en'; } catch { /* Keep the English default. */ }

function applyLanguage() {
  const c = copy[language];
  root.lang = language;
  root.dir = language === 'fa' ? 'rtl' : 'ltr';
  document.title = c.pageTitle;
  document.querySelectorAll('[data-copy]').forEach(element => { element.textContent = c[element.dataset.copy]; });
  const languageButton = document.querySelector('[data-register-language]');
  languageButton.setAttribute('aria-label', c.languageLabel);
  languageButton.lastElementChild.textContent = c.language;
  languageButton.lastElementChild.lang = language === 'en' ? 'fa' : 'en';
  document.querySelectorAll('[data-password-toggle]').forEach(button => {
    const field = document.getElementById(button.dataset.passwordToggle);
    button.setAttribute('aria-label', field.type === 'password' ? c.showPassword : c.hidePassword);
  });
}

function fieldMessage(field) {
  const c = copy[language];
  if (field === nameField) return field.validity.valueMissing ? c.requiredName : '';
  if (field === email) return field.validity.valueMissing ? c.requiredEmail : field.validity.typeMismatch ? c.invalidEmail : '';
  if (field === password) return field.validity.valueMissing ? c.requiredPassword : field.validity.tooShort ? c.shortPassword : '';
  if (field === confirmPassword) return field.validity.valueMissing ? c.requiredConfirm : field.value !== password.value ? c.mismatch : '';
  return '';
}

function validateField(field) {
  const message = fieldMessage(field);
  const wrapper = field.closest('[data-field]');
  wrapper.classList.toggle('has-error', Boolean(message));
  wrapper.querySelector('.field-error').textContent = message;
  field.setAttribute('aria-invalid', String(Boolean(message)));
  return !message;
}

function validateTerms() {
  const valid = terms.checked;
  document.querySelector('.register-consent').classList.toggle('has-error', !valid);
  terms.setAttribute('aria-invalid', String(!valid));
  return valid;
}

function setState(state, message = '') {
  card.classList.remove('is-error', 'is-success');
  submit.classList.remove('is-loading', 'is-success');
  submit.disabled = false;
  status.className = 'login-status';
  if (state === 'loading') { submit.classList.add('is-loading'); submit.disabled = true; submitLabel.textContent = copy[language].creating; }
  else if (state === 'success') { submit.classList.add('is-success'); card.classList.add('is-success'); submit.disabled = true; submitLabel.textContent = copy[language].created; }
  else { submitLabel.textContent = copy[language].create; if (state === 'error') { card.classList.add('is-error'); status.classList.add('error'); } }
  status.textContent = message;
}

document.querySelector('[data-register-language]').addEventListener('click', () => {
  language = language === 'en' ? 'fa' : 'en';
  try { localStorage.setItem('webteam-language', language); } catch { /* Preference remains in memory. */ }
  applyLanguage();
  [nameField, email, password, confirmPassword].forEach(field => { if (field.getAttribute('aria-invalid') === 'true') validateField(field); });
  setState('', '');
});

document.querySelectorAll('[data-password-toggle]').forEach(button => button.addEventListener('click', () => {
  const field = document.getElementById(button.dataset.passwordToggle);
  const visible = field.type === 'password';
  field.type = visible ? 'text' : 'password';
  button.setAttribute('aria-pressed', String(visible));
  button.setAttribute('aria-label', visible ? copy[language].hidePassword : copy[language].showPassword);
  field.focus({ preventScroll: true });
}));

[nameField, email, password, confirmPassword].forEach(field => {
  field.addEventListener('blur', () => validateField(field));
  field.addEventListener('input', () => {
    if (field.getAttribute('aria-invalid') === 'true') validateField(field);
    if (field === password && confirmPassword.value) validateField(confirmPassword);
    card.classList.remove('is-error'); status.textContent = '';
  });
});
terms.addEventListener('change', () => { validateTerms(); status.textContent = ''; });

form.addEventListener('submit', async event => {
  event.preventDefault();
  const validFields = [nameField, email, password, confirmPassword].map(validateField).every(Boolean);
  const accepted = validateTerms();
  if (!validFields || !accepted) {
    setState('error', accepted ? '' : copy[language].requiredTerms);
    form.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }
  setState('loading');
  if (!siteConfig.registerEndpoint) {
    await new Promise(resolve => setTimeout(resolve, reducedMotion.matches ? 0 : 420));
    setState('error', copy[language].unavailable);
    return;
  }
  try {
    const response = await fetch(siteConfig.registerEndpoint, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify({ name: nameField.value.trim(), email: email.value.trim(), password: password.value }) });
    if (!response.ok) { setState('error', response.status === 409 ? copy[language].conflict : copy[language].error); return; }
    setState('success');
    setTimeout(() => { root.classList.add('page-leaving'); window.location.assign('/login'); }, reducedMotion.matches ? 0 : 520);
  } catch { setState('error', copy[language].error); }
});

if (!reducedMotion.matches) {
  root.classList.add('motion-enabled');
  bindCursorMotion(card, { tiltX: 1.15, tiltY: 1.45 });
}

document.querySelectorAll('a[href="/"],a[href="/login"]').forEach(link => link.addEventListener('click', event => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  root.classList.add('page-leaving');
  setTimeout(() => window.location.assign(link.getAttribute('href')), reducedMotion.matches ? 0 : 180);
}));

applyLanguage();
requestAnimationFrame(() => root.classList.add('login-ready'));
