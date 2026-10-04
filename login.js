import { siteConfig } from './site.config.js';
import { bindCursorMotion } from './cursor-motion.js';

const copy = {
  en: {
    pageTitle: `${siteConfig.brand} — Client login`, back: 'Back to website', eyebrow: 'NORTHBYTE WORKSPACE', build: 'Build.', deploy: 'Deploy.', scale: 'Scale.',
    story: 'Engineering modern digital products from interface to infrastructure.', portal: 'CLIENT PORTAL', secure: 'SECURE WORKSPACE ACCESS', welcome: 'Welcome back', intro: 'Sign in to continue to your workspace.',
    email: 'Email', password: 'Password', remember: 'Remember me', forgot: 'Forgot password?', signIn: 'Sign in', signingIn: 'Signing in…', signedIn: 'Signed in', encrypted: 'ENCRYPTED CONNECTION', newAccount: 'New to NorthByte?', createAccount: 'Create an account',
    language: 'فارسی', languageLabel: 'Switch to Persian', showPassword: 'Show password', hidePassword: 'Hide password', requiredEmail: 'Enter your email address.', invalidEmail: 'Enter a valid email address.', requiredPassword: 'Enter your password.', shortPassword: 'Use at least 8 characters.', unavailable: 'Workspace access is not connected yet. Please contact the NorthByte team.', recovery: 'Password recovery is not connected yet. Please contact the NorthByte team.', invalid: 'Email or password is incorrect.', error: 'We could not sign you in. Please try again.'
  },
  fa: {
    pageTitle: `${siteConfig.brand} — ورود مشتریان`, back: 'بازگشت به وب‌سایت', eyebrow: 'فضای کاری NORTHBYTE', build: 'ساخت.', deploy: 'استقرار.', scale: 'رشد.',
    story: 'مهندسی محصولات دیجیتال مدرن؛ از رابط کاربری تا زیرساخت.', portal: 'پرتال مشتریان', secure: 'دسترسی امن به فضای کاری', welcome: 'خوش آمدید', intro: 'برای ادامه، وارد فضای کاری خود شوید.',
    email: 'ایمیل', password: 'رمز عبور', remember: 'مرا به خاطر بسپار', forgot: 'رمز عبور را فراموش کرده‌اید؟', signIn: 'ورود', signingIn: 'در حال ورود…', signedIn: 'وارد شدید', encrypted: 'اتصال رمزگذاری‌شده', newAccount: 'حساب کاربری ندارید؟', createAccount: 'ساخت حساب',
    language: 'English', languageLabel: 'Switch to English', showPassword: 'نمایش رمز عبور', hidePassword: 'پنهان کردن رمز عبور', requiredEmail: 'ایمیل خود را وارد کنید.', invalidEmail: 'یک ایمیل معتبر وارد کنید.', requiredPassword: 'رمز عبور خود را وارد کنید.', shortPassword: 'حداقل ۸ نویسه وارد کنید.', unavailable: 'دسترسی به فضای کاری هنوز متصل نشده است. با تیم NorthByte تماس بگیرید.', recovery: 'بازیابی رمز عبور هنوز متصل نشده است. با تیم NorthByte تماس بگیرید.', invalid: 'ایمیل یا رمز عبور درست نیست.', error: 'ورود انجام نشد. دوباره تلاش کنید.'
  }
};

const root = document.documentElement;
const card = document.querySelector('[data-login-card]');
const form = document.querySelector('#login-form');
const email = document.querySelector('#login-email');
const password = document.querySelector('#login-password');
const status = document.querySelector('#login-status');
const submit = document.querySelector('.login-submit');
const submitLabel = submit.querySelector('.submit-label');
const passwordToggle = document.querySelector('.password-toggle');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let language = 'en';
try { language = localStorage.getItem('webteam-language') === 'fa' ? 'fa' : 'en'; } catch { /* Keep the English default. */ }

function applyLanguage() {
  const c = copy[language];
  root.lang = language;
  root.dir = language === 'fa' ? 'rtl' : 'ltr';
  document.title = c.pageTitle;
  document.querySelectorAll('[data-copy]').forEach(element => { element.textContent = c[element.dataset.copy]; });
  const languageButton = document.querySelector('[data-login-language]');
  languageButton.setAttribute('aria-label', c.languageLabel);
  languageButton.lastElementChild.textContent = c.language;
  languageButton.lastElementChild.lang = language === 'en' ? 'fa' : 'en';
  passwordToggle.setAttribute('aria-label', password.type === 'password' ? c.showPassword : c.hidePassword);
}

function fieldMessage(field) {
  const c = copy[language];
  if (field === email) return field.validity.valueMissing ? c.requiredEmail : field.validity.typeMismatch ? c.invalidEmail : '';
  return field.validity.valueMissing ? c.requiredPassword : field.validity.tooShort ? c.shortPassword : '';
}

function validateField(field) {
  const message = fieldMessage(field);
  const wrapper = field.closest('[data-field]');
  wrapper.classList.toggle('has-error', Boolean(message));
  wrapper.querySelector('.field-error').textContent = message;
  field.setAttribute('aria-invalid', String(Boolean(message)));
  return !message;
}

function setState(state, message = '') {
  card.classList.remove('is-error', 'is-success');
  submit.classList.remove('is-loading', 'is-success');
  submit.disabled = false;
  status.className = 'login-status';
  if (state === 'loading') {
    submit.classList.add('is-loading');
    submit.disabled = true;
    submitLabel.textContent = copy[language].signingIn;
  } else if (state === 'success') {
    submit.classList.add('is-success');
    card.classList.add('is-success');
    submit.disabled = true;
    submitLabel.textContent = copy[language].signedIn;
  } else {
    submitLabel.textContent = copy[language].signIn;
    if (state === 'error') {
      card.classList.add('is-error');
      status.classList.add('error');
    }
  }
  status.textContent = message;
}

document.querySelector('[data-login-language]').addEventListener('click', () => {
  language = language === 'en' ? 'fa' : 'en';
  try { localStorage.setItem('webteam-language', language); } catch { /* Preference remains in memory. */ }
  applyLanguage();
  [email, password].forEach(field => { if (field.getAttribute('aria-invalid') === 'true') validateField(field); });
  setState('', '');
});

passwordToggle.addEventListener('click', () => {
  const visible = password.type === 'password';
  password.type = visible ? 'text' : 'password';
  passwordToggle.setAttribute('aria-pressed', String(visible));
  passwordToggle.setAttribute('aria-label', visible ? copy[language].hidePassword : copy[language].showPassword);
  password.focus({ preventScroll: true });
});

[email, password].forEach(field => {
  field.addEventListener('blur', () => validateField(field));
  field.addEventListener('input', () => {
    if (field.getAttribute('aria-invalid') === 'true') validateField(field);
    card.classList.remove('is-error');
    status.textContent = '';
  });
});

document.querySelector('[data-forgot]').addEventListener('click', event => {
  event.preventDefault();
  setState('error', copy[language].recovery);
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  const valid = [email, password].map(validateField).every(Boolean);
  if (!valid) {
    card.classList.remove('is-error');
    requestAnimationFrame(() => card.classList.add('is-error'));
    form.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }

  setState('loading');
  if (!siteConfig.authEndpoint) {
    await new Promise(resolve => setTimeout(resolve, reducedMotion.matches ? 0 : 420));
    if (siteConfig.demoAuth?.enabled) {
      const validDemo = email.value.trim().toLowerCase() === siteConfig.demoAuth.email.toLowerCase() && password.value === siteConfig.demoAuth.password;
      if (!validDemo) { setState('error', copy[language].invalid); return; }
      try { sessionStorage.setItem('northbyte-demo-session', JSON.stringify(siteConfig.demoAuth.user)); } catch { setState('error', copy[language].error); return; }
      setState('success');
      setTimeout(() => { root.classList.add('page-leaving'); window.location.assign(siteConfig.postLoginPath || '/dashboard'); }, reducedMotion.matches ? 0 : 520);
      return;
    }
    setState('error', copy[language].unavailable);
    return;
  }

  try {
    const response = await fetch(siteConfig.authEndpoint, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email: email.value.trim(), password: password.value, remember: form.elements.remember.checked })
    });
    if (!response.ok) {
      setState('error', response.status === 401 ? copy[language].invalid : copy[language].error);
      return;
    }
    setState('success');
    setTimeout(() => { root.classList.add('page-leaving'); window.location.assign(siteConfig.postLoginPath || '/'); }, reducedMotion.matches ? 0 : 520);
  } catch {
    setState('error', copy[language].error);
  }
});

if (!reducedMotion.matches) {
  root.classList.add('motion-enabled');
  bindCursorMotion(card);
}

document.querySelectorAll('a[href="/"]').forEach(link => link.addEventListener('click', event => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  root.classList.add('page-leaving');
  setTimeout(() => window.location.assign('/'), reducedMotion.matches ? 0 : 180);
}));

document.querySelector('a[href="/register"]').addEventListener('click', event => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  root.classList.add('page-leaving');
  setTimeout(() => window.location.assign('/register'), reducedMotion.matches ? 0 : 180);
});

applyLanguage();
requestAnimationFrame(() => root.classList.add('login-ready'));
