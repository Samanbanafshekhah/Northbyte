export function bindCursorMotion(card, { tiltX = 1.3, tiltY = 1.6 } = {}) {
  const panel = document.querySelector('.login-panel');
  const wordfield = document.querySelector('.login-wordfield');
  const hoverWords = Array.from(wordfield?.querySelectorAll('.hover-word') || []);
  const story = document.querySelector('.auth-spotlight .story-copy');
  if (!card || !panel || !matchMedia('(pointer: fine)').matches) return;

  let targetTiltX = 0;
  let targetTiltY = 0;
  let currentTiltX = 0;
  let currentTiltY = 0;
  let targetGlowX = innerWidth * .75;
  let targetGlowY = innerHeight * .52;
  let currentGlowX = targetGlowX;
  let currentGlowY = targetGlowY;
  let frame = 0;

  function renderFrame() {
    currentTiltX += (targetTiltX - currentTiltX) * .34;
    currentTiltY += (targetTiltY - currentTiltY) * .34;
    currentGlowX += (targetGlowX - currentGlowX) * .26;
    currentGlowY += (targetGlowY - currentGlowY) * .26;
    card.style.setProperty('--tilt-x', `${currentTiltX.toFixed(3)}deg`);
    card.style.setProperty('--tilt-y', `${currentTiltY.toFixed(3)}deg`);
    panel.style.setProperty('--cursor-x', `${currentGlowX.toFixed(1)}px`);
    panel.style.setProperty('--cursor-y', `${currentGlowY.toFixed(1)}px`);
    if (story) {
      const bounds = story.getBoundingClientRect();
      const distance = Math.hypot(Math.max(bounds.left - currentGlowX, 0, currentGlowX - bounds.right), Math.max(bounds.top - currentGlowY, 0, currentGlowY - bounds.bottom));
      story.style.setProperty('--story-light', Math.max(0, 1 - distance / 360).toFixed(3));
      story.style.setProperty('--story-light-x', `${currentGlowX - bounds.left}px`);
      story.style.setProperty('--story-light-y', `${currentGlowY - bounds.top}px`);
    }
    if (wordfield) {
      hoverWords.forEach(word => {
        const distance = Math.hypot(currentGlowX - Number(word.dataset.x) * innerWidth / 100, currentGlowY - Number(word.dataset.y) * innerHeight / 100);
        word.style.setProperty('--word-opacity', (Math.max(0, 1 - distance / 160) * .8).toFixed(3));
      });
    }

    const moving = Math.abs(targetTiltX - currentTiltX) > .003 || Math.abs(targetTiltY - currentTiltY) > .003 || Math.abs(targetGlowX - currentGlowX) > .15 || Math.abs(targetGlowY - currentGlowY) > .15;
    frame = moving ? requestAnimationFrame(renderFrame) : 0;
  }

  function schedule() { if (!frame) frame = requestAnimationFrame(renderFrame); }

  window.addEventListener('pointermove', event => {
    if (event.pointerType && event.pointerType !== 'mouse') return;
    wordfield?.classList.add('is-active');
    story?.classList.add('is-lit');
    const x = event.clientX / innerWidth - .5;
    const y = event.clientY / innerHeight - .5;
    targetTiltX = -y * tiltX;
    targetTiltY = x * tiltY;
    targetGlowX = event.clientX;
    targetGlowY = event.clientY;
    schedule();
  }, { passive: true });

  document.addEventListener('pointerleave', () => {
    wordfield?.classList.remove('is-active');
    story?.classList.remove('is-lit');
    targetTiltX = 0;
    targetTiltY = 0;
    schedule();
  });
}
