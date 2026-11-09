
// GAME 5: HANGMAN
const WORDS=[{w:'GRAPE',h:'果物'},{w:'FRUIT',h:'果物'},{w:'PRIME',h:'アマゾン'},{w:'BREAK',h:'人間に必要'},{w:'TIGER',h:'動物'},{w:"TOKYO",h:"首都"},{w:'PIANO',h:'楽器'},{w:'OCEAN',h:'自然'},{w:'CHESS',h:'ゲーム'},{w:'CLOUD',h:'空'},{w:'BLAZE',h:'火'},{w:'APPLE',h:'果物'},{w:'FAIRY',h:'yousei'},{w:'STONE',h:'自然'}];
games.hangman = function(el) {
  const pick = WORDS[Math.floor(Math.random()*WORDS.length)];
  const word = pick.w;
  let guessed = new Set(), wrong = 0, maxWrong = 6;
  function render() {
    const display = word.split('').map(c=>`<span class="hm-slot${guessed.has(c)?' on':''}">${guessed.has(c)?c:''}</span>`).join('');
    const wrongLetters = [...guessed].filter(c=>!word.includes(c));
    const won = word.split('').every(c=>guessed.has(c));
    const lost = wrong>=maxWrong;
    const parts = [
      wrong>0?`<circle cx="100" cy="40" r="15" stroke="var(--accent1)" stroke-width="3" fill="none"/>`:'',
      wrong>1?`<line x1="100" y1="55" x2="100" y2="120" stroke="var(--accent1)" stroke-width="3"/>`:'',
      wrong>2?`<line x1="100" y1="70" x2="70" y2="100" stroke="var(--accent1)" stroke-width="3"/>`:'',
      wrong>3?`<line x1="100" y1="70" x2="130" y2="100" stroke="var(--accent1)" stroke-width="3"/>`:'',
      wrong>4?`<line x1="100" y1="120" x2="70" y2="150" stroke="var(--accent1)" stroke-width="3"/>`:'',
      wrong>5?`<line x1="100" y1="120" x2="130" y2="150" stroke="var(--accent1)" stroke-width="3"/>`:'',
    ].join('');
    el.innerHTML = `
      <div class="game-header"><h2>🔤 ハングマン</h2><p>ヒント: ${pick.h} | 残り: ${maxWrong-wrong}回</p></div>
      <svg class="hangman-svg" width="200" height="170" viewBox="0 0 200 170">
        <line x1="30" y1="160" x2="170" y2="160" stroke="var(--text2)" stroke-width="3"/>
        <line x1="80" y1="160" x2="80" y2="10" stroke="var(--text2)" stroke-width="3"/>
        <line x1="80" y1="10" x2="100" y2="10" stroke="var(--text2)" stroke-width="3"/>
        <line x1="100" y1="10" x2="100" y2="25" stroke="var(--text2)" stroke-width="3"/>
        ${parts}
      </svg>
      <div class="word-hint">${display}</div>
      ${wrongLetters.length?`<div class="word-wrong">${wrongLetters.map(c=>`<span>${c}</span>`).join('')}</div>`:''}
      ${won?`<div class="result-box"><div class="result-score">🎉 正解！</div><p>スコア ${(maxWrong-wrong)*20}</p><div class="xp-gain">+${(maxWrong-wrong)*20} XP</div><button class="btn mt" onclick="startGame('hangman')">次の問題</button></div>`:
        lost?`<div class="result-box"><div style="font-size:26px;font-weight:900;color:var(--accent1)">😢 ゲームオーバー</div><p>答えは「${word}」</p><button class="btn mt" onclick="startGame('hangman')">リトライ</button></div>`:
        `<div class="keyboard" id="keys" data-nav-group="hangman"></div><p class="kbd-hint center mt">キーボードの <kbd>A</kbd>〜<kbd>Z</kbd> でも入力できます</p>`}`;
    if(!won&&!lost) {
      const keys=document.getElementById('keys');
      for(let i=0;i<26;i++){const c=String.fromCharCode(65+i);const b=document.createElement('button');b.className='key';b.setAttribute('data-nav','');b.textContent=c;if(guessed.has(c))b.disabled=true;b.onclick=()=>guess(c);keys.appendChild(b);}
    }
  }
  function guess(c) {
    guessed.add(c);
    if(!word.includes(c)) wrong++;
    const won=word.split('').every(ch=>guessed.has(ch));
    if(won)recordWin('hangman',(maxWrong-wrong)*20);else if(wrong>=maxWrong)recordLoss(0,'hangman');
    render();
  }
  onGameKey(key=>{
    if(!/^[a-z]$/.test(key))return false;
    const c=key.toUpperCase(),over=wrong>=maxWrong||word.split('').every(ch=>guessed.has(ch));
    if(!over&&!guessed.has(c))guess(c);
    return true;
  });
  render();
};
