let audioCtx;
let musicEnabled = true;
let sfxEnabled = true;

// 🎵 Música de fundo (você pode trocar o link se quiser)
let music = new Audio("https://cdn.pixabay.com/download/audio/2022/03/15/audio_7e5f4b43c5.mp3?filename=magic-ambient-110131.mp3");
music.loop = true;
music.volume = 0.3;

// === Inicialização do áudio ===
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

// === Efeitos sonoros ===
function playSound(freq, duration = 0.1, type = 'sine', volume = 0.1) {
  if (!sfxEnabled) return;
  initAudio();
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = freq;
    osc.type = type;
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.warn('Erro de áudio:', e);
  }
}

// === Alternar tema (claro/escuro) ===
document.getElementById('theme-toggle').addEventListener('click', function() {
  initAudio();
  const current = document.body.dataset.theme;
  const newTheme = current === 'dark' ? 'light' : 'dark';
  document.body.dataset.theme = newTheme;
  this.textContent = newTheme === 'dark' ? '🌙' : '☀️';
  this.classList.toggle('active');
  playSound(newTheme === 'dark' ? 200 : 400, 0.1);
  localStorage.setItem('theme', newTheme);
});

// === Alternar música ===
document.getElementById('music-toggle').addEventListener('click', function() {
  initAudio();
  musicEnabled = !musicEnabled;
  this.textContent = musicEnabled ? '🎵' : '🔇';
  this.classList.toggle('active', musicEnabled);
  playSound(300, 0.1);

  if (musicEnabled) {
    music.play().catch(err => console.warn("Som bloqueado até interação do usuário:", err));
  } else {
    music.pause();
  }

  localStorage.setItem('musicEnabled', musicEnabled);
});

// === Alternar efeitos sonoros ===
document.getElementById('sfx-toggle').addEventListener('click', function() {
  initAudio();
  sfxEnabled = !sfxEnabled;
  this.textContent = sfxEnabled ? '🔊' : '📈';
  this.classList.toggle('active', sfxEnabled);
  if (sfxEnabled) playSound(400, 0.1);
  localStorage.setItem('sfxEnabled', sfxEnabled);
});

// === Carregar preferências salvas ===
window.addEventListener('load', () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.body.dataset.theme = savedTheme;
    document.getElementById('theme-toggle').textContent = savedTheme === 'dark' ? '🌙' : '☀️';
  }

  const savedMusic = localStorage.getItem('musicEnabled');
  if (savedMusic !== null) {
    musicEnabled = savedMusic === 'true';
    const btn = document.getElementById('music-toggle');
    btn.textContent = musicEnabled ? '🎵' : '🔇';
    btn.classList.toggle('active', musicEnabled);
    if (musicEnabled) {
      music.play().catch(() => console.log("Clique para ativar o som."));
    }
  }

  const savedSfx = localStorage.getItem('sfxEnabled');
  if (savedSfx !== null) {
    sfxEnabled = savedSfx === 'true';
    const btn = document.getElementById('sfx-toggle');
    btn.textContent = sfxEnabled ? '🔊' : '📈';
    btn.classList.toggle('active', sfxEnabled);
  }
});

// === Som ao clicar no botão do menu ===
document.querySelectorAll('.menu-btn').forEach(btn => {
  btn.addEventListener('click', () => playSound(440, 0.1));
});

// === Selecionar modo (somente 1 jogador) ===
function selecionarModo() {
  playSound(440, 0.1);
  localStorage.setItem('modoJogo', 1);
  window.location.href = 'dificuldade.html';
}
