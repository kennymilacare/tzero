/* ===========================================================
   bubbles.js — 限時泡泡特效
   在頁面加上一層 fixed 全螢幕 overlay,從底部生成泡泡往上飄,
   到設定秒數後停止新泡泡,並在最後一輪泡泡飄完後清空容器。
   =========================================================== */

(function () {
  const DISPLAY_SECONDS = 4;   // 持續生成新泡泡的秒數
  const FADE_SECONDS    = 3;   // 停止後,讓最後一批泡泡飄完的秒數
  const STYLE_ID        = 'bubbles-effect-styles';
  const CONTAINER_ID    = 'bubble-container';

  // 尊重使用者的「減少動態效果」設定
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  console.info('[bubbles] effect starting. reduced-motion =', reduceMotion);

  // 注入樣式(只一次)
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent =
      '#' + CONTAINER_ID + ' {' +
        'position: fixed;' +
        'inset: 0;' +
        'z-index: 99999;' +
        'pointer-events: none;' +
        'overflow: hidden;' +
      '}' +
      '#' + CONTAINER_ID + ' .bubble {' +
        'position: absolute;' +
        'bottom: -50px;' +
        'background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.95), rgba(173, 216, 230, 0.4) 60%, rgba(255, 255, 255, 0.1));' +
        'border-radius: 50%;' +
        'box-shadow: inset 0 0 12px rgba(255, 255, 255, 0.7), 0 0 8px rgba(173, 216, 230, 0.4);' +
        'animation-name: bubble-rise;' +
        'animation-timing-function: linear;' +
        'animation-iteration-count: infinite;' +
      '}' +
      '@keyframes bubble-rise {' +
        '0%   { transform: translateY(0) scale(1);     opacity: 1; }' +
        '100% { transform: translateY(-110vh) scale(1.2); opacity: 0; }' +
      '}';
    document.head.appendChild(style);
  }

  // 建立容器
  const container = document.createElement('div');
  container.id = CONTAINER_ID;
  document.body.appendChild(container);
  console.info('[bubbles] container mounted:', container);

  function createBubble() {
    const bubble = document.createElement('span');
    bubble.className = 'bubble';

    const size = Math.random() * 120 + 40; // 40–160px
    bubble.style.width  = size + 'px';
    bubble.style.height = size + 'px';
    bubble.style.left   = Math.random() * window.innerWidth + 'px';

    const duration = Math.random() * 2 + 2; // 2–4s
    bubble.style.animationDuration = duration + 's';

    container.appendChild(bubble);
    setTimeout(() => bubble.remove(), duration * 1000);
  }

  // 開始持續生成
  const interval = setInterval(createBubble, 200);

  // 到時停止 + 移除容器
  setTimeout(() => {
    clearInterval(interval);
    setTimeout(() => {
      if (container.parentNode) container.parentNode.removeChild(container);
    }, FADE_SECONDS * 1000);
  }, DISPLAY_SECONDS * 1000);
})();
