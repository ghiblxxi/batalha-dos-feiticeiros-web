// --- Sistema de seleção de dificuldade ---
document.querySelectorAll('.level-card').forEach(card => {
  card.addEventListener('click', () => {
    const dificuldade = card.dataset.difficulty;
    localStorage.setItem('dificuldadeEscolhida', dificuldade); // salva dificuldade
    window.location.href = 'jogo.html'; // vai para o jogo
  });
});

// Funções opcionais de tema e áudio
let musicEnabled = true;
let sfxEnabled = true;
let music = new Audio("https://cdn.pixabay.com/download/audio/2022/03/15/audio_7e5f4b43c5.mp3?filename=magic-ambient-110131.mp3");
music.loop = true;
music.volume = 0.3;

document.getElementById('theme-toggle').addEventListener('click', function() {
  const current = document.body.dataset.theme;
  const newTheme = current === 'dark' ? 'light' : 'dark';
  document.body.dataset.theme = newTheme;
  this.textContent = newTheme === 'dark' ? '🌙' : '☀️';
  localStorage.setItem('theme', newTheme);
});

document.getElementById('music-toggle').addEventListener('click', function() {
  musicEnabled = !musicEnabled;
  this.textContent = musicEnabled ? '🎵' : '🔇';
  if (musicEnabled) music.play().catch(()=>{});
  else music.pause();
  localStorage.setItem('musicEnabled', musicEnabled);
});

document.getElementById('sfx-toggle').addEventListener('click', function() {
  sfxEnabled = !sfxEnabled;
  this.textContent = sfxEnabled ? '🔊' : '🔈';
  localStorage.setItem('sfxEnabled', sfxEnabled);
});
