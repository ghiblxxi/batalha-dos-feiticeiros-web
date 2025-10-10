/* app.js - lógica do jogo */
'use strict';

const ui = {
  playerHPFill: document.getElementById('player-hp-fill'),
  enemyHPFill: document.getElementById('enemy-hp-fill'),
  playerManaFill: document.getElementById('player-mana-fill'),
  enemyManaFill: document.getElementById('enemy-mana-fill'),
  playerHPText: document.getElementById('player-hp-text'),
  enemyHPText: document.getElementById('enemy-hp-text'),
  playerManaText: document.getElementById('player-mana-text'),
  enemyManaText: document.getElementById('enemy-mana-text'),
  logEl: document.getElementById('log'),
  turnCounter: document.getElementById('turn-counter'),
  animLayer: document.getElementById('anim-layer'),
  resultBanner: document.getElementById('result-banner'),
  playerPotions: document.getElementById('player-potions'),
  playerDefEl: document.getElementById('player-def'),
  enemyStatusEl: document.getElementById('enemy-status'),
  restartBtn: document.getElementById('restart-btn'),
};

const spells = {
  fogo: {nome: 'Bola de Fogo', dano: 30, chance: 0.60, mana: 25, emoji: '🔥', status:'queim', statusDur:3, statusChance:0.4},
  raio: {nome: 'Raio Congelante', dano: 20, chance: 0.80, mana: 20, emoji: '❄️', status:'cong', statusDur:1, statusChance:0.35},
  meteoros: {nome: 'Chuva de Meteoros', dano: 50, chance: 0.30, mana: 40, emoji: '☄️', status:'atord', statusDur:1, statusChance:0.25}
};

let state = null;

function makeState(){
  return {
    playerHP: 100,
    enemyHP: 100,
    playerMana: 100,
    enemyMana: 100,
    potions: 3,
    playerDef: false,
    enemyDef: false,
    playerStatus: {queim:0, cong:0, atord:0},
    enemyStatus: {queim:0, cong:0, atord:0},
    turn: 0,
    gameOver: false,
    log: []
  };
}

function clamp(v,min=0,max=100){ return Math.max(min, Math.min(max, v)); }

function pushLog(text){
  const p = document.createElement('p');
  p.textContent = text;
  ui.logEl.appendChild(p);
  ui.logEl.scrollTop = ui.logEl.scrollHeight;
  state.log.push(text);
  if(state.log.length > 300) state.log.shift();
}

function renderAll(){
  // HP / Mana bars
  ui.playerHPFill.style.transform = `scaleX(${state.playerHP/100})`;
  ui.enemyHPFill.style.transform = `scaleX(${state.enemyHP/100})`;
  ui.playerManaFill.style.transform = `scaleX(${state.playerMana/100})`;
  ui.enemyManaFill.style.transform = `scaleX(${state.enemyMana/100})`;

  ui.playerHPText.textContent = `${state.playerHP} / 100`;
  ui.enemyHPText.textContent = `${state.enemyHP} / 100`;
  ui.playerManaText.textContent = `${state.playerMana} / 100`;
  ui.enemyManaText.textContent = `${state.enemyMana} / 100`;
  ui.turnCounter.textContent = `Turno: ${state.turn}`;

  ui.playerPotions.textContent = `Poções: ${state.potions}`;
  ui.playerDefEl.textContent = `Defesa: ${state.playerDef ? 'Ativa' : '—'}`;
  ui.enemyStatusEl.textContent = `Status: ${statusText(state.enemyStatus)}`;

  // result
  if(state.gameOver){
    ui.resultBanner.classList.remove('hidden');
    ui.resultBanner.classList.toggle('win', state.enemyHP <= 0 && state.playerHP > 0);
    ui.resultBanner.classList.toggle('lose', state.playerHP <= 0 && state.enemyHP > 0);
    if(state.enemyHP <= 0 && state.playerHP > 0){
      ui.resultBanner.textContent = '🎉 Você venceu!';
    } else if(state.playerHP <= 0 && state.enemyHP > 0){
      ui.resultBanner.textContent = '💀 Você foi derrotado';
    } else {
      ui.resultBanner.textContent = 'Empate';
    }
  } else {
    ui.resultBanner.classList.add('hidden');
  }
}

function statusText(s){
  const parts = [];
  if(s.queim) parts.push(`Queima(${s.queim})`);
  if(s.cong) parts.push(`Congel(${s.cong})`);
  if(s.atord) parts.push(`Atordo(${s.atord})`);
  return parts.length ? parts.join(' • ') : '—';
}

function applyStatusEffects(who){
  // retorna true se o ator está paralisado/congelado/atordoado (pula ação)
  if(who === 'player'){
    if(state.playerStatus.queim > 0){
      state.playerHP = clamp(state.playerHP - 5, 0, 100);
      state.playerStatus.queim--;
      pushLog('🔥 Você sofre 5 de queimadura.');
      animateShake('player');
    }
    if(state.playerStatus.cong > 0){ state.playerStatus.cong--; pushLog('❄️ Você está congelado e perde a vez.'); return true; }
    if(state.playerStatus.atord > 0){ state.playerStatus.atord--; pushLog('💫 Você está atordoado e perde a vez.'); return true; }
    return false;
  } else {
    if(state.enemyStatus.queim > 0){
      state.enemyHP = clamp(state.enemyHP - 5, 0, 100);
      state.enemyStatus.queim--;
      pushLog('🔥 Inimigo sofre 5 de queimadura.');
      animateShake('enemy');
    }
    if(state.enemyStatus.cong > 0){ state.enemyStatus.cong--; pushLog('❄️ Inimigo congelado e perde a vez.'); return true; }
    if(state.enemyStatus.atord > 0){ state.enemyStatus.atord--; pushLog('💫 Inimigo atordoado e perde a vez.'); return true; }
    return false;
  }
}

function animateHit(target, text){
  const el = document.createElement('div');
  el.className = 'hit-text animate-hit';
  el.style.position = 'absolute';
  el.style.fontWeight = '700';
  el.style.zIndex = 40;
  el.style.pointerEvents = 'none';
  el.textContent = text;
  if(target === 'player'){
    el.style.left = '10%';
    el.style.top = '45%';
  } else {
    el.style.left = '78%';
    el.style.top = '12%';
  }
  ui.animLayer.appendChild(el);
  setTimeout(()=> el.remove(), 700);
}

function animateShake(target){
  const sel = target === 'player' ? '.player-card' : '.enemy-card';
  const el = document.querySelector(sel);
  if(!el) return;
  el.animate([
    { transform: 'translateX(0)' },
    { transform: 'translateX(-8px)' },
    { transform: 'translateX(8px)' },
    { transform: 'translateX(0)' }
  ], { duration: 420, easing: 'ease-in-out' });
}

function castSpell(spellKey){
  if(state.gameOver) return;
  const spell = spells[spellKey];
  if(!spell) return;

  // check mana
  if(state.playerMana < spell.mana){
    pushLog('⚠️ Mana insuficiente!');
    return;
  }
  // consume mana
  state.playerMana = clamp(state.playerMana - spell.mana, 0, 100);

  pushLog(`➡️ Você conjura ${spell.emoji} ${spell.nome}...`);
  // chance to hit
  const hit = Math.random() < spell.chance;
  if(!hit){
    pushLog('❌ O feitiço falha!');
    animateHit('enemy','MISS');
  } else {
    // damage modified by enemy defense
    let dmg = spell.dano;
    if(state.enemyDef) { dmg = Math.round(dmg * 0.55); pushLog('🛡️ Defesas do inimigo absorvem parte do dano.'); }
    state.enemyHP = clamp(state.enemyHP - dmg, 0, 100);
    pushLog(`💥 ${dmg} de dano no inimigo.`);
    animateHit('enemy', '-' + dmg);
    animateShake('enemy');

    // apply status
    if(spell.status && Math.random() < spell.statusChance){
      state.enemyStatus[spell.status] = (state.enemyStatus[spell.status] || 0) + spell.statusDur;
      pushLog(`🔸 Inimigo atingido por ${spell.status} por ${spell.statusDur} turnos.`);
    }
  }

  // end of player's action: disable player's defense (it applies only for one turn)
  state.playerDef = false;

  // increment turn and check statuses
  state.turn++;
  renderAll();
  checkGameOver();

  // enemy turn (slightly delayed to allow animation)
  setTimeout(enemyTurn, 700);
}

function defend(){
  if(state.gameOver) return;
  state.playerDef = true;
  pushLog('🛡️ Você assume postura defensiva (reduz dano no próximo ataque).');
  state.turn++;
  renderAll();
  setTimeout(enemyTurn, 600);
}

function usePotion(){
  if(state.gameOver) return;
  if(state.potions <= 0){
    pushLog('⚠️ Você não tem poções.');
    return;
  }
  state.potions--;
  const heal = 40;
  state.playerHP = clamp(state.playerHP + heal, 0, 100);
  // also restore small mana
  state.playerMana = clamp(state.playerMana + 20, 0, 100);
  pushLog(`🧪 Você bebe uma poção e recupera ${heal} HP e 20 Mana.`);
  animateHit('player', '+' + heal);
  state.turn++;
  state.playerDef = false;
  renderAll();
  setTimeout(enemyTurn, 500);
}

function enemyTurn(){
  if(state.gameOver) return;

  // apply status start-effects for enemy (burn etc)
  const skip = applyStatusEffects('enemy');
  renderAll();
  if(checkGameOver()) return;

  if(skip){
    // enemy skips turn
    state.turn++;
    renderAll();
    setTimeout(()=>{}, 300);
    return;
  }

  // basic AI: decide action by simple heuristics
  // if enemy low HP and has mana, sometimes cast meteoros; else prefer spells by mana and chance
  const possibleActions = [];

  // if enemy mana high and player low HP -> aggressive
  if(state.enemyMana >= spells.meteoros.mana && state.enemyHP > 20 && Math.random() < 0.25){
    possibleActions.push('meteoros');
  }

  // fill with other spells depending on mana
  for(const key of ['fogo','raio','meteoros']){
    if(state.enemyMana >= spells[key].mana) possibleActions.push(key);
  }

  // if no mana -> defend or do weak attack (physical)
  if(possibleActions.length === 0){
    // enemy either defends or does "golpe" (small damage)
    if(Math.random() < 0.5){
      state.enemyDef = true;
      pushLog('🧙‍♀️ Inimigo assume defesa.');
      state.turn++;
      renderAll();
      return;
    } else {
      // weak physical attack
      let dmg = 10;
      if(state.playerDef) dmg = Math.round(dmg * 0.55);
      state.playerHP = clamp(state.playerHP - dmg, 0, 100);
      pushLog(`👊 Inimigo desfere um golpe e causa ${dmg} de dano em você.`);
      animateHit('player','-' + dmg);
      animateShake('player');
      state.turn++;
      state.enemyDef = false;
      renderAll();
      checkGameOver();
      return;
    }
  }

  // choose one at random biased by chance
  const choice = possibleActions[Math.floor(Math.random() * possibleActions.length)];
  const spell = spells[choice];

  // consume mana
  state.enemyMana = clamp(state.enemyMana - spell.mana, 0, 100);
  pushLog(`🧙‍♀️ Inimigo conjura ${spell.nome}...`);
  // check hit
  if(Math.random() < spell.chance){
    let dmg = spell.dano;
    if(state.playerDef) { dmg = Math.round(dmg * 0.55); pushLog('🛡️ Sua defesa reduz o dano recebido.'); }
    state.playerHP = clamp(state.playerHP - dmg, 0, 100);
    pushLog(`🔥 Você recebe ${dmg} de dano.`);
    animateHit('player','-' + dmg);
    animateShake('player');

    // status application
    if(spell.status && Math.random() < spell.statusChance){
      state.playerStatus[spell.status] = (state.playerStatus[spell.status] || 0) + spell.statusDur;
      pushLog(`🔸 Você sofre ${spell.status} por ${spell.statusDur} turnos.`);
    }
  } else {
    pushLog('❌ Feitiço do inimigo falha!');
    animateHit('player','MISS');
  }

  // enemy defense resets (applies only for one turn)
  state.enemyDef = false;
  // player defense also used only one turn; reset
  state.playerDef = false;

  state.turn++;
  renderAll();
  checkGameOver();
}

function checkGameOver(){
  if(state.gameOver) return true;
  if(state.playerHP <= 0 || state.enemyHP <= 0){
    state.gameOver = true;
    renderAll();
    if(state.enemyHP <= 0 && state.playerHP > 0) pushLog('🎉 Vitória! O inimigo caiu.');
    else if(state.playerHP <= 0 && state.enemyHP > 0) pushLog('💀 Você foi derrotado...');
    else pushLog('🔚 Batalha encerrada.');
    return true;
  }
  return false;
}

function wireEvents(){
  // spell buttons
  document.querySelectorAll('.spell').forEach(btn=>{
    btn.addEventListener('click', ()=> castSpell(btn.dataset.spell));
  });
  document.getElementById('defend-btn').addEventListener('click', defend);
  document.getElementById('potion-btn').addEventListener('click', usePotion);
  ui.restartBtn.addEventListener('click', ()=> {
    state = makeState();
    ui.logEl.innerHTML = '';
    pushLog('🔄 Jogo reiniciado.');
    renderAll();
  });

  // keyboard shortcuts
  window.addEventListener('keydown', (e)=>{
    if(state.gameOver) return;
    const key = e.key.toLowerCase();
    if(key === 'f') castSpell('fogo');
    if(key === 'c') castSpell('raio');
    if(key === 'm') castSpell('meteoros');
    if(key === 'd') defend();
    if(key === 'p') usePotion();
  });
}

function boot(){
  state = makeState();
  wireEvents();
  pushLog('⚔️ Batalha iniciada! Use as teclas ou botões para agir.');
  renderAll();
}

// start
boot();
