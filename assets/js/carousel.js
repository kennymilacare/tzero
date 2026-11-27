/* ===========================================================
   carousel.js — top banner auto-rotation
   找到 [data-carousel] 容器,每 4 秒切換 .is-active 給下一張
   投影片與指示點,滑鼠移入暫停,點圓點可手動跳。
   =========================================================== */

(function () {
  const ROTATE_MS = 6000;
  const SEL = {
    root:  '[data-carousel]',
    slide: '[data-carousel-slide]',
    dot:   '[data-carousel-dot]',
  };

  const reduceMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // 走馬燈屬於商品展示 banner,即使系統設定 reduce-motion 也要繼續輪播
  if (reduceMotion) console.info('[carousel] prefers-reduced-motion: reduce — 但仍會自動輪播');

  const roots = document.querySelectorAll(SEL.root);
  console.info('[carousel] found roots:', roots.length);
  if (!roots.length) return;

  roots.forEach((root) => {
    const slides = Array.from(root.querySelectorAll(SEL.slide));
    const dots   = Array.from(root.querySelectorAll(SEL.dot));
    const prevBtn = root.querySelector('[data-carousel-prev]');
    const nextBtn = root.querySelector('[data-carousel-next]');
    console.info('[carousel] slides:', slides.length, 'dots:', dots.length, 'prev:', !!prevBtn, 'next:', !!nextBtn);
    if (slides.length < 2) return;

    let index = slides.findIndex((s) => s.classList.contains('is-active'));
    if (index < 0) index = 0;
    let timer = null;
    let preloadTimer = null;

    /* A slide's picture is fetched when the slide is first wanted.

       The banner sits at the top of the page, and the three slides
       that are not showing are inside the screen — so "loading=lazy"
       does not help and the browser fetched all four at once. They
       competed with the one picture the page is judged on.

       Their addresses are kept off the picture until the slide is
       wanted. The next one is fetched a moment after the slide on
       screen, so that the turn of the carousel is not a flash of
       empty picture. */
    const loadSlide = (slide) => {
      if (!slide) return;
      const src = slide.getAttribute('data-src');
      if (!src) return;
      slide.setAttribute('src', src);
      slide.removeAttribute('data-src');
      const srcset = slide.getAttribute('data-srcset');
      if (srcset) {
        slide.setAttribute('srcset', srcset);
        slide.removeAttribute('data-srcset');
      }
    };

    const preloadNext = () => {
      if (preloadTimer) clearTimeout(preloadTimer);
      preloadTimer = setTimeout(() => {
        loadSlide(slides[(index + 1) % slides.length]);
      }, 1500);
    };

    const show = (i) => {
      index = (i + slides.length) % slides.length;
      loadSlide(slides[index]);
      slides.forEach((s, n) => s.classList.toggle('is-active', n === index));
      dots.forEach((d, n)   => d.classList.toggle('is-active', n === index));
      preloadNext();
      console.info('[carousel] showing slide', index);
    };

    const start = () => {
      stop();
      timer = setInterval(() => show(index + 1), ROTATE_MS);
      console.info('[carousel] timer started, ROTATE_MS =', ROTATE_MS);
    };
    const stop = () => {
      if (timer) { clearInterval(timer); timer = null; }
    };

    dots.forEach((dot, n) => {
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        show(n);
        start(); // 重設計時
      });
    });

    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        show(index - 1);
        start();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        show(index + 1);
        start();
      });
    }

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    root.addEventListener('focusin',    stop);
    root.addEventListener('focusout',   start);

    start();

    /* The slide after the one on screen, fetched a moment later so
       that the first turn of the carousel is not a flash. */
    preloadNext();
  });
})();
