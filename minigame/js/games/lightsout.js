
// GAME 26: LIGHTS OUT
games.lightsout = function(el) {
  const MODES={easy:{name:'かんたん',size:4,scramble:7,base:700,color:'#6bcb77'},normal:{name:'ふつう',size:5,scramble:12,base:1200,color:'#4d96ff'},hard:{name:'むずかしい',size:6,scramble:18,base:1900,color:'#ff6b6b'}};
  let mode=null,grid=[],initial=[],moves=0,history=[],ended=false;

  function menu(){
    el.innerHTML=`<div class="game-header"><h2>💡 ライツアウト</h2><p>押した場所と上下左右のライトが反転します</p></div>
      <div class="result-box"><h3>難易度を選択</h3><div class="flex-center mt">
      ${Object.entries(MODES).map(([id,m])=>`<button class="btn" data-light-mode="${id}" style="background:${m.color}">${m.name}<br><small>${m.size} × ${m.size}</small></button>`).join('')}
      </div><div class="meta-sub mt">すべて消灯できればクリア。問題は毎回変わり、必ず解けるように生成されます。</div></div>`;
    el.querySelectorAll('[data-light-mode]').forEach(b=>b.addEventListener('click',()=>start(b.dataset.lightMode)));
  }
  function toggleAt(index,target=grid){
    const n=mode.size,x=index%n,y=Math.floor(index/n);
    [[0,0],[-1,0],[1,0],[0,-1],[0,1]].forEach(([dx,dy])=>{const nx=x+dx,ny=y+dy;if(nx>=0&&nx<n&&ny>=0&&ny<n){const i=ny*n+nx;target[i]=!target[i];}});
  }
  function makePuzzle(){
    do{
      grid=Array(mode.size*mode.size).fill(false);
      for(let i=0;i<mode.scramble;i++)toggleAt(Math.floor(Math.random()*grid.length));
    }while(grid.every(v=>!v));
    initial=grid.slice();
  }
  function start(id){
    mode=MODES[id];moves=0;history=[];ended=false;makePuzzle();
    el._quit=()=>{if(ended)return;ended=true;render();recordQuit('lightsout',0);};if(typeof updateQuitBar==='function')updateQuitBar();
    el.innerHTML=`<div class="game-header"><h2>💡 ライツアウト</h2><p id="light-status">すべてのライトを消そう！</p><p class="kbd-hint">矢印キーで移動、<kbd>Enter</kbd>／<kbd>Space</kbd> で押す</p></div>
      <div class="info-row">
        <div class="info-box"><div class="ib-val">${mode.name}</div><div class="ib-label">難易度</div></div>
        <div class="info-box"><div class="ib-val" id="light-moves">0</div><div class="ib-label">手数</div></div>
        <div class="info-box"><div class="ib-val" id="light-count">0</div><div class="ib-label">点灯中</div></div>
      </div>
      <div class="lights-board" id="lights-board" data-nav-group="lights" role="grid" aria-label="ライツアウト盤面"></div>
      <div class="flex-center"><button class="btn btn-sm" id="light-undo">↶ 1手戻す</button><button class="btn btn-sm" id="light-reset">リセット</button><button class="btn btn-sm" id="light-menu">難易度選択</button></div>
      <div id="light-result"></div>`;
    el.querySelector('#light-undo').addEventListener('click',undo);
    el.querySelector('#light-reset').addEventListener('click',()=>{if(ended)return;grid=initial.slice();moves=0;history=[];render();});
    el.querySelector('#light-menu').addEventListener('click',()=>startGame('lightsout'));
    render();
  }
  function render(){
    const board=el.querySelector('#lights-board');if(!board)return;
    board.style.gridTemplateColumns=`repeat(${mode.size},1fr)`;board.innerHTML='';
    grid.forEach((on,i)=>{
      const cell=document.createElement('button');cell.className=`light-cell${on?' on':''}`;cell.setAttribute('data-nav','');cell.disabled=ended;cell.setAttribute('role','gridcell');cell.setAttribute('aria-label',`${Math.floor(i/mode.size)+1}行${i%mode.size+1}列、${on?'点灯':'消灯'}`);
      cell.addEventListener('click',()=>press(i));board.appendChild(cell);
    });
    el.querySelector('#light-moves').textContent=moves;el.querySelector('#light-count').textContent=grid.filter(Boolean).length;
  }
  function press(index){
    if(ended)return;history.push(grid.slice());toggleAt(index);moves++;render();
    if(grid.every(v=>!v))finish();
  }
  function undo(){
    if(ended||!history.length)return;grid=history.pop();moves--;el.querySelector('#light-status').textContent='1手戻しました';render();
  }
  function finish(){
    if(ended)return;ended=true;const score=Math.max(150,mode.base-moves*15);recordWin('lightsout',score);render();
    el.querySelector('#light-status').textContent='全ライト消灯！';
    el.querySelector('#light-result').innerHTML=`<div class="result-box mt"><div class="result-score">${score.toLocaleString()}</div><p>🎉 ${moves}手でクリア！</p>${xpResultHtml(score,'lightsout')}<button class="btn btn-warn mt" onclick="startGame('lightsout')">もう一度</button></div>`;
  }
  menu();
  el._cleanup=()=>{ended=true;};
};
