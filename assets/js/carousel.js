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

    const show = (i) => {
      index = (i + slides.length) % slides.length;
      slides.forEach((s, n) => s.classList.toggle('is-active', n === index));
      dots.forEach((d, n)   => d.classList.toggle('is-active', n === index));
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
  });
})();
