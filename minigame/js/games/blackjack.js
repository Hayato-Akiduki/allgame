// GAME 4: BLACKJACK  ── 所持ポイントを賭ける
games.blackjack = function(el) {
  const SUITS=['♠','♥','♦','♣'], VALS=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  let deck, playerHand, dealerHand, bet=0, phase='bet', sessionWins=0, roundDiff=0;
  function newDeck() { let d=[]; for(let s of SUITS) for(let v of VALS) d.push({s,v}); return d.sort(()=>Math.random()-0.5); }
  function cardVal(v) { if(['J','Q','K'].includes(v)) return 10; if(v==='A') return 11; return +v; }
  function handScore(hand) { let s=hand.reduce((a,c)=>a+cardVal(c.v),0), ac=hand.filter(c=>c.v==='A').length; while(s>21 && ac-- > 0) s-=10; return s; }
  function init() { deck=newDeck(); bet=0; phase='bet'; render(); }
  function deal() {
    if(bet===0){alert('ベットしてください');return;}
    if(saveData.totalScore<bet){alert('ポイントが足りません');return;}
    if(deck.length<15)deck=newDeck();
    playerHand=[deck.pop(),deck.pop()]; dealerHand=[deck.pop(),deck.pop()]; phase='play'; render();
  }
  function hit() { playerHand.push(deck.pop()); if(handScore(playerHand)>21){phase='bust';endRound();} else render(); }
  function stand() { phase='stand'; endRound(); }
  function endRound() {
    if(phase!=='bust') while(handScore(dealerHand)<17) dealerHand.push(deck.pop());
    let ps=handScore(playerHand), ds=handScore(dealerHand), result;
    if(phase==='bust') result='lose';
    else if(ds>21||ps>ds) result='win';
    else if(ps<ds) result='lose';
    else result='push';
    if(result==='win') {
      sessionWins++;
      recordWin('blackjack', bet);
    } else if(result==='lose') {
      saveData.totalScore = Math.max(0, saveData.totalScore - bet);
      saveData.wins = Math.max(0, saveData.wins);
      recordLoss(0,'blackjack'); updateUI();
    } else {
      recordGameResult('blackjack',0,false,{result:'push'});updateUI();presentGameResult('blackjack',0,null);
    }
    roundDiff=result==='win'?bet:result==='lose'?-bet:0;phase=result;bet=0;render();
  }
  // betの刻みは所持ポイントに合わせて動的に
  function betChips() {
    const pt = saveData.totalScore;
    if(pt<=0) return [];
    const pct = [5, 10, 25, 50];
    return pct.map(p=>Math.max(1,Math.round(pt*p/100)));
  }
  function placeBet(n) {
    if(saveData.totalScore >= bet+n) { bet+=n; render(); }
    else alert('ポイントが足りません');
  }
  function cardEl(c,hide) { const red=['♥','♦'].includes(c.s); return `<div class="playing-card${hide?' hidden':red?' red':''}"><span>${hide?'':c.v}</span><span class="suit">${hide?'':c.s}</span></div>`; }
  function render() {
    const pt = saveData.totalScore;
    let html = `<div class="game-header"><h2>🃏 ブラックジャック</h2><p>所持ポイントを賭けよう</p></div>`;
    html += `<div class="info-row"><div class="info-box"><div class="ib-val">${pt.toLocaleString()}</div><div class="ib-label">💰 所持pt</div></div><div class="info-box"><div class="ib-val" style="color:var(--accent1)">${bet.toLocaleString()}</div><div class="ib-label">🪙 ベット</div></div><div class="info-box"><div class="ib-val" style="color:var(--accent3)">${sessionWins}</div><div class="ib-label">🏆 今回の勝利</div></div></div>`;
    if(phase==='bet') {
      if(pt<=0) {
        html += `<div class="result-box"><div style="font-size:24px;font-weight:900;color:var(--accent1)">ポイント不足！</div><p>他のゲームでポイントを稼いでから挑戦しよう</p><button class="btn mt" onclick="goHome()">ホームへ</button></div>`;
      } else {
        const chips = betChips();
        const colors = ['#ff6b6b','#4d96ff','#6bcb77','#ffd93d'];
        const labels = ['5%','10%','25%','50%'];
        html += `<p style="font-size:12px;color:var(--text2);margin-bottom:8px">ベット額（所持ポイントの割合）:</p>`;
        html += `<div class="chip-row" data-nav-group="bj-chips">${chips.map((n,i)=>`<div class="chip" role="button" tabindex="0" data-nav aria-label="${n}ptを賭ける" style="background:${colors[i]};color:#111;flex-direction:column;gap:1px" onclick="bjBet(${n})"><span>${n}</span><span style="font-size:9px">${labels[i]}</span></div>`).join('')}`;
        html += `<div class="chip" role="button" tabindex="0" data-nav aria-label="ベットをリセット" style="background:var(--surface2);flex-direction:column" onclick="bjClear()"><span>✕</span><span style="font-size:9px">リセット</span></div></div>`;
        if(pt>=1) html += `<div style="display:flex;gap:8px;align-items:center;margin-bottom:14px"><input id="bet-custom" type="number" min="1" max="${pt}" placeholder="カスタム..." style="background:var(--surface2);border:2px solid var(--surface2);border-radius:var(--radius);padding:10px 14px;color:var(--text);font-family:inherit;font-size:14px;width:140px;outline:none"/><button class="btn btn-sm" onclick="bjBetCustom()">入力</button></div>`;
        html += `<button class="btn" data-focus-key="bj-main" onclick="bjDeal()">配る 🃏</button><p class="kbd-hint mt"><kbd>Enter</kbd> で配る</p>`;
      }
    } else {
      html += `<div class="zone-label">ディーラー (${phase==='play'?'?':handScore(dealerHand)})</div>`;
      html += `<div class="card-zone">${dealerHand.map((c,i)=>cardEl(c,phase==='play'&&i===1)).join('')}</div>`;
      html += `<div class="zone-label">あなた (${handScore(playerHand)})</div>`;
      html += `<div class="card-zone">${playerHand.map(c=>cardEl(c,false)).join('')}</div>`;
      if(phase==='play') {
        html += `<div class="bj-btns"><button class="btn" data-focus-key="bj-main" onclick="bjHit()">ヒット</button><button class="btn btn-danger" data-focus-key="bj-stand" onclick="bjStand()">スタンド</button></div><p class="kbd-hint center mt"><kbd>H</kbd> ヒット／<kbd>S</kbd> スタンド</p>`;
      } else {
        const resultMsg={win:'🎉 勝ち！',lose:'😢 負け...',push:'🤝 引き分け',bust:'💥 バスト！'}[phase];
        const ptDiff = `${roundDiff>0?'+':roundDiff===0?'±':''}${roundDiff} pt`;
        const diffColor = phase==='win'?'var(--accent3)':phase==='lose'?'var(--accent1)':'var(--text2)';
        html += `<div class="result-box" style="margin-top:10px">
          <div style="font-size:26px;font-weight:900">${resultMsg}</div>
          <div style="font-size:22px;font-weight:900;color:${diffColor};margin-top:6px">${ptDiff}</div>
          <p>残り ${saveData.totalScore} pt</p></div>`;
        if(saveData.totalScore<=0)html += `<p style="color:var(--accent1);margin-top:10px">ポイントがないため、続けるにはほかのゲームで獲得してください。</p>`;
      }
    }
    el.innerHTML = html;
    window.bjBet=placeBet;
    window.bjClear=()=>{bet=0;render();};
    window.bjBetCustom=()=>{const v=parseInt(document.getElementById('bet-custom')?.value);if(v>0&&v<=saveData.totalScore){bet=v;render();}else alert('1〜'+saveData.totalScore+' の範囲で入力してください');};
    window.bjDeal=deal; window.bjHit=hit; window.bjStand=stand;
    onGameKey(key=>{
      if(phase==='bet'&&key==='Enter'){if(bet>0)deal();return true;}
      if(phase==='play'&&key==='h'){hit();return true;}
      if(phase==='play'&&key==='s'){stand();return true;}
      return false;
    });
    window.bjNext=()=>{bet=0;phase='bet';render();};
  }
  init();
};
