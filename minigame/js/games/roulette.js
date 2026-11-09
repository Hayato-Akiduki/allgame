
// GAME 7: ROULETTE  ── 所持ポイントを賭ける
let rouletteRAF=null;
games.roulette = function(el) {
  let bet=0, betType=null, spinning=false;
  const colors=['red','black','green','red','black','red','black','red','black','red','black','black','red','black','red','black','red','black','black','red','black','red','black','black','red','black','red','red','black','red','black','red','black','black','red','black','red'];
  const nums=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
  let angle=0, canvas, ctx;
  function drawWheel(a) {
    if(!canvas)return;
    const N=nums.length, r=110, cx=120, cy=120;
    ctx.clearRect(0,0,240,240);
    nums.forEach((n,i)=>{
      const s=a+(i/N)*2*Math.PI, e=a+((i+1)/N)*2*Math.PI;
      ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,s,e);ctx.closePath();
      ctx.fillStyle=colors[i]==='red'?'#c0392b':colors[i]==='black'?'#222':'#1a7a1a';
      ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.stroke();
      ctx.save();ctx.translate(cx,cy);ctx.rotate(a+(i+0.5)/N*2*Math.PI);
      ctx.textAlign='right';ctx.fillStyle='#fff';ctx.font='bold 10px sans-serif';
      ctx.fillText(n,r-5,3);ctx.restore();
    });
    ctx.beginPath();ctx.arc(cx,cy,16,0,2*Math.PI);ctx.fillStyle='#ffd93d';ctx.fill();
    ctx.beginPath();ctx.moveTo(cx+120,cy);ctx.lineTo(cx+100,cy-9);ctx.lineTo(cx+100,cy+9);ctx.fillStyle='#ffd93d';ctx.fill();
  }
  function renderUI() {
    const pt = saveData.totalScore;
    const pct=[5,10,25,50]; const cols=['#ff6b6b','#4d96ff','#6bcb77','#ffd93d']; const labels=['5%','10%','25%','50%'];
    const chips = pct.map(p=>Math.max(1,Math.round(pt*p/100)));
    document.getElementById('rl-pt').textContent = pt;
    document.getElementById('rl-bet').textContent = bet;
    const cr=document.getElementById('rl-chiprow');
    if(cr) cr.innerHTML = chips.map((n,i)=>`<div class="chip" role="button" tabindex="0" data-nav aria-label="${n}ptを賭ける" style="background:${cols[i]};color:#111;flex-direction:column;gap:1px" onclick="rlBet(${n})"><span>${n}</span><span style="font-size:9px">${labels[i]}</span></div>`).join('')
      + `<div class="chip" role="button" tabindex="0" data-nav aria-label="ベットをリセット" style="background:var(--surface2);flex-direction:column" onclick="rlClear()"><span>✕</span><span style="font-size:9px">リセット</span></div>`;
  }
  function spin() {
    if(spinning){return;}
    if(!betType){alert('色を選んでください');return;}
    if(bet===0){alert('ベットしてください');return;}
    if(saveData.totalScore<bet){alert('ポイントが足りません');return;}
    spinning=true;
    document.getElementById('rl-spin-btn').disabled=true;
    let vel=0.25+Math.random()*0.15, dur=200+Math.random()*100, frame=0;
    function step() {
      angle+=vel;vel*=0.985;drawWheel(angle);frame++;
      if(frame<dur){rouletteRAF=requestAnimationFrame(step);}
      else {
        spinning=false;
        document.getElementById('rl-spin-btn').disabled=false;
        const norm=((angle%(2*Math.PI))+2*Math.PI)%(2*Math.PI);
        const idx=Math.floor(((2*Math.PI-norm)/(2*Math.PI))*nums.length+0.5)%nums.length;
        const num=nums[idx],col=colors[idx];
        const won=(betType==='red'&&col==='red')||(betType==='black'&&col==='black')||(betType==='green'&&col==='green');
        let diff=0;
        if(won){
          const mult=betType==='green'?17:1;
          diff=bet*mult;
          recordWin('roulette',diff);
        } else {
          diff=-bet;
          saveData.totalScore=Math.max(0,saveData.totalScore-bet);
          recordLoss(0,'roulette');updateUI();
        }
        const diffStr=won?`+${diff} pt`:`${diff} pt`;
        const diffColor=won?'var(--accent3)':'var(--accent1)';
        const colLabel=col==='red'?'赤':col==='black'?'黒':'緑';
        document.getElementById('rl-msg').innerHTML=`${won?'🎉 当たり！':'😢 はずれ...'} → <strong>${num}</strong> (${colLabel})<br><span style="font-size:20px;font-weight:900;color:${diffColor}">${diffStr}</span><br><span style="font-size:13px;color:var(--text2)">残り ${saveData.totalScore} pt</span>`;
        bet=0; renderUI();
      }
    }
    rouletteRAF=requestAnimationFrame(step);
  }
  el.innerHTML = `
    <div class="game-header"><h2>🎡 ルーレット</h2><p>所持ポイントを賭けよう</p></div>
    <div class="roulette-wrap">
      <canvas id="rl-canvas" width="240" height="240" class="roulette-canvas"></canvas>
      <div class="bet-info">💰 <span id="rl-pt">${saveData.totalScore}</span> pt　|　ベット: <span id="rl-bet">0</span> pt</div>
      <div id="rl-msg" style="color:var(--accent2);font-weight:700;margin-bottom:10px;min-height:44px;line-height:1.6"></div>
      <p style="margin-bottom:8px;color:var(--text2);font-size:12px">① 色を選ぶ（赤/黒 ×2倍 / 緑 ×18倍）</p>
      <div class="bet-btns">
        <button class="btn btn-danger" onclick="rlBetType('red')">🔴 赤</button>
        <button class="btn" style="background:#333;border:2px solid #666" onclick="rlBetType('black')">⚫ 黒</button>
        <button class="btn btn-success" onclick="rlBetType('green')">🟢 緑</button>
      </div>
      <div id="rl-type" style="color:var(--text2);font-size:12px;margin:8px 0">選択中: なし</div>
      <p style="margin-bottom:8px;color:var(--text2);font-size:12px">② ベット額を選ぶ</p>
      <div class="chip-row" id="rl-chiprow" data-nav-group="rl-chips" style="justify-content:center"></div>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:14px;justify-content:center">
        <input id="rl-custom" type="number" min="1" max="${saveData.totalScore}" placeholder="カスタム..." style="background:var(--surface2);border:2px solid var(--surface2);border-radius:var(--radius);padding:10px 14px;color:var(--text);font-family:inherit;font-size:14px;width:140px;outline:none"/>
        <button class="btn btn-sm" onclick="rlBetCustom()">入力</button>
      </div>
      <button id="rl-spin-btn" class="btn btn-warn" onclick="rlSpin()">🎡 スピン！</button>
    </div>`;
  canvas=document.getElementById('rl-canvas');ctx=canvas.getContext('2d');
  drawWheel(angle); renderUI();
  window.rlBetType=t=>{betType=t;document.getElementById('rl-type').textContent='選択中: '+(t==='red'?'🔴 赤':t==='black'?'⚫ 黒':'🟢 緑');};
  window.rlBet=n=>{if(saveData.totalScore>=bet+n){bet+=n;renderUI();}else alert('ポイントが足りません');};
  window.rlClear=()=>{bet=0;renderUI();};
  window.rlBetCustom=()=>{const v=parseInt(document.getElementById('rl-custom')?.value);if(v>0&&v<=saveData.totalScore){bet=v;renderUI();}else alert('1〜'+saveData.totalScore+' の範囲で入力してください');};
  window.rlSpin=spin;
  onGameKey(key=>{if(key!==' '&&key!=='Enter')return false;spin();return true;});
};
