// =======================
// ==== GAME STATE =======
// =======================
const state = {
  player: {
    class: 'pyromancer',
    level: 1,
    xp: 0,
    xpToNext: 100,
    hp: 100,
    maxHp: 100,
    mana: 100,
    maxMana: 100,
    potions: 3,
    manaPotions: 2,
    shields: 1,
    status: { burn: 0, freeze: 0, stun: 0 },
    defending: false,
    wins: 0,
    combo: 0
  },
  enemy: {
    hp: 100,
    maxHp: 100,
    mana: 100,
    maxMana: 100,
    status: { burn: 0, freeze: 0, stun: 0 },
    defending: false
  },
  turn: 0,
  difficulty: localStorage.getItem('dificuldadeEscolhida') || 'normal',
  gameOver: false
};

// =======================
// ==== CONFIGURATIONS ====
// =======================
const ENEMY_NAMES = ['Mago Sombrio', 'Feiticeiro Rival', 'Guardião Arcano', 'Senhor das Chamas', 'Necromante'];

const CLASSES = {
  pyromancer: { name: 'Piromante', icon: '🧙‍♂️🔥', bonusSpell: 'fire' },
  cryomancer: { name: 'Criomante', icon: '🧙‍♂️❄️', bonusSpell: 'ice' },
  electromancer: { name: 'Eletromante', icon: '🧙‍♂️⚡', bonusSpell: 'meteor' },
  geomancer: { name: 'Geomante', icon: '🧙‍♂️🌋', bonusHp: 20, bonusMana: -10 }
};

const SPELLS = {
  fire: { name: 'Bola de Fogo', damage: 28, mana: 22, accuracy: 0.8, status: 'burn', statusChance: 0.35 },
  ice: { name: 'Raio Gélido', damage: 18, mana: 18, accuracy: 0.85, status: 'freeze', statusChance: 0.3 },
  meteor: { name: 'Chuva de Meteoros', damage: 52, mana: 40, accuracy: 0.5, status: 'stun', statusChance: 0.25 }
};

// =======================
// ==== CANVAS FX =======
// =======================
const canvas = document.getElementById('fx-canvas');
const ctx = canvas.getContext('2d');
let particles = [];

function resizeCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function createParticles(x, y, color, count = 20) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8 - 2,
      life: 60,
      maxLife: 60,
      size: Math.random() * 6 + 3,
      color
    });
  }
}

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.2;
    p.life--;

    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();

    if (p.life <= 0) particles.splice(i, 1);
  }

  requestAnimationFrame(animateParticles);
}
animateParticles();

// =======================
// ==== AUDIO ===========
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, duration = 0.1, type = 'sine') {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.frequency.value = freq;
  osc.type = type;
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

// =======================
// ==== LOGGING ==========
function addLog(message) {
  const log = document.getElementById('log');
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.textContent = `[T${state.turn}] ${message}`;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}

// =======================
// ==== UI UPDATES =======
function updateUI() {
  const p = state.player;
  const e = state.enemy;

  document.getElementById('player-hp-text').textContent = `${p.hp}/${p.maxHp}`;
  document.getElementById('player-mana-text').textContent = `${p.mana}/${p.maxMana}`;
  document.getElementById('player-hp-fill').style.width = `${(p.hp / p.maxHp) * 100}%`;
  document.getElementById('player-mana-fill').style.width = `${(p.mana / p.maxMana) * 100}%`;

  document.getElementById('enemy-hp-text').textContent = `${e.hp}/${e.maxHp}`;
  document.getElementById('enemy-mana-text').textContent = `${e.mana}/${e.maxMana}`;
  document.getElementById('enemy-hp-fill').style.width = `${(e.hp / e.maxHp) * 100}%`;
  document.getElementById('enemy-mana-fill').style.width = `${(e.mana / e.maxMana) * 100}%`;

  document.getElementById('player-level').textContent = p.level;
  document.getElementById('player-xp').textContent = p.xp;
  document.getElementById('xp-needed').textContent = p.xpToNext;
  document.getElementById('wins').textContent = p.wins;
  document.getElementById('combo').textContent = p.combo;

  document.getElementById('potion-count').textContent = p.potions;
  document.getElementById('mana-potion-count').textContent = p.manaPotions;
  document.getElementById('shield-count').textContent = p.shields;

  document.getElementById('turn-counter').textContent = state.turn;

  updateStatusDisplay('player', p.status);
  updateStatusDisplay('enemy', e.status);

  const classData = CLASSES[p.class];
  document.getElementById('player-name').textContent = classData.name;
  document.getElementById('player-portrait').textContent = classData.icon;
}

function updateStatusDisplay(target, status) {
  const container = document.getElementById(`${target}-status`);
  container.innerHTML = '';

  for (const key in status) {
    if (status[key] > 0) {
      const badge = document.createElement('div');
      badge.className = `status-badge status-${key}`;
      const icons = { burn: '🔥', freeze: '❄️', stun: '💫' };
      badge.textContent = `${icons[key]} ${status[key]}`;
      container.appendChild(badge);
    }
  }
}

function showDamage(target) {
  const card = document.getElementById(`${target}-card`);
  card.classList.add('damaged');
  setTimeout(() => card.classList.remove('damaged'), 400);
}

function showCombo(combo) {
  const div = document.createElement('div');
  div.className = 'combo-indicator';
  div.textContent = `${combo}x COMBO!`;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 1000);
}

// =======================
// ==== GAME LOGIC =======
function canAct(entity) {
  if (entity.status.freeze > 0) { entity.status.freeze--; return false; }
  if (entity.status.stun > 0) { entity.status.stun--; return false; }
  return true;
}

function applyBurn(entity, name) {
  if (entity.status.burn > 0) {
    const dmg = 5;
    entity.hp = Math.max(0, entity.hp - dmg);
    entity.status.burn--;
    addLog(`${name} sofre ${dmg} de dano de queimadura 🔥`);
    createParticles(name === 'Jogador' ? canvas.width * 0.25 : canvas.width * 0.75, 100, '#ff6b35', 15);
  }
}

function castSpell(spell, attacker, target, isPlayer) {
  const data = SPELLS[spell];
  const attackerName = isPlayer ? 'Você' : 'Inimigo';
  const targetName = isPlayer ? 'Inimigo' : 'Você';

  if (attacker.mana < data.mana) { addLog(`${attackerName} não tem mana!`); playSound(150,0.1); return false; }

  attacker.mana -= data.mana;
  addLog(`${attackerName} conjura ${data.name}!`);

  const x = isPlayer ? canvas.width * 0.75 : canvas.width * 0.25;
  const colors = { fire:'#ff6b35', ice:'#4ecdc4', meteor:'#a78bfa' };
  createParticles(x,150,colors[spell],30);
  playSound(isPlayer ? 440 : 330,0.15,'triangle');

  if (Math.random() < data.accuracy) {
    let dmg = data.damage;
    if (isPlayer && CLASSES[state.player.class].bonusSpell === spell) { dmg = Math.round(dmg*1.15); addLog('💫 Bônus de classe!'); }
    if (target.defending) { dmg = Math.round(dmg*0.6); addLog('🛡️ Defesa reduz dano!'); }
    target.hp = Math.max(0,target.hp-dmg);
    addLog(`💥 ${targetName} recebe ${dmg} de dano!`);
    showDamage(isPlayer ? 'enemy' : 'player');
    playSound(220,0.1,'sawtooth');

    if (Math.random() < data.statusChance) { target.status[data.status] = Math.max(target.status[data.status], data.status === 'burn'?3:1); addLog(`${targetName} sofreu ${data.status}!`); }

    if (isPlayer) { state.player.combo++; if (state.player.combo>=3) showCombo(state.player.combo); }

    return true;
  } else { addLog(`❌ ${data.name} falhou!`); playSound(100,0.08); if(isPlayer) state.player.combo=0; return false; }
}

function playerDefend() { if(state.gameOver) return; state.player.defending=true; addLog('🛡️ Você assume defesa!'); playSound(300,0.12); endTurn(); }
function usePotion() { if(state.player.potions<=0){addLog('❌ Sem poções!'); return;} state.player.potions--; state.player.hp=Math.min(state.player.maxHp,state.player.hp+50); addLog('🧪 Poção usada! +50 HP'); playSound(550,0.15,'sine'); updateUI(); endTurn(); }
function useManaPotion() { if(state.player.manaPotions<=0){addLog('❌ Sem poções de mana!'); return;} state.player.manaPotions--; state.player.mana=Math.min(state.player.maxMana,state.player.mana+40); addLog('💎 Poção de mana usada! +40 Mana'); playSound(650,0.15,'sine'); updateUI(); endTurn(); }
function useShield() { if(state.player.shields<=0){addLog('❌ Sem escudos!'); return;} state.player.shields--; state.player.defending=true; addLog('🛡️ Escudo mágico ativo!'); playSound(400,0.2,'square'); updateUI(); endTurn(); }

function setupEnemy() {
  const diffMult = state.difficulty==='easy'?0.8:state.difficulty==='hard'?1.3:1;
  const levelMult = 1+(state.player.level-1)*0.1;
  state.enemy.maxHp=Math.round(100*diffMult*levelMult);
  state.enemy.maxMana=Math.round(100*diffMult*levelMult);
  state.enemy.hp=state.enemy.maxHp;
  state.enemy.mana=state.enemy.maxMana;
  state.enemy.status={ burn:0, freeze:0, stun:0 };
  state.enemy.defending=false;
  document.getElementById('enemy-name').textContent = ENEMY_NAMES[Math.floor(Math.random()*ENEMY_NAMES.length)];
}

function enemyTurn() {
  if(state.gameOver) return;
  setTimeout(()=>{
    applyBurn(state.enemy,'Inimigo');
    if(!canAct(state.enemy)){ addLog('Inimigo não pode agir!'); state.turn++; updateUI(); return; }
    const aggression=state.difficulty==='easy'?0.5:state.difficulty==='hard'?0.8:0.65;
    if(state.enemy.mana<20 || Math.random()>aggression){
      if(Math.random()<0.4){ state.enemy.defending=true; addLog('🧙‍♀️ Inimigo se defende!'); }
      else { const dmg=Math.round(12*(state.player.defending?0.6:1)); state.player.hp=Math.max(0,state.player.hp-dmg); addLog(`👊 Inimigo ataca fisicamente ${dmg}!`); showDamage('player'); playSound(180,0.1); }
    } else {
      const spells=['fire','ice','meteor'].filter(s=>state.enemy.mana>=SPELLS[s].mana);
      castSpell(spells[Math.floor(Math.random()*spells.length)],state.enemy,state.player,false);
    }
    state.player.defending=false; state.enemy.defending=false; state.turn++; updateUI(); checkGameOver();
  },800);
}

function endTurn(){
  applyBurn(state.player,'Jogador');
  if(!canAct(state.player)){ addLog('Você não pode agir!'); state.turn++; updateUI(); enemyTurn(); return; }
  state.turn++; updateUI();
  if(!checkGameOver()) enemyTurn();
}

function checkGameOver(){
  if(state.player.hp<=0){ state.gameOver=true; addLog('💀 Você foi derrotado...'); showResult('defeat'); awardXP(20); state.player.combo=0; return true; }
  if(state.enemy.hp<=0){ state.gameOver=true; addLog('🎉 Vitória!'); showResult('victory'); const xp=Math.round(50*(state.difficulty==='hard'?1.5:state.difficulty==='easy'?0.8:1)); awardXP(xp); state.player.wins++; if(Math.random()<0.6) { state.player.potions++; addLog('🎁 Poção de vida ganha!'); } if(Math.random()<0.3){state.player.manaPotions++; addLog('🎁 Poção de mana ganha!');} updateUI(); return true; }
  return false;
}

function showResult(type){ const banner=document.getElementById('result-banner'); banner.textContent=type==='victory'?'🎉 VITÓRIA!':'💀 DERROTA'; banner.className=`result-banner show ${type}`; }

function awardXP(amount){
  state.player.xp+=amount; addLog(`✨ +${amount} XP ganhos!`);
  while(state.player.xp>=state.player.xpToNext){
    state.player.xp-=state.player.xpToNext;
    state.player.level++;
    state.player.xpToNext=Math.round(state.player.xpToNext*1.4);
    state.player.maxHp+=10; state.player.maxMana+=8;
    const classData=CLASSES[state.player.class];
    if(classData.bonusHp) state.player.maxHp+=classData.bonusHp;
    if(classData.bonusMana) state.player.maxMana=Math.max(50,state.player.maxMana+classData.bonusMana);
    state.player.hp=state.player.maxHp;
    state.player.mana=state.player.maxMana;
    addLog(`⬆️ LEVEL UP! Nível ${state.player.level}!`);
    playSound(880,0.3,'square');
  }
  updateUI();
}

function startNewBattle(){
  state.turn=0; state.gameOver=false;
  state.player.status={ burn:0, freeze:0, stun:0 };
  state.player.defending=false;
  state.player.hp=state.player.maxHp;
  state.player.mana=state.player.maxMana;
  setupEnemy(); updateUI();
  const banner=document.getElementById('result-banner'); banner.classList.remove('show');
  addLog('⚔️ Nova batalha iniciada! HP e Mana restaurados!');
  playSound(440,0.2);
}

// =======================
// ==== EVENT LISTENERS ===
// =======================
document.querySelectorAll('.spell-btn[data-spell]').forEach(btn=>btn.addEventListener('click',()=>{if(state.gameOver)return; const spell=btn.dataset.spell; if(castSpell(spell,state.player,state.enemy,true)) endTurn();}));
document.getElementById('defend-btn').addEventListener('click',playerDefend);
document.getElementById('use-potion').addEventListener('click',usePotion);
document.getElementById('use-mana-potion').addEventListener('click',useManaPotion);
document.getElementById('use-shield').addEventListener('click',useShield);
document.getElementById('next-battle').addEventListener('click',startNewBattle);
document.getElementById('clear-log').addEventListener('click',()=>{document.getElementById('log').innerHTML='';});
document.getElementById('reset-game').addEventListener('click',()=>{if(confirm('Deseja resetar todo o progresso?')){state.player={class:'pyromancer',level:1,xp:0,xpToNext:100,hp:100,maxHp:100,mana:100,maxMana:100,potions:3,manaPotions:2,shields:1,status:{burn:0,freeze:0,stun:0},defending:false,wins:0,combo:0}; startNewBattle(); addLog('🔄 Jogo resetado!');}});
document.getElementById('class-select').addEventListener('change',e=>{
  state.player.class=e.target.value;
  const data=CLASSES[e.target.value];
  const baseHp=100+(state.player.level-1)*10;
  const baseMana=100+(state.player.level-1)*8;
  state.player.maxHp=baseHp+(data.bonusHp||0);
  state.player.maxMana=Math.max(50,baseMana+(data.bonusMana||0));
  state.player.hp=Math.min(state.player.hp,state.player.maxHp);
  state.player.mana=Math.min(state.player.mana,state.player.maxMana);
  addLog(`🧙 Classe alterada para ${data.name}!`);
  updateUI();
});
document.addEventListener('keydown',e=>{
  if(state.gameOver) return;
  switch(e.key.toLowerCase()){
    case 'f': document.querySelector('[data-spell="fire"]').click(); break;
    case 'i': document.querySelector('[data-spell="ice"]').click(); break;
    case 'm': document.querySelector('[data-spell="meteor"]').click(); break;
    case 'd': playerDefend(); break;
    case 'p': usePotion(); break;
  }
});

// =======================
// ==== INITIALIZE =======
// =======================
addLog('⚔️ Bem-vindo à Batalha dos Feiticeiros!');
addLog('🎮 Use F (Fogo), I (Gelo), M (Meteoros), D (Defender), P (Poção)');

// Mostrar dificuldade escolhida
addLog(`⚙️ Dificuldade selecionada: ${state.difficulty}`);

setupEnemy();
updateUI();

