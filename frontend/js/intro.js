(() => {
  const screen = document.querySelector('#introScreen');
  const video = document.querySelector('#introVideo');
  const skip = document.querySelector('#introSkip');
  const sound = document.querySelector('#introSound');
  const play = document.querySelector('#introPlay');
  if (!screen || !video) return;

  let closed = false;
  const safetyTimer = setTimeout(closeIntro, 45000);

  function closeIntro() {
    if (closed) return;
    closed = true;
    clearTimeout(safetyTimer);
    video.pause();
    screen.classList.add('closing');
    document.body.classList.remove('intro-active');
    setTimeout(() => { screen.hidden = true; }, 500);
  }

  async function playIntro() {
    try {
      await video.play();
      screen.classList.remove('awaiting-play');
    } catch (error) {
      screen.classList.add('awaiting-play');
    }
  }

  video.addEventListener('ended', closeIntro, { once: true });
  video.addEventListener('error', closeIntro, { once: true });
  skip?.addEventListener('click', closeIntro);
  play?.addEventListener('click', playIntro);
  sound?.addEventListener('click', () => {
    video.muted = !video.muted;
    sound.textContent = video.muted ? 'Ativar som' : 'Desativar som';
    sound.setAttribute('aria-label', sound.textContent);
    if (video.paused) playIntro();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeIntro();
  });

  if (video.ended) closeIntro();
  else playIntro();
})();
