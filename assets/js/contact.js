/* ===========================================================
   contact.js — contact form validation
   =========================================================== */

import { initI18n, getLang, t } from './i18n.js?v=6';

function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function showFieldError(field, show) {
  const wrap = field.closest('.field');
  if (!wrap) return;
  wrap.classList.toggle('has-error', show);
}

function showToast(msg, type = 'success') {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.className = `toast toast--${type} is-visible`;
  toast.textContent = msg;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('is-visible'), 3200);
}

function validate(form) {
  let valid = true;
  form.querySelectorAll('[data-required]').forEach((field) => {
    const v = field.value.trim();
    if (!v) { showFieldError(field, true); valid = false; }
    else showFieldError(field, false);
  });
  const email = form.querySelector('[data-email]');
  if (email && email.value.trim() && !isEmail(email.value.trim())) {
    showFieldError(email, true);
    valid = false;
  }
  return valid;
}

function initForm() {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate(form)) {
      showToast(t('contact.form.error_required'), 'error');
      return;
    }
    showToast(t('contact.form.success'), 'success');
    form.reset();
  });

  // Clear error on input
  form.querySelectorAll('input, textarea, select').forEach((el) => {
    el.addEventListener('input', () => showFieldError(el, false));
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initI18n();
  initForm();
});

export { initForm, showToast };