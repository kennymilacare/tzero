/* ===========================================================
   splash.js — 5-second bubble splash screen (once per session)
   Bypass: add ?splash=force to the URL to replay.
   =========================================================== */

console.log('[splash] script loaded, version v3');

(function () {
  'use strict';

  /* The site root, worked out from where this file sits. The English
     and Japanese pages live one folder down, so a relative path would
     be looked for in the wrong place. document.currentScript is only
     good while this file is being read, so it is read now. */
  const SITE_ROOT = new URL('../../', document.currentScript ? document.currentScript.src : location.href);

  if (window.__tzeroSplashLoaded) return;
  window.__tzeroSplashLoaded = true;

  const url = new URL(window.location.href);
  const force = url.searchParams.get('splash') === 'force';

  // Reset any old flag from earlier broken versions, so users in existing
  // sessions can still see the splash on this new build.
  if (!force) {
    try { sessionStorage.removeItem('tzero-splash-shown'); } catch (e) {}
  }

  // Respect reduced-motion preference (unless forced)
  if (!force && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    console.log('[splash] reduced-motion enabled — skipping');
    return;
  }

  // Once per session (new key — invalidates any earlier session flag)
  if (!force && sessionStorage.getItem('tzero-splash-v3-shown')) {
    console.log('[splash] already shown this session — skipping');
    return;
  }
  if (!force) sessionStorage.setItem('tzero-splash-v3-shown', '1');

  const SPLASH_CSS = `
    .splash {
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      background: linear-gradient(180deg, #6fb4e4 0%, #aed3ec 50%, #d6e9f6 100%);
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 1;
      transition: opacity 0.6s ease;
    }
    .splash--hiding { opacity: 0; pointer-events: none; }

    .splash__bubbles { position: absolute; inset: 0; pointer-events: none; z-index: 1; }
    .bubble {
      position: absolute;
      bottom: -60px;
      left: var(--x, 50%);
      width: var(--size, 60px);
      height: var(--size, 60px);
      border-radius: 50%;
      background: radial-gradient(circle at 30% 30%,
        rgba(255, 255, 255, 0.95),
        rgba(255, 255, 255, 0.35) 45%,
        rgba(255, 255, 255, 0) 70%);
      box-shadow:
        inset 0 0 10px rgba(255, 255, 255, 0.7),
        0 0 14px rgba(255, 255, 255, 0.35);
      opacity: 0;
      will-change: transform, opacity;
      animation: bubbleRise var(--dur, 5s) var(--del, 0s) ease-in infinite;
    }
    @keyframes bubbleRise {
      0%   { transform: translate(0, 0) scale(0.5);                                       opacity: 0; }
      8%   { opacity: 0.9; }
      50%  { transform: translate(var(--sway, 24px), -52vh) scale(1);                     }
      92%  { opacity: 0.45; }
      100% { transform: translate(calc(var(--sway, 24px) * -0.6), -112vh) scale(0.95);    opacity: 0; }
    }

    .splash__content {
      position: relative;
      z-index: 2;
      text-align: center;
      padding: 0 24px;
      animation: splashContentIn 0.9s 0.15s cubic-bezier(.2,.8,.2,1) backwards;
    }
    @keyframes splashContentIn {
      from { opacity: 0; transform: translateY(24px) scale(0.94); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    .splash__logo {
      width: 110px; height: 110px;
      display: block;
      margin: 0 auto 22px;
      filter: drop-shadow(0 6px 22px rgba(16, 81, 134, 0.35));
    }
    .splash__title {
      font: 700 38px/1.2 'Inter', system-ui, -apple-system, 'Microsoft JhengHei', sans-serif;
      color: #105186;
      margin: 0 0 10px;
      letter-spacing: 0.02em;
    }
    .splash__tagline {
      font: 500 18px/1.4 'Inter', system-ui, -apple-system, 'Microsoft JhengHei', sans-serif;
      color: #466d8c;
      margin: 0;
    }
    .splash__hint {
      margin-top: 32px;
      font: 500 13px/1.4 'Inter', system-ui, sans-serif;
      color: #5a7a99;
      letter-spacing: 0.06em;
      animation: splashHintPulse 1.6s ease-in-out infinite;
    }
    @keyframes splashHintPulse {
      0%, 100% { opacity: 0.5; }
      50%      { opacity: 1; }
    }
    .splash__skip {
      position: absolute;
      bottom: 28px;
      right: 28px;
      z-index: 3;
      background: rgba(255, 255, 255, 0.92);
      border: 1px solid rgba(16, 81, 134, 0.3);
      color: #105186;
      padding: 10px 20px;
      border-radius: 999px;
      font: 600 14px/1 'Inter', system-ui, sans-serif;
      cursor: pointer;
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      transition: background 0.2s ease, transform 0.2s ease;
    }
    .splash__skip:hover  { background: #fff; transform: translateY(-1px); }
    .splash__skip:active { transform: translateY(0); }

    @media (max-width: 480px) {
      .splash__logo  { width: 88px; height: 88px; }
      .splash__title { font-size: 30px; }
      .splash__tagline { font-size: 16px; }
    }
  `;

  // 26 bubbles — more, more varied
  const bubbles = [];
  for (let i = 0; i < 26; i++) {
    bubbles.push({
      x: Math.random() * 100,
      size: 30 + Math.random() * 90,
      dur: 4 + Math.random() * 4,
      del: Math.random() * 5,
      sway: (Math.random() - 0.5) * 90,
    });
  }
  const bubblesHtml = bubbles
    .map(
      (b) =>
        `<span class="bubble" style="--x:${b.x}%;--size:${b.size}px;--dur:${b.dur}s;--del:${b.del}s;--sway:${b.sway}px"></span>`
    )
    .join('');

  const splashHtml = `
    <div class="splash__bubbles" aria-hidden="true">${bubblesHtml}</div>
    <div class="splash__content">
      <img src="${new URL('assets/images/brand/t-zero-logo.png', SITE_ROOT).href}"
           alt="T-ZERO 第九感"
           class="splash__logo"
           width="110" height="110"
           decoding="async">
      <h1 class="splash__title">T-ZERO 第九感</h1>
      <p class="splash__tagline">玻尿酸安全套 ・ 日本品牌</p>
      <p class="splash__hint">點擊任何位置即可略過</p>
    </div>
    <button class="splash__skip" type="button" aria-label="略過開場動畫">略過 ▸</button>
  `;

  try {
    const style = document.createElement('style');
    style.textContent = SPLASH_CSS;
    document.head.appendChild(style);

    const splash = document.createElement('div');
    splash.className = 'splash';
    splash.setAttribute('role', 'dialog');
    splash.setAttribute('aria-modal', 'true');
    splash.setAttribute('aria-label', 'T-ZERO 第九感 開場動畫');
    splash.innerHTML = splashHtml;

    let dismissed = false;
    function dismiss() {
      if (dismissed) return;
      dismissed = true;
      console.log('[splash] dismissing');
      splash.classList.add('splash--hiding');
      setTimeout(() => splash.remove(), 650);
    }

    function showSplash() {
      const target = document.body || document.documentElement;
      if (!target) {
        setTimeout(showSplash, 30);
        return;
      }
      target.prepend(splash);
      console.log('[splash] shown');

      setTimeout(dismiss, 5000);

      const skip = splash.querySelector('.splash__skip');
      if (skip) {
        skip.addEventListener('click', (e) => {
          e.stopPropagation();
          dismiss();
        });
      }
      // Click anywhere on the backdrop dismisses
      splash.addEventListener('click', (e) => {
        if (e.target === splash) dismiss();
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showSplash);
    } else {
      showSplash();
    }
  } catch (err) {
    console.error('[splash] failed:', err);
  }
})();
