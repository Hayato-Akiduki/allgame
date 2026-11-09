



// ================================================================
// GAME 12: MONSTER BATTLE (オンゲー風RPGミニゲーム)
// ================================================================
const MONSTERS = [
  {name:'スライム',   hp:30, maxHp:30,  atk:5,  def:1,  xp:15,  pt:20,  icon:'🟢', color:'#6bcb77'},
  {name:'ゴブリン',   hp:50, maxHp:50,  atk:8,  def:2,  xp:25,  pt:35,  icon:'👺', color:'#ffa94d'},
  {name:'オーク',     hp:80, maxHp:80,  atk:12, def:4,  xp:40,  pt:60,  icon:'👹', color:'#ff6b6b'},
  {name:'スケルトン', hp:60, maxHp:60,  atk:15, def:3,  xp:50,  pt:80,  icon:'💀', color:'#a7a9be'},
  {name:'ドラゴン',   hp:150,maxHp:150, atk:25, def:8,  xp:100, pt:200, icon:'🐉', color:'#c77dff'},
  {name:'ダークウィザード',hp:100,maxHp:100,atk:20,def:5,xp:80,pt:150,icon:'🧙',color:'#4d96ff'},
  {name:'魔王',       hp:200,maxHp:200, atk:30, def:12, xp:150, pt:300, icon:'👿', color:'#ff6b6b'},
];
const SKILLS = [
  {name:'通常攻撃',  cost:0,  mult:1.0, effect:'',       icon:'⚔️'},
  {name:'ファイア',  cost:15, mult:1.5, effect:'burn',   icon:'🔥'},
  {name:'アイス',    cost:12, mult:1.3, effect:'slow',   icon:'❄️'},
  {name:'ライトニング',cost:20,mult:2.0,effect:'stun',   icon:'⚡'},
  {name:'ヒール',    cost:25, mult:0,   effect:'heal',   icon:'💚'},
  {name:'シールド充電',cost:0, mult:0,   effect:'shield', icon:'🛡️'},
];
games.monster = function(el) {
  let pLv=1, pHp=90, pMaxHp=90, pAtk=16, pDef=4, pMp=42, pMaxMp=42;
  let pXp=0, pXpNeeded=100, kills=0, totalPt=0;
  let mIdx=0, monster=null, mHp=0, log=['⚔️ 戦闘開始！ スキルを選ぼう'], turn=0, stunned=false, burned=0, slowed=0, shielded=false;
  function newMonster(){
    const base=MONSTERS[Math.min(mIdx,MONSTERS.length-1)];
    const loop=Math.floor(mIdx/MONSTERS.length), scale=1+loop*0.22+mIdx*0.035;
    const maxHp=Math.round((base.maxHp+pLv*7)*scale);
    monster={...base,hp:maxHp,maxHp,atk:Math.round((base.atk+pLv*1.5)*(1+loop*.16)),def:base.def+Math.floor(mIdx/3)};
    mHp=monster.hp; stunned=false; burned=0; slowed=0; shielded=false;
  }
  function addLog(txt){log.unshift(txt);if(log.length>6)log.pop();}
  function calcDmg(atk,def,mult){return Math.max(1,Math.round((atk*mult-def*0.6)*(0.9+Math.random()*0.25)));}
  function enemyTurn(){
    if(!stunned){
      const rage=mHp<=monster.maxHp*.3?1.35:1;
      const crit=(turn+1)%4===0;
      const rawEdm=calcDmg(monster.atk*(slowed?.72:1)*rage,pDef,crit?1.65:1);
      const edm=shielded?Math.max(1,Math.round(rawEdm*0.4)):rawEdm;
      pHp=Math.max(0,pHp-edm);
      addLog(`${crit?'💥 急所！ ':''}${shielded?'🛡️ ガード軽減！ ':''}${monster.icon} ${monster.name}の攻撃！ ${edm} ダメージ`);
    } else {addLog(`${monster.icon} スタン中で動けない！`);stunned=false;}
    shielded=false;
    if(burned>0){const bd=Math.max(2,Math.round(pAtk*.22));mHp=Math.max(0,mHp-bd);burned--;addLog(`🔥 燃焼ダメージ ${bd}！`);}
    if(slowed>0)slowed--;
    pMp=Math.min(pMaxMp,pMp+5);
  }
  function playerAtk(skillIdx){
    const sk=SKILLS[skillIdx];
    if(pMp<sk.cost){addLog('⚠️ MPが足りない！');render();return;}
    if(sk.effect==='shield'){
      shielded=true;const mpGain=18;pMp=Math.min(pMaxMp,pMp+mpGain);
      playSfx('click');
      addLog(`🛡️ シールド展開！被ダメ60%軽減＆MP+${mpGain}！`);
      enemyTurn();
      if(mHp<=0){victory();return;}if(pHp<=0){defeat();return;}turn++;render();return;
    }
    if(sk.effect==='heal'){
      const heal=Math.round(pMaxHp*0.24);pHp=Math.min(pMaxHp,pHp+heal);pMp-=sk.cost;
      playSfx('win');
      addLog(`💚 ${heal}HP回復！`);enemyTurn();
      if(mHp<=0){victory();return;}if(pHp<=0){defeat();return;}turn++;render();return;
    }
    pMp-=sk.cost;
    const isCrit=Math.random()<0.18;
    const dmg=calcDmg(pAtk,monster.def,sk.mult*(isCrit?1.5:1));
    mHp=Math.max(0,mHp-dmg);
    playSfx(isCrit?'combo':'hit');
    let extra=isCrit?' 💥会心の一撃！':'';
    if(sk.effect==='burn'){burned=3;extra+=' 🔥炎上！';}
    if(sk.effect==='slow'){slowed=2;extra+=' ❄️スロー！';}
    if(sk.effect==='stun'){stunned=true;extra+=' ⚡スタン！';}
    addLog(`${sk.icon} ${sk.name}で ${dmg} ダメージ！${extra}`);
    if(mHp<=0){victory();return;}
    // enemy turn
    enemyTurn();
    if(mHp<=0){victory();return;}
    if(pHp<=0){defeat();return;}
    turn++;render();
  }
  function victory(){
    kills++; mIdx++;
    const pt=monster.pt*pLv; totalPt+=pt;
    pXp+=monster.xp;
    if(pXp>=pXpNeeded){pXp-=pXpNeeded;pLv++;pXpNeeded=Math.round(pXpNeeded*1.55);pMaxHp+=14;pAtk+=2;pDef+=1;pMaxMp+=7;pHp=Math.min(pMaxHp,pHp+Math.round(pMaxHp*.45));pMp=Math.min(pMaxMp,pMp+18);addLog(`✨ プレイヤーLv.${pLv}にアップ！`);}
    else{pHp=Math.min(pMaxHp,pHp+Math.round(pMaxHp*.14));pMp=Math.min(pMaxMp,pMp+10);}
    addLog(`🏆 ${monster.name}を倒した！ スコア +${pt}・+${monster.xp}XP`);
    recordWin('monster',pt);
    newMonster();render();
  }
  function defeat(){
    addLog('💀 あなたは倒された...');
    const finalPt=totalPt;
    recordLoss(finalPt,'monster');
    render(true);
    el.querySelector('#mon-end')?.remove();
    const rb=document.createElement('div');rb.id='mon-end';rb.className='result-box';rb.style.marginTop='12px';
    rb.innerHTML=`<div class="result-score">${finalPt}</div><p>${kills}体撃破！${xpResultHtml(finalPt,'monster')}</p><button class="btn mt" onclick="startGame('monster')">リトライ</button>`;
    el.appendChild(rb);
  }
  function hpBar(cur,max,color,small=false){const pct=Math.max(0,Math.round(cur/max*100));const c=pct>50?color:pct>25?'#ffd93d':'#ff6b6b';return `<div class="meter${small?' small':''}"><div class="meter-fill" style="width:${pct}%;background:${c}"></div></div>`;}
  function render(dead=false){
    el.innerHTML=`
      <div class="game-header"><h2>⚔️ モンスター討伐</h2><p>敵は瀕死で凶暴化。MPと回復の使いどころを見極めろ！</p></div>
      <div class="monster-stage">
        <div class="monster-unit">
          <div class="battle-heading"><div class="unit-kicker">👤 プレイヤー Lv.${pLv}</div><span class="stage-badge">STAGE ${mIdx+1}</span></div>
          <div class="unit-hp">HP ${pHp}/${pMaxHp}</div>
          ${hpBar(pHp,pMaxHp,'#6bcb77')}
          <div style="font-size:13px;color:var(--accent4);margin-top:6px">MP ${pMp}/${pMaxMp}</div>
          ${hpBar(pMp,pMaxMp,'var(--accent4)',true)}
          <div class="unit-meta">ATK:${pAtk} DEF:${pDef} | 討伐:${kills} | XP:${pXp}/${pXpNeeded}</div>
          <div class="status-row"><span class="status-chip">次のLvまで ${pXpNeeded-pXp} XP</span></div>
        </div>
        <div class="monster-unit enemy">
          <div class="monster-sprite" style="--mc:${monster.color}">${monster.icon}</div>
          <div style="font-size:15px;font-weight:700;color:${monster.color}">${monster.name}</div>
          <div class="unit-hp">HP ${mHp}/${monster.maxHp}</div>
          ${hpBar(mHp,monster.hp,monster.color)}
          <div class="unit-meta">ATK:${monster.atk} DEF:${monster.def} ${mHp<=monster.maxHp*.3?'<span class="danger-label">| 凶暴化</span>':''}</div>
          <div class="status-row">
            ${burned?`<span class="status-chip bad">🔥 燃焼 ${burned}</span>`:''}
            ${slowed?`<span class="status-chip good">❄️ スロー ${slowed}</span>`:''}
            ${stunned?'<span class="status-chip good">⚡ スタン</span>':''}
          </div>
          <div class="enemy-intent ${(turn+1)%4===0?'danger':''}">${stunned?'次の行動：行動不能':(turn+1)%4===0?'⚠️ 次の行動：強攻撃':'次の行動：通常攻撃'}</div>
        </div>
      </div>
      <div class="battle-log" aria-live="polite">
        ${log.slice(0,5).map((l,i)=>`<div class="battle-log-line" style="opacity:${1-i*0.18};color:${i===0?'var(--text)':'var(--text2)'}">${l}</div>`).join('')}
      </div>
      ${!dead?`<div class="skill-grid" data-nav-group="mon-skills">
        ${SKILLS.map((sk,i)=>`<button class="btn ${i===0?'':'btn-sm'}" style="background:${['#4d96ff','#ff6b6b','#60c8ff','#ffd93d','#6bcb77','#c77dff'][i]};color:${i===3?'#111':'#fff'}" ${pMp<sk.cost?'disabled':''} data-nav data-skill="${i}" data-focus-key="mon-skill-${i}" onclick="monAtk(${i})"><span class="kbd-hint"><kbd>${i+1}</kbd></span> ${sk.icon} ${sk.name}${sk.cost>0?` (${sk.cost}MP)`:''}</button>`).join('')}
      </div>`:''}`;
    window.monAtk=playerAtk;
  }
  onGameKey(key=>{const i=Number(key)-1;if(!(i>=0&&i<SKILLS.length))return false;el.querySelector(`[data-skill="${i}"]`)?.click();return true;});
  newMonster();render();
};
