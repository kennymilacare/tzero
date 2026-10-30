/* ===========================================================
   main.js — shared interactions: scroll reveal,
   newsletter form, header shadow on scroll, search.
   =========================================================== */

import { initI18n, t, getLang } from './i18n.js?v=7';
import { products, productUrl } from './data.js?v=25';
import { assetUrl } from './paths.js?v=2';

/* ---------- Header shadow on scroll ---------- */
function initHeaderScroll() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const onScroll = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ---------- Reveal-on-scroll ---------- */
function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  if (!('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.1 }
  );

  els.forEach((el) => io.observe(el));
}

/* ---------- Newsletter ---------- */
function initNewsletter() {
  const form = document.querySelector('[data-newsletter]');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = form.querySelector('input[type="email"]').value.trim();
    if (!email || !email.includes('@')) {
      showToast(t('home.contact.form.error_email'), 'error');
      return;
    }
    showToast(t('footer.newsletter.success'), 'success');
    form.reset();
  });
}

/* ---------- Toast ---------- */
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
  showToast._t = setTimeout(() => {
    toast.classList.remove('is-visible');
  }, 2800);
}

/* expose globally for other scripts */
window.showToast = showToast;

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initI18n();
  initHeaderScroll();
  initReveal();
  initNewsletter();
  initSearch();
  initFlipCards();
  initLightbox();
});

/* ---------- About page flip card (hover-to-flip) ---------- */
function initFlipCards() {
  const flips = document.querySelectorAll('[data-flip]');
  if (!flips.length) return;

  // honour reduced-motion preference
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  flips.forEach((root) => {
    const zones = root.querySelectorAll('[data-flip-page]');
    const dots = root.querySelectorAll('.about-flip__dot');
    const faces = root.querySelectorAll('.about-flip__face');
    if (!zones.length || !faces.length) return;

    let current = 0;
    let timer = null;

    const setPage = (idx, immediate = false) => {
      if (idx === current) return;
      current = idx;
      const flipped = idx === 1;
      if (immediate) {
        const stage = root.querySelector('.about-flip__stage');
        if (stage) stage.style.transition = 'none';
        root.classList.toggle('is-flipped', flipped);
        if (stage) {
          void stage.offsetWidth;
          stage.style.transition = '';
        }
      } else {
        root.classList.toggle('is-flipped', flipped);
      }
      faces.forEach((f) => {
        const isFront = f.classList.contains('about-flip__face--front');
        const visible = flipped ? !isFront : isFront;
        f.setAttribute('aria-hidden', String(!visible));
      });
      dots.forEach((d, i) => {
        d.classList.toggle('is-active', i === idx);
        d.setAttribute('aria-selected', String(i === idx));
      });
    };

    zones.forEach((zone) => {
      const idx = Number(zone.getAttribute('data-flip-page')) || 0;
      zone.addEventListener('mouseenter', () => {
        if (timer) { clearTimeout(timer); timer = null; }
        if (reduceMotion) setPage(idx, true); else setPage(idx);
      });
      zone.addEventListener('focus', () => {
        if (reduceMotion) setPage(idx, true); else setPage(idx);
      });
    });

    root.addEventListener('mouseleave', () => {
      if (reduceMotion) {
        setPage(0, true);
      } else {
        timer = setTimeout(() => setPage(0), 120);
      }
    });

    // click on either zone → open lightbox of the *currently visible* page
    zones.forEach((zone) => {
      zone.addEventListener('click', (e) => {
        e.preventDefault();
        const face = root.classList.contains('is-flipped')
          ? root.querySelector('.about-flip__face--back')
          : root.querySelector('.about-flip__face--front');
        const img = face ? face.querySelector('img') : null;
        if (img && window.__openLightbox) {
          const sources = Array.from(root.querySelectorAll('.about-flip__face img'))
            .map((i) => ({ src: i.currentSrc || i.src, alt: i.alt }));
          const startIndex = root.classList.contains('is-flipped') ? 1 : 0;
          window.__openLightbox(sources, startIndex);
        }
      });
    });
  });
}

/* ---------- Lightbox ---------- */
function initLightbox() {
  const lb = document.querySelector('[data-lightbox]');
  if (!lb) return;
  const img = lb.querySelector('[data-lightbox-img]');
  const closeBtn = lb.querySelector('[data-lightbox-close]');
  const prevBtn = lb.querySelector('[data-lightbox-prev]');
  const nextBtn = lb.querySelector('[data-lightbox-next]');

  let sources = [];
  let index = 0;
  let lastFocus = null;

  const render = () => {
    const item = sources[index];
    if (!item) return;
    img.src = item.src;
    img.alt = item.alt || '';
    if (sources.length <= 1) {
      prevBtn.hidden = true;
      nextBtn.hidden = true;
    } else {
      prevBtn.hidden = false;
      nextBtn.hidden = false;
    }
  };

  const open = (items, start = 0) => {
    if (!items || !items.length) return;
    sources = items;
    index = Math.max(0, Math.min(start, items.length - 1));
    lastFocus = document.activeElement;
    lb.hidden = false;
    // force reflow before adding the open class so the transition runs
    void lb.offsetWidth;
    lb.classList.add('is-open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    render();
    setTimeout(() => closeBtn.focus(), 50);
  };

  const close = () => {
    lb.classList.remove('is-open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    setTimeout(() => {
      lb.hidden = true;
      img.src = '';
    }, 320);
    if (lastFocus && typeof lastFocus.focus === 'function') {
      lastFocus.focus();
    }
  };

  const prev = () => { if (sources.length > 1) { index = (index - 1 + sources.length) % sources.length; render(); } };
  const next = () => { if (sources.length > 1) { index = (index + 1) % sources.length; render(); } };

  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', (e) => { e.stopPropagation(); prev(); });
  nextBtn.addEventListener('click', (e) => { e.stopPropagation(); next(); });
  lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') { close(); }
    else if (e.key === 'ArrowLeft') { prev(); }
    else if (e.key === 'ArrowRight') { next(); }
  });

  window.__openLightbox = open;
}

/* ---------- Search modal ---------- */
function initSearch() {
  const openers = document.querySelectorAll('[data-search-open]');
  if (!openers.length) return;

  /* Build static pages index */
  const pages = [
    { title: { zh: '首頁', en: 'Home', ja: 'ホーム' },         url: 'index.html',         desc: { zh: 'T-ZERO 第九感', en: 'T-ZERO NINTH SENSE', ja: 'T-ZERO 第九感' } },
    { title: { zh: '全部產品', en: 'All Products', ja: '全製品' }, url: 'products.html',   desc: { zh: '4 款玻尿酸安全套', en: '4 hyaluronic condoms', ja: '4 種類 ヒアルロン酸' } },
    { title: { zh: '最新動態', en: 'Latest News', ja: 'ニュース' }, url: 'news.html',       desc: { zh: '查看最新消息', en: 'Latest updates', ja: '最新ニュース' } },
    { title: { zh: '關於我們', en: 'About Us', ja: '私たちについて' }, url: 'about.html', desc: { zh: '品牌故事', en: 'Brand story', ja: 'ブランドストーリー' } },
    { title: { zh: '聯絡我們', en: 'Contact', ja: 'お問い合わせ' }, url: 'contact.html',     desc: { zh: '聯絡客服', en: 'Get in touch', ja: 'お問合せ' } },
    { title: { zh: '常見問題', en: 'FAQ', ja: 'よくある質問' }, url: 'index.html#faq',    desc: { zh: '查看 FAQ', en: 'View FAQ', ja: 'FAQ を見る' } },
    { title: { zh: '細則與條款', en: 'Terms', ja: '利用規約' }, url: 'terms.html',         desc: { zh: '私隱政策及使用條款', en: 'Privacy & terms', ja: 'プライバシー' } },
  ];

  /* Inject modal once */
  const modal = document.createElement('div');
  modal.className = 'search-modal';
  modal.setAttribute('data-search-modal', '');
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
    <div class="search-modal__backdrop" data-search-close></div>
    <div class="search-modal__panel" role="dialog" aria-label="${t('a11y.search')}">
      <div class="search-modal__bar">
        <svg class="search-modal__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="search" class="search-modal__input" data-search-input
               placeholder="${t('search.placeholder')}" autocomplete="off" spellcheck="false">
        <button class="search-modal__close" type="button" data-search-close aria-label="${t('a11y.close')}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="search-modal__body" data-search-results></div>
    </div>
  `;
  document.body.appendChild(modal);

  const input   = modal.querySelector('[data-search-input]');
  const results = modal.querySelector('[data-search-results]');
  let current = [];
  let activeIndex = -1;

  function lang() {
    const cur = (typeof getLang === 'function' && getLang()) || 'zh';
    return ['zh', 'en', 'ja'].includes(cur) ? cur : 'zh';
  }

  function pickLocalized(obj) {
    const l = lang();
    return obj[l] ?? obj.zh ?? obj.en ?? '';
  }

  function highlight(text, q) {
    if (!q) return text;
    const re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    return text.replace(re, '<mark>$1</mark>');
  }

  function render() {
    if (!current.length) return;
    const q = input.value.trim();
    results.innerHTML = current.map((item, i) => {
      const isActive = i === activeIndex ? ' is-active' : '';
      const inner = item.image
        ? `<img class="search-result__img" src="${item.image}" alt="">`
        : `<span class="search-result__icon">${item.icon || '📄'}</span>`;
      return `
        <a class="search-result${isActive}" href="${item.url}" data-result-index="${i}">
          ${inner}
          <div class="search-result__text">
            <div class="search-result__title">${highlight(item.title, q)}</div>
            ${item.subtitle ? `<div class="search-result__sub">${highlight(item.subtitle, q)}</div>` : ''}
          </div>
          <span class="search-result__type">${item.typeLabel}</span>
        </a>
      `;
    }).join('');
  }

  function search(q) {
    q = q.trim().toLowerCase();
    if (!q) {
      results.innerHTML = `<div class="search-modal__empty">${t('search.hint')}</div>`;
      current = [];
      activeIndex = -1;
      return;
    }
    const items = [];

    /* products */
    products.forEach((p) => {
      const names    = [p.name_zh, p.name_en, p.name_ja].filter(Boolean);
      const subs     = [p.subtitle_zh, p.subtitle_en, p.subtitle_ja].filter(Boolean);
      const descs    = [p.description_zh, p.description_en, p.description_ja].filter(Boolean);
      const haystack = [...names, ...subs, ...descs, p.series || '', p.material || '', p.id || '']
        .join(' ').toLowerCase();
      if (haystack.includes(q)) {
        items.push({
          type: 'product',
          typeLabel: t('search.typeProduct'),
          title: pickLocalized({ zh: p.name_zh, en: p.name_en, ja: p.name_ja }),
          subtitle: pickLocalized({ zh: p.subtitle_zh, en: p.subtitle_en, ja: p.subtitle_ja }),
          url: productUrl(p.id),
          image: assetUrl(p.image),
        });
      }
    });

    /* pages */
    pages.forEach((p) => {
      const hay = [pickLocalized(p.title), pickLocalized(p.desc)].join(' ').toLowerCase();
      if (hay.includes(q)) {
        items.push({
          type: 'page',
          typeLabel: t('search.typePage'),
          title: pickLocalized(p.title),
          subtitle: pickLocalized(p.desc),
          url: p.url,
          icon: '🔗',
        });
      }
    });

    current = items.slice(0, 12);
    activeIndex = current.length ? 0 : -1;
    render();
  }

  function open() {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => input.focus(), 30);
    if (input.value.trim()) search(input.value);
  }

  function close() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    input.value = '';
    results.innerHTML = `<div class="search-modal__empty">${t('search.hint')}</div>`;
    current = [];
    activeIndex = -1;
  }

  openers.forEach((b) => b.addEventListener('click', open));
  modal.querySelectorAll('[data-search-close]').forEach((b) => b.addEventListener('click', close));

  input.addEventListener('input', (e) => search(e.target.value));

  document.addEventListener('keydown', (e) => {
    const isOpen = modal.classList.contains('is-open');
    const tag = (document.activeElement?.tagName || '').toLowerCase();
    const isTyping = tag === 'input' || tag === 'textarea' || tag === 'select';

    /* global shortcut: "/" opens search (when not typing) */
    if (!isOpen && !isTyping && e.key === '/') {
      e.preventDefault();
      open();
      return;
    }

    if (!isOpen) return;

    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (current.length) {
        activeIndex = (activeIndex + 1) % current.length;
        render();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (current.length) {
        activeIndex = (activeIndex - 1 + current.length) % current.length;
        render();
      }
    } else if (e.key === 'Enter' && activeIndex >= 0 && current[activeIndex]) {
      e.preventDefault();
      window.location.href = current[activeIndex].url;
    }
  });

  /* Re-run on language change so labels match */
  document.addEventListener('lang:change', () => {
    if (input.value.trim()) search(input.value);
  });
}

export { initHeaderScroll, initReveal, initNewsletter, initSearch, showToast };