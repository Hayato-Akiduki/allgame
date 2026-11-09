
// GAME 25: REVERSI
games.reversi = function(el) {
  const DIRS=[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
  const difficulties={easy:'かんたん',normal:'ふつう',hard:'むずかしい'};
  let board=[],turn=1,mode='cpu',difficulty='normal',locked=false,ended=false,passes=0;

  function menu(){
    el.innerHTML=`<div class="game-header"><h2>🟢 リバーシ</h2><p>挟んだ石をひっくり返して、盤面を支配しよう</p></div>
      <div class="result-box"><h3>対戦モード</h3><div class="flex-center mt">
        ${Object.entries(difficulties).map(([id,name])=>`<button class="btn btn-success" data-mode="cpu" data-difficulty="${id}">🤖 ${name}</button>`).join('')}
        <button class="btn btn-purple" data-mode="two">👥 2人で対戦</button>
      </div><div class="meta-sub mt">CPUの強さ：かんたん＝ランダム、ふつう＝角を優先、むずかしい＝3手先を読む。<br>黒が先手です。CPU戦ではあなたが黒を担当します。</div></div>`;
    el.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{difficulty=b.dataset.difficulty||'normal';start(b.dataset.mode);}));
  }
  function start(selected){
    mode=selected;board=Array.from({length:8},()=>Array(8).fill(0));
    board[3][3]=2;board[4][4]=2;board[3][4]=1;board[4][3]=1;turn=1;locked=false;ended=false;passes=0;
    el.innerHTML=`<div class="game-header"><h2>🟢 リバーシ</h2><p>${mode==='cpu'?'CPU：'+difficulties[difficulty]:'2人で対戦'}</p><p id="rev-status"></p><p class="kbd-hint">矢印キーで置ける場所を選んで <kbd>Enter</kbd></p></div>
      <div class="info-row">
        <div class="info-box"><div class="ib-val" id="rev-black">2</div><div class="ib-label">⚫ 黒${mode==='cpu'?'（あなた）':''}</div></div>
        <div class="info-box"><div class="ib-val" id="rev-white">2</div><div class="ib-label">⚪ 白${mode==='cpu'?'（CPU）':''}</div></div>
      </div>
      <div class="reversi-board" id="rev-board" data-nav-group="reversi" role="grid" aria-label="リバーシ盤"></div>
      <div class="center"><button class="btn btn-sm" onclick="startGame('reversi')">モード選択へ</button></div>
      <div id="rev-result"></div>`;
    render();
  }
  function flipsFor(x,y,player){
    if(x<0||x>7||y<0||y>7||board[y][x])return [];
    const enemy=3-player,all=[];
    for(const [dx,dy] of DIRS){
      const line=[];let nx=x+dx,ny=y+dy;
      while(nx>=0&&nx<8&&ny>=0&&ny<8&&board[ny][nx]===enemy){line.push([nx,ny]);nx+=dx;ny+=dy;}
      if(line.length&&nx>=0&&nx<8&&ny>=0&&ny<8&&board[ny][nx]===player)all.push(...line);
    }
    return all;
  }
  function legalMoves(player){
    const list=[];for(let y=0;y<8;y++)for(let x=0;x<8;x++){const flips=flipsFor(x,y,player);if(flips.length)list.push({x,y,flips});}return list;
  }
  function render(){
    const area=el.querySelector('#rev-board');if(!area)return;const legal=new Set(legalMoves(turn).map(m=>`${m.x},${m.y}`));area.innerHTML='';
    for(let y=0;y<8;y++)for(let x=0;x<8;x++){
      const cell=document.createElement('button'),v=board[y][x];cell.className='reversi-cell';cell.setAttribute('data-nav','');cell.setAttribute('role','gridcell');
      if(v)cell.innerHTML=`<span class="reversi-disc ${v===1?'black':'white'}"></span>`;
      if(!v&&legal.has(`${x},${y}`)){cell.classList.add('reversi-hint');cell.setAttribute('aria-label',`${x+1}列${y+1}行に置く`);}
      else cell.setAttribute('aria-label',v===1?'黒石':v===2?'白石':'空きマス');
      cell.disabled=locked||ended||!legal.has(`${x},${y}`)||(mode==='cpu'&&turn===2);
      cell.addEventListener('click',()=>play(x,y));area.appendChild(cell);
    }
    const c=countDiscs();el.querySelector('#rev-black').textContent=c.black;el.querySelector('#rev-white').textContent=c.white;
    const st=el.querySelector('#rev-status');if(st&&!ended)st.textContent=locked?'CPUが考えています…':`${turn===1?'⚫ 黒':'⚪ 白'}の番です`;
  }
  function countDiscs(){
    let black=0,white=0;board.forEach(row=>row.forEach(v=>{if(v===1)black++;else if(v===2)white++;}));return {black,white};
  }
  function play(x,y){
    if(locked||ended||(mode==='cpu'&&turn===2))return;const flips=flipsFor(x,y,turn);if(!flips.length)return;applyMove({x,y,flips});
  }
  function applyMove(move){
    board[move.y][move.x]=turn;move.flips.forEach(([x,y])=>board[y][x]=turn);turn=3-turn;passes=0;render();gameDelay(advance,260);
  }
  function advance(){
    if(ended)return;let moves=legalMoves(turn);
    if(!moves.length){
      passes++;const passed=turn;turn=3-turn;moves=legalMoves(turn);render();
      if(!moves.length||passes>=2){finish();return;}
      el.querySelector('#rev-status').textContent=`${passed===1?'黒':'白'}は置けないためパス`;
      gameDelay(advance,850);return;
    }
    if(mode==='cpu'&&turn===2){locked=true;render();gameDelay(cpuMove,650);}else{locked=false;render();}
  }
  function cpuMove(){
    if(ended)return;const moves=legalMoves(2);if(!moves.length){locked=false;advance();return;}
    if(difficulty==='easy'){locked=false;applyMove(moves[Math.floor(Math.random()*moves.length)]);return;}
    const corners=new Set(['0,0','7,0','0,7','7,7']),danger=new Set(['1,1','6,1','1,6','6,6']);
    moves.forEach(m=>{const k=`${m.x},${m.y}`;m.value=m.flips.length+(corners.has(k)?100:0)+(m.x===0||m.x===7||m.y===0||m.y===7?12:0)-(danger.has(k)?20:0)+Math.random()*3;});
    if(difficulty==='hard')moves.forEach(m=>{m.value=withMove(m,2,()=>search(1,2,-Infinity,Infinity));});
    moves.sort((a,b)=>b.value-a.value);locked=false;applyMove(moves[0]);
  }
  function withMove(move,player,evaluate){
    const saved=board;board=board.map(row=>row.slice());board[move.y][move.x]=player;
    move.flips.forEach(([x,y])=>board[y][x]=player);
    try{return evaluate();}finally{board=saved;}
  }
  function search(player,depth,alpha,beta){
    const moves=legalMoves(player),other=legalMoves(3-player);
    if(!moves.length&&!other.length){const c=countDiscs();return Math.sign(c.white-c.black)*100000+c.white-c.black;}
    if(!depth){
      let value=(legalMoves(2).length-legalMoves(1).length)*8;
      for(let y=0;y<8;y++)for(let x=0;x<8;x++){
        if(!board[y][x])continue;
        const edge=(x===0||x===7||y===0||y===7),corner=(x===0||x===7)&&(y===0||y===7);
        const cx=x<4?0:7,cy=y<4?0:7;
        const danger=!board[cy][cx]&&Math.abs(x-cx)<=1&&Math.abs(y-cy)<=1&&!corner;
        value+=(board[y][x]===2?1:-1)*(corner?120:danger?-35:edge?12:1);
      }
      return value;
    }
    if(!moves.length)return search(3-player,depth-1,alpha,beta);
    let best=player===2?-Infinity:Infinity;
    for(const move of moves){
      const value=withMove(move,player,()=>search(3-player,depth-1,alpha,beta));
      if(player===2){best=Math.max(best,value);alpha=Math.max(alpha,best);}else{best=Math.min(best,value);beta=Math.min(beta,best);}
      if(beta<=alpha)break;
    }
    return best;
  }
  function finish(){
    if(ended)return;ended=true;locked=true;const c=countDiscs(),draw=c.black===c.white,won=mode==='cpu'&&c.black>c.white,score=won?600+(c.black-c.white)*30:0;
    const winner=draw?'🤝 引き分け':c.black>c.white?'⚫ 黒の勝ち！':'⚪ 白の勝ち！';
    // Only a CPU match counts as a win or loss; two-player matches and draws end neutrally.
    if(won)recordWin('reversi',score);else if(mode==='two'||draw)recordNeutral('reversi',winner);else recordLoss(score,'reversi');render();
    el.querySelector('#rev-status').textContent='対局終了';
    el.querySelector('#rev-result').innerHTML=`<div class="result-box mt"><div class="result-score">${c.black} - ${c.white}</div><p>${winner}</p>
      ${won?xpResultHtml(score,'reversi'):`<div class="meta-sub">${mode==='two'?'2人対戦はスコア・XPの対象外です':'CPU戦で黒が勝つとスコアとXPを獲得できます'}</div>`}
      <button class="btn btn-warn mt" onclick="startGame('reversi')">もう一度</button></div>`;
  }
  menu();
  el._cleanup=()=>{ended=true;};
};
