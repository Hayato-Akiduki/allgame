
// ================================================================
// SOLITAIRE (DRAW ONE KLONDIKE)
// ================================================================
games.solitaire = function(el) {
  const suits=['♠','♥','♦','♣'],red=s=>s==='♥'||s==='♦',label=r=>r===1?'A':r===11?'J':r===12?'Q':r===13?'K':r;
  let stock=[],waste=[],foundations=[[],[],[],[]],tableau=[[],[],[],[],[],[],[]],selected=null,moves=0,seconds=0,ended=false,timer=0,message='カードを選び、移動先を押してください';
  function newGame(){
    const deck=[];suits.forEach(s=>{for(let r=1;r<=13;r++)deck.push({s,r,up:false,id:`${s}${r}`});});
    for(let i=deck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
    for(let c=0;c<7;c++)for(let i=0;i<=c;i++){const card=deck.pop();card.up=i===c;tableau[c].push(card);}stock=deck;render();timer=setInterval(()=>{seconds++;updateStats();},1000);
  }
  // Face-up cards join arrow-key navigation; face-down ones stay out of the Tab order.
  const cardHtml=(card,sel,action,name)=>`<button class="sol-card ${red(card.s)?'red':''} ${card.up?'':'back'} ${sel?'selected':''}" ${action} ${card.up||name?'data-nav':'tabindex="-1"'} aria-pressed="${!!sel}" aria-label="${name||(card.up?label(card.r)+card.s:'裏向きのカード')}"><span>${card.up?label(card.r)+card.s:'◆'}</span></button>`;
  function render(){
    el.innerHTML=`<div class="game-header"><h2>♠️ ソリティア</h2><p>1枚めくり・クリック／タップ移動</p><p class="kbd-hint">矢印キーでカードを選び、<kbd>Enter</kbd>／<kbd>Space</kbd> で選択・移動</p></div>
      <div class="info-row"><div class="info-box"><div class="ib-val" id="sol-moves">${moves}</div><div class="ib-label">手数</div></div><div class="info-box"><div class="ib-val" id="sol-time">${timeText()}</div><div class="ib-label">時間</div></div><div class="info-box"><div class="ib-val">${foundations.reduce((n,p)=>n+p.length,0)} / 52</div><div class="ib-label">組札</div></div></div>
      <div data-nav-group="sol"><div class="sol-top">
        <div class="sol-pile" onclick="solStock()" ${stock.length?'':'role="button" data-nav aria-label="山札を戻す"'}>${stock.length?cardHtml({up:false,s:'♠',r:0},false,'onclick="event.stopPropagation();solStock()"',`山札をめくる（残り${stock.length}枚）`):`<span class="sol-slot-label">↻</span>`}</div>
        <div class="sol-pile">${waste.length?cardHtml(waste.at(-1),selected?.zone==='waste','onclick="event.stopPropagation();solWaste()"'):'<span class="sol-slot-label">捨</span>'}</div><div></div>
        ${foundations.map((p,i)=>`<div class="sol-pile" onclick="solFoundation(${i})" ${p.length?'':`role="button" data-nav aria-label="組札${suits[i]}（空）"`}>${p.length?cardHtml(p.at(-1),selected?.zone==='foundation'&&selected.col===i,`onclick="event.stopPropagation();solFoundation(${i})"`):`<span class="sol-slot-label">${suits[i]}</span>`}</div>`).join('')}
      </div>
      <div class="sol-board">${tableau.map((col,c)=>`<div class="sol-pile sol-tableau" onclick="solTableau(${c},-1)" ${col.length?'':`role="button" data-nav aria-label="列${c+1}（空き）"`}>${col.map((card,i)=>cardHtml(card,selected?.zone==='tableau'&&selected.col===c&&selected.index===i,`onclick="event.stopPropagation();solTableau(${c},${i})"`)).join('')}${!col.length?'<span class="sol-slot-label">K</span>':''}</div>`).join('')}</div></div>
      <div id="sol-status" class="sol-status">${message}</div><div class="flex-center" style="flex-wrap:wrap"><button class="btn btn-sm" onclick="solHint()">💡 ヒント</button><button class="btn btn-sm" onclick="startGame('solitaire')">🔄 新しく配る</button></div><div id="sol-result"></div>`;
  }
  function timeText(){return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;}
  function updateStats(){const t=el.querySelector('#sol-time');if(t)t.textContent=timeText();}
  function sourceCards(){if(!selected)return[];if(selected.zone==='waste')return waste.slice(-1);if(selected.zone==='foundation')return foundations[selected.col].slice(-1);return tableau[selected.col].slice(selected.index);}
  function validRun(cards){return cards.every((c,i)=>i===0||(cards[i-1].r===c.r+1&&red(cards[i-1].s)!==red(c.s)));}
  function removeSelected(){if(selected.zone==='waste')return waste.splice(-1);if(selected.zone==='foundation')return foundations[selected.col].splice(-1);return tableau[selected.col].splice(selected.index);}
  function reveal(col){const p=tableau[col],top=p.at(-1);if(top&&!top.up){top.up=true;moves++;message='裏向きのカードをめくりました';}}
  function sameSelection(zone,col,index){return selected&&selected.zone===zone&&selected.col===col&&(index===undefined||selected.index===index);}
  function choose(zone,col,index){selected={zone,col,index};message='移動先を選んでください';render();}
  function afterMove(fromCol){moves++;selected=null;if(Number.isInteger(fromCol))reveal(fromCol);message='移動しました';checkWin();if(!ended)render();}
  function stockClick(){if(ended)return;if(stock.length){const c=stock.pop();c.up=true;waste.push(c);moves++;message='山札を1枚めくりました';}else if(waste.length){stock=waste.reverse().map(c=>({...c,up:false}));waste=[];moves++;message='捨て札を山札へ戻しました';}selected=null;render();}
  function wasteClick(){if(!waste.length||ended)return;if(sameSelection('waste')){selected=null;message='選択を解除しました';render();return;}choose('waste',0,waste.length-1);}
  function tableauClick(col,index){
    if(ended)return;const pile=tableau[col],card=index>=0?pile[index]:null;
    if(card&&!card.up){if(index===pile.length-1){reveal(col);render();}return;}
    if(selected){
      if(sameSelection('tableau',col,index)){selected=null;message='選択を解除しました';render();return;}
      const moving=sourceCards(),dest=pile.at(-1),allowed=moving.length&&validRun(moving)&&(!dest?moving[0].r===13:(dest.up&&dest.r===moving[0].r+1&&red(dest.s)!==red(moving[0].s)));
      if(allowed){const from=selected.zone==='tableau'?selected.col:null;tableau[col].push(...removeSelected());afterMove(from);return;}
      message=dest?'色違いで1つ小さいカードだけ置けます':'空の列にはKだけ置けます';selected=null;render();return;
    }
    if(card&&card.up&&validRun(pile.slice(index)))choose('tableau',col,index);
  }
  function foundationClick(fi){
    if(ended)return;
    if(!selected){if(foundations[fi].length)choose('foundation',fi,foundations[fi].length-1);return;}
    if(sameSelection('foundation',fi)){selected=null;render();return;}
    const cards=sourceCards(),card=cards[0],pile=foundations[fi],top=pile.at(-1);
    if(cards.length===1&&card.s===suits[fi]&&((!top&&card.r===1)||(top&&card.r===top.r+1))){const from=selected.zone==='tableau'?selected.col:null;pile.push(...removeSelected());afterMove(from);return;}
    message='組札は同じマークをAから順番に置きます';selected=null;render();
  }
  function hint(){
    let text='動かせるカードを探してみよう。';
    for(let c=0;c<7;c++){const top=tableau[c].at(-1);if(top&&!top.up){text=`${c+1}列目の裏カードをめくれます`;break;}if(top){const fi=suits.indexOf(top.s),ft=foundations[fi].at(-1);if((!ft&&top.r===1)||(ft&&top.r===ft.r+1)){text=`${c+1}列目の ${label(top.r)}${top.s} を組札へ移せます`;break;}}}
    if(waste.length){const c=waste.at(-1),fi=suits.indexOf(c.s),ft=foundations[fi].at(-1);if((!ft&&c.r===1)||(ft&&c.r===ft.r+1))text=`捨て札の ${label(c.r)}${c.s} を組札へ移せます`;}
    else if(stock.length)text='山札をめくってみましょう';message=`💡 ${text}`;selected=null;render();
  }
  function checkWin(){if(foundations.every(p=>p.length===13)){ended=true;clearInterval(timer);const score=Math.max(300,Math.round(3000-seconds*7-moves*4));recordWin('solitaire',score);render();el.querySelector('#sol-result').innerHTML=`<div class="result-box mt"><div class="result-score">🎉 CLEAR</div><p>${timeText()}・${moves}手・スコア ${score.toLocaleString()}</p>${xpResultHtml(score,'solitaire')}<button class="btn btn-success mt" onclick="startGame('solitaire')">もう一度</button></div>`;}}
  window.solStock=stockClick;window.solWaste=wasteClick;window.solTableau=tableauClick;window.solFoundation=foundationClick;window.solHint=hint;
  el._quit=()=>{if(ended)return;ended=true;clearInterval(timer);message='ここで終了しました';render();recordQuit('solitaire',foundations.reduce((n,p)=>n+p.length,0)*10);};
  el._cleanup=()=>{ended=true;clearInterval(timer);['solStock','solWaste','solTableau','solFoundation','solHint'].forEach(k=>delete window[k]);};
  newGame();
};
