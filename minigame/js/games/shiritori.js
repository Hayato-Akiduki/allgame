
// GAME 8: SHIRITORI (制限時間付き)
const SW={あ:['あめ','あり','あか','あお','あさ','あき','あんですさんみゃく'],い:['いぬ','いえ','いか','いし','いのしし'],う:['うみ','うし','うた','うなぎ','うさぎ'],え:['えき','えだ','えほん','えびす'],お:['おかし','おに','おはな','おにぎり'],か:['かめ','かに','かお','かさ','かいた','かぼちゃ'],き:['きつね','きのこ','きた','きりん'],く:['くも','くじら','くり'],け:['けむし','けいさつ'],こ:['こま','こおり','こども','こあら'],さ:['さかな','さる','さんぽ','さくら'],し:['しろ','しか','しんかんせん'],す:['すし','すな','すずめ'],せ:['せんせい','せかい'],そ:['そら','ぞう','そば'],た:['たこ','たぬき','たいよう','たこやき'],ち:['ちず','ちょうちょ','ちから'],つ:['つき','つる','つばさ','つくえ'],て:['てんき','てがみ'],と:['とり','とら','とけい'],な:['なつ','なみ','なわ','なまえ'],に:['にじ','にわとり','にく'],ぬ:['ぬいぐるみ','ぬか'],ね:['ねこ','ねずみ','ねつ'],の:['のり','のら'],は:['はな','はち','はこ','はくさい'],ひ:['ひかり','ひつじ','ひこうき'],ふ:['ふね','ふく','ふじさん'],へ:['へび','へや'],ほ:['ほし','ほたる','ほん'],ま:['まち','まほう','まつ'],み:['みず','みかん','みち','みそ'],む:['むし','むら','むね'],め:['めだか','めがね'],も:['もり','もち','もも'],や:['やま','やさい','やね','やきとり'],ゆ:['ゆき','ゆめ','ゆび'],よ:['よる','よしの'],ら:['らいおん','らくだ'],り:['りんご','りす','りょう'],る:['るびー','るーれっと'],れ:['れいぞうこ','れつ'],ろ:['ろけっと','ろうそく'],わ:['わに','わし','わた']};
let shiriTimerInterval = null;
games.shiritori = function(el) {
  let chain=[], used=new Set(), turns=0, playerTurn=true, msg='', gameEnded=false;
  let timeLeft=10;
  const TIME_LIMIT=10;
  const start='りんご'; chain.push({word:start,player:'cpu'}); used.add(start); let next=start[start.length-1];
  const getLast=w=>w[w.length-1];
  const cpuReply=c=>{const pool=(SW[c]||[]).filter(w=>!used.has(w)&&getLast(w)!=='ん');return pool.length?pool[Math.floor(Math.random()*pool.length)]:null;};

  function startTimer() {
    clearInterval(shiriTimerInterval);
    timeLeft = TIME_LIMIT;
    updateTimer();
    shiriTimerInterval = setInterval(() => {
      timeLeft--;
      updateTimer();
      if (timeLeft <= 0) {
        clearInterval(shiriTimerInterval);
        if (!gameEnded && playerTurn) {
          msg = '⏰ 時間切れ！あなたの負け';
          gameEnded = true;
          recordLoss();
          render();
        }
      }
    }, 1000);
  }
  function updateTimer() {
    const el2 = document.getElementById('shiri-timer');
    if (!el2) return;
    el2.textContent = timeLeft;
    el2.style.color = timeLeft <= 3 ? 'var(--accent1)' : timeLeft <= 5 ? 'var(--accent2)' : 'var(--accent3)';
  }
  function submit() {
    if (gameEnded || !playerTurn) return;
    const inp=document.getElementById('shiri-inp');
    const w=inp.value.trim(); inp.value='';
    if(!w)return;
    if(w[0]!==next){msg=`❌「${next}」で始まる言葉を入力`;render();return;}
    if(used.has(w)){msg='❌ その言葉はもう使われています';render();return;}
    if(getLast(w)==='ん'){msg='❌「ん」はNG！あなたの負け';gameEnded=true;recordLoss();clearInterval(shiriTimerInterval);render();return;}
    clearInterval(shiriTimerInterval);
    chain.push({word:w,player:'you'});used.add(w);turns++;next=getLast(w);msg='✅ OK！';
    playerTurn=false; render();
    gameDelay(()=>{
      const cw=cpuReply(next);
      if(!cw){msg='🎉 CPUが詰まった！あなたの勝ち！';gameEnded=true;const sc=turns*10;recordWin('shiritori',sc);render();return;}
      chain.push({word:cw,player:'cpu'});used.add(cw);next=getLast(cw);msg=`🤖 CPUは「${cw}」と言った`;
      playerTurn=true; render();
      startTimer();
    },900);
  }
  function render() {
    const rc=chain.slice(-6);
    el.innerHTML=`
      <div class="game-header"><h2>🗣️ しりとり</h2><p>「ん」で終わったら負け！10秒制限</p></div>
      <div class="shiri-score-row">
        <div class="shiri-score-box"><div class="label">ターン</div><div class="val">${turns}</div></div>
        <div class="shiri-score-box"><div class="label">使用単語</div><div class="val">${used.size}</div></div>
        <div class="shiri-score-box"><div class="label">⏰残り</div><div class="val" id="shiri-timer" style="color:var(--accent3)">${playerTurn&&!gameEnded?timeLeft:'-'}</div></div>
      </div>
      <div class="shiri-prompt">次は <span class="next-char">「${next}」</span> で始まる言葉</div>
      <div class="shiri-chain">${rc.map((c,i)=>`<span class="shiri-word${i===rc.length-1?' new':''}">${c.player==='cpu'?'🤖':'👤'} ${c.word}</span>`).join('')}</div>
      ${!gameEnded?`<div class="shiri-input-row">
        <input class="shiri-input" id="shiri-inp" placeholder="「${next}」で始まる言葉..." ${!playerTurn?'disabled':''}/>
        <button class="btn" onclick="shiriSubmit()" ${!playerTurn?'disabled':''}>送る</button>
      </div>`:''}
      <div class="shiri-msg ${msg.startsWith('✅')||msg.includes('勝ち')?'ok':'err'}">${msg}</div>
      ${gameEnded?`${xpResultHtml(turns*10,'shiritori')}<button class="btn mt" onclick="startGame('shiritori')">もう一度</button>`:''}
      <div class="center mt"><button class="btn btn-sm" onclick="startGame('shiritori')">リセット</button></div>`;
    const inp=document.getElementById('shiri-inp');
    if(inp&&playerTurn&&!gameEnded){inp.focus();inp.addEventListener('keydown',e=>{if(e.key==='Enter')shiriSubmit();});}
    window.shiriSubmit=submit;
  }
  render();
  startTimer();
  // cleanup on leave handled by goHome/startGame
};
