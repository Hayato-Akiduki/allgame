const PIN_PULL_STAGES=[
  {name:'宝物を届けよう',hint:'宝物の下と、探検家の上のピンを抜いて道をつなごう。',rooms:[{id:'gold',x:200,y:55,gold:2},{id:'middle',x:200,y:205},{id:'hero',x:200,y:380,hero:true}],pins:[['gold','middle'],['middle','hero']]},
  {name:'まずは溶岩を冷やそう',hint:'水1で溶岩1を冷やせます。青い部屋のピンから抜こう。',rooms:[{id:'water',x:65,y:55,water:1},{id:'gold',x:335,y:55,gold:2},{id:'lava',x:200,y:205,lava:1},{id:'hero',x:200,y:380,hero:true}],pins:[['gold','lava'],['lava','hero'],['water','lava']]},
  {name:'水を2つ集めよう',hint:'溶岩は2あります。両方の水を集めてから宝物を通そう。',rooms:[{id:'water1',x:65,y:55,water:1},{id:'water2',x:335,y:55,water:1},{id:'gold',x:65,y:225,gold:3},{id:'lava',x:230,y:225,lava:2},{id:'hero',x:230,y:390,hero:true}],pins:[['gold','lava'],['water1','lava'],['lava','hero'],['water2','lava']]},
  {name:'2つの溶岩の部屋',hint:'水2を上の溶岩に注ぐと水1が残ります。下の部屋にも届けて冷やそう。',rooms:[{id:'water',x:65,y:45,water:2},{id:'gold',x:335,y:45,gold:3},{id:'lava1',x:200,y:165,lava:1},{id:'lava2',x:200,y:280,lava:1},{id:'hero',x:200,y:405,hero:true}],pins:[['lava2','hero'],['gold','lava1'],['water','lava1'],['lava1','lava2']]},
  {name:'最後の宝物庫',hint:'溶岩は合計3、水も合計3。上の水を下にも流し、右の水と合わせてから宝物を届けよう。',rooms:[{id:'water1',x:65,y:45,water:2},{id:'gold',x:335,y:45,gold:4},{id:'lava1',x:170,y:165,lava:1},{id:'water2',x:335,y:185,water:1},{id:'lava2',x:170,y:295,lava:2},{id:'hero',x:170,y:420,hero:true}],pins:[['gold','lava1'],['lava1','lava2'],['lava2','hero'],['water2','lava2'],['water1','lava1']]},
  {name:'水はどこへ？',hint:'最初はピン1、次にピン3を抜いてみよう。宝物の道を開くのは溶岩を冷やしてから！',rooms:[{id:'room1',x:335,y:412},{id:'water1',x:65,y:45,water:1},{id:'gold1',x:335,y:290,gold:5},{id:'lava1',x:200,y:412,lava:2},{id:'water2',x:200,y:165,water:1},{id:'hero1',x:65,y:412,hero:true}],pins:[['water2','gold1'],['gold1','lava1'],['water1','water2'],['room1','lava1'],['lava1','hero1'],['gold1','room1']]},
  {name:'2つの宝物',hint:'最初はピン1、次にピン5を抜いてみよう。宝物の道を開くのは溶岩を冷やしてから！',rooms:[{id:'gold1',x:65,y:290,gold:2},{id:'water1',x:335,y:45,water:1},{id:'lava1',x:65,y:412,lava:1},{id:'water2',x:335,y:290,water:1},{id:'gold2',x:200,y:165,gold:3},{id:'lava2',x:200,y:412,lava:1},{id:'hero1',x:335,y:412,hero:true}],pins:[['gold2','gold1'],['gold1','lava2'],['lava2','hero1'],['gold1','lava1'],['lava2','lava1'],['water2','hero1'],['water1','gold2']]},
  {name:'溶岩の通せんぼ',hint:'最初はピン1、次にピン3を抜いてみよう。宝物の道を開くのは溶岩を冷やしてから！',rooms:[{id:'gold1',x:335,y:45,gold:3},{id:'water1',x:65,y:290,water:1},{id:'lava1',x:200,y:165,lava:1},{id:'water2',x:65,y:412,water:3},{id:'gold2',x:65,y:45,gold:5},{id:'lava2',x:200,y:45,lava:2},{id:'hero1',x:200,y:412,hero:true}],pins:[['lava1','water1'],['lava2','gold1'],['water1','water2'],['gold2','lava2'],['gold1','lava1'],['water2','hero1'],['gold2','lava1'],['lava2','lava1']]},
  {name:'3つの溶岩',hint:'最初はピン1、次にピン2を抜いてみよう。宝物の道を開くのは溶岩を冷やしてから！',rooms:[{id:'gold1',x:335,y:45,gold:2},{id:'water1',x:335,y:412,water:1},{id:'lava1',x:335,y:165,lava:2},{id:'lava2',x:65,y:290,lava:1},{id:'gold2',x:200,y:45,gold:2},{id:'lava3',x:335,y:290,lava:1},{id:'water2',x:200,y:412,water:2},{id:'hero1',x:65,y:412,hero:true}],pins:[['water2','hero1'],['lava3','water1'],['lava3','water2'],['gold2','gold1'],['gold1','lava1'],['water1','water2'],['lava1','lava3'],['lava2','hero1']]},
  {name:'回り道の宝物',hint:'最初はピン1、次にピン3を抜いてみよう。宝物の道を開くのは溶岩を冷やしてから！',rooms:[{id:'gold1',x:335,y:45,gold:2},{id:'lava1',x:200,y:290,lava:2},{id:'gold2',x:200,y:45,gold:2},{id:'water1',x:65,y:165,water:2},{id:'lava2',x:65,y:412,lava:2},{id:'lava3',x:200,y:165,lava:1},{id:'water2',x:65,y:290,water:2},{id:'hero1',x:200,y:412,hero:true}],pins:[['water2','lava1'],['lava2','hero1'],['lava3','water1'],['gold2','lava3'],['water1','lava1'],['lava1','hero1'],['gold2','water1'],['water2','hero1'],['gold1','lava3']]},
  {name:'溶岩だらけの坑道',hint:'最初はピン2、次にピン1を抜いてみよう。宝物の道を開くのは溶岩を冷やしてから！',rooms:[{id:'water1',x:335,y:290,water:3},{id:'lava1',x:200,y:290,lava:2},{id:'lava2',x:65,y:290,lava:1},{id:'lava3',x:200,y:412,lava:1},{id:'room1',x:335,y:165},{id:'gold1',x:65,y:45,gold:5},{id:'gold2',x:200,y:45,gold:2},{id:'lava4',x:335,y:45,lava:1},{id:'hero1',x:335,y:412,hero:true}],pins:[['lava1','hero1'],['water1','hero1'],['lava2','lava3'],['lava1','lava3'],['gold2','lava4'],['water1','lava1'],['room1','lava1'],['lava3','hero1'],['gold1','gold2'],['lava4','room1']]},
  {name:'伝説の宝物庫',hint:'最初はピン2、次にピン4を抜いてみよう。宝物の道を開くのは溶岩を冷やしてから！',rooms:[{id:'water1',x:335,y:165,water:1},{id:'water2',x:335,y:290,water:3},{id:'lava1',x:200,y:412,lava:1},{id:'gold1',x:200,y:165,gold:5},{id:'lava2',x:65,y:290,lava:2},{id:'gold2',x:335,y:45,gold:5},{id:'water3',x:200,y:290,water:2},{id:'lava3',x:335,y:412,lava:2},{id:'hero1',x:65,y:412,hero:true}],pins:[['water2','lava3'],['water2','water3'],['lava1','lava3'],['gold1','water2'],['water1','water2'],['lava1','hero1'],['gold2','gold1'],['water1','gold1'],['lava2','lava1'],['water3','lava2']]}
];
function pinPullInitial(stage){
  return {rooms:stage.rooms.map(r=>({gold:r.gold||0,water:r.water||0,lava:r.lava||0,stone:0})),removed:stage.pins.map(()=>false),failed:'',won:false,transfers:[]};
}
function pinPullMove(stage,state,pin){
  if(state.failed||state.won||!Number.isInteger(pin)||pin<0||pin>=stage.pins.length||state.removed[pin])return null;
  const next={rooms:state.rooms.map(r=>({...r})),removed:state.removed.slice(),failed:'',won:false,transfers:[]};
  next.removed[pin]=true;
  // The chambers form a directed acyclic graph. Repeated passes let contents
  // continue through previously opened pins, including newly arriving water.
  for(let pass=0;pass<stage.rooms.length;pass++){
    let changed=false;
    for(let p=0;p<stage.pins.length;p++){
      if(!next.removed[p])continue;
      const [from,to]=stage.pins[p],a=stage.rooms.findIndex(r=>r.id===from),b=stage.rooms.findIndex(r=>r.id===to),src=next.rooms[a],dst=next.rooms[b];
      if(!src.gold&&!src.water&&!src.lava)continue;
      next.transfers.push({pin:p,gold:src.gold,water:src.water,lava:src.lava});
      for(const kind of ['gold','water','lava']){dst[kind]+=src[kind];src[kind]=0;}
      const cooled=Math.min(dst.water,dst.lava);dst.water-=cooled;dst.lava-=cooled;dst.stone+=cooled;
      changed=true;
      if(dst.lava&&stage.rooms[b].hero){next.failed='溶岩が探検家に届いてしまいました。水で冷やしてから道を開こう。';return next;}
      if(dst.lava&&dst.gold){next.failed='宝物が溶岩に触れてしまいました。先に水を流して冷やそう。';return next;}
    }
    if(!changed)break;
  }
  const hero=stage.rooms.findIndex(r=>r.hero),treasure=stage.rooms.reduce((n,r)=>n+(r.gold||0),0);
  next.won=next.rooms[hero].gold===treasure;
  return next;
}
games.pinpull=function(el){
  let index=0,state=pinPullInitial(PIN_PULL_STAGES[0]),history=[],failures=0,hints=0,locked=false,ended=false,hinted=false,lastPin=-1;
  const q=id=>el.querySelector('#'+id);
  el.innerHTML=`<div class="game-header"><h2>🗝️ ピン抜きパズル</h2><p>水1で溶岩1を冷やせます。ピンを抜いて宝物を探検家へ！</p><p class="kbd-hint">矢印キーでピンを選んで <kbd>Enter</kbd> で抜く</p></div>
  <p id="pin-progress" class="pin-progress"></p><div class="pin-board" id="pin-board" data-nav-group="pins"></div>
  <p id="pin-status" class="pin-status" role="status" aria-live="polite"></p><div class="pin-controls"><button class="btn btn-sm" id="pin-undo">↶ 一手戻す</button><button class="btn btn-sm" id="pin-reset">やり直す</button><button class="btn btn-sm btn-purple" id="pin-hint">💡 ヒント</button><button class="btn btn-success" id="pin-next" hidden>次のステージへ →</button></div>`;
  function render(message='番号のピンをタップして抜いてください。'){
    const stage=PIN_PULL_STAGES[index];q('pin-progress').textContent=`ステージ ${index+1}/${PIN_PULL_STAGES.length} ・ ${stage.name}`;
    const roomById=id=>stage.rooms.find(r=>r.id===id);
    // Pipes first, then pins on top of them, then the chambers.
    const pipes=stage.pins.map(([from,to],i)=>{
      const a=roomById(from),b=roomById(to),open=state.removed[i];
      return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#0f0b16" stroke-width="22" stroke-linecap="round"/><line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${open?'#4f9c8c':'#463b58'}" stroke-width="12" stroke-linecap="round"/>${open?`<line class="pin-flowline" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#a6f0de" stroke-width="2" stroke-dasharray="4 9" stroke-linecap="round"/>`:''}`;
    }).join('');
    const pinShape=(x,y,angle,i)=>`<g transform="translate(${x} ${y})"><g transform="rotate(${angle})"><rect x="-29" y="-5" width="58" height="10" rx="5" fill="url(#pin-gold)" stroke="#9a6a12" stroke-width="1.5"/></g><circle class="pin-knob" r="15" fill="url(#pin-gold)" stroke="#9a6a12" stroke-width="2"/><circle r="11" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1.5"/><text y="6" text-anchor="middle" fill="#3a2608" font-size="17" font-weight="900">${i+1}</text></g>`;
    const pins=stage.pins.map(([from,to],i)=>{
      const a=roomById(from),b=roomById(to),x=(a.x+b.x)/2,y=(a.y+b.y)/2,angle=Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI+90;
      const path=`M ${a.x} ${a.y} L ${b.x} ${b.y}`;
      const flow=state.transfers.filter(t=>t.pin===i).map((t,n)=>`<circle class="pin-particle" r="7" fill="${t.lava?'#ff7a3d':t.water?'#6fd6ff':'#ffd84d'}" stroke="rgba(255,255,255,.6)" stroke-width="1.5"><animateMotion dur=".45s" begin="${n*.04}s" path="${path}" fill="freeze"/><animate attributeName="opacity" values="1;1;0" dur=".5s" begin="${n*.04}s" fill="freeze"/></circle>`).join('');
      if(state.removed[i]){
        // Pin that was just pulled slides out and fades away.
        const ghost=i===lastPin?`<g style="pointer-events:none"><animateTransform attributeName="transform" type="translate" from="0 0" to="0 -48" dur=".45s" fill="freeze"/><animate attributeName="opacity" from="1" to="0" dur=".45s" fill="freeze"/>${pinShape(x,y,angle,i)}</g>`:'';
        return ghost+flow;
      }
      const disabled=locked||!!state.failed||state.won;
      return `<g class="pin-action" data-pin="${i}" data-nav role="button" tabindex="${disabled?-1:0}" aria-disabled="${disabled}" aria-label="ピン${i+1}を抜く"><rect class="pin-hit" x="${x-35}" y="${y-35}" width="70" height="70" rx="14" fill="transparent"/>${pinShape(x,y,angle,i)}</g>${flow}`;
    }).join('');
    const rooms=stage.rooms.map((r,i)=>{
      const c=state.rooms[i],label=r.hero?'探検家':c.lava?'溶岩の部屋':c.water?'水の部屋':c.gold?'宝物の部屋':c.stone?'冷えた部屋':'空の部屋';
      const contents=[c.water?`💧 水 ${c.water}`:'',c.lava?`🔥 溶岩 ${c.lava}`:'',c.gold?`💎 宝物 ${c.gold}`:'',c.stone?`🪨 石 ${c.stone}`:''].filter(Boolean);
      const x0=r.x-49,y0=r.y-33,bottom=r.y+30,danger=c.lava&&(c.gold||r.hero),won=r.hero&&state.won;
      const stroke=danger?'#ff5d5d':won?'#ffd84d':r.hero?'#6fd8a8':c.lava?'#ff9a5c':c.water?'#6fd6ff':'#6b5d80';
      let inner='';
      if(c.stone)inner+=`<path d="M ${x0} ${bottom} L ${x0} ${bottom-9} Q ${x0+14} ${bottom-17} ${x0+28} ${bottom-10} Q ${x0+44} ${bottom-19} ${x0+60} ${bottom-11} Q ${x0+78} ${bottom-18} ${x0+98} ${bottom-9} L ${x0+98} ${bottom} Z" fill="#6f6679"/><circle cx="${r.x-24}" cy="${bottom-6}" r="3" fill="#8b8296"/><circle cx="${r.x+18}" cy="${bottom-8}" r="2.5" fill="#8b8296"/>`;
      const liquid=c.water||c.lava;
      if(liquid){
        const h=Math.min(50,14+liquid*11),top=bottom-(c.stone?8:0)-h,kind=c.lava?'lava':'water';
        inner+=`<path d="M ${x0} ${top+4} Q ${x0+25} ${top-3} ${x0+49} ${top+4} T ${x0+98} ${top+4} L ${x0+98} ${bottom+4} L ${x0} ${bottom+4} Z" fill="url(#pin-${kind})"${c.lava?' filter="url(#pin-glow)"':''}/>`;
        if(c.lava)inner+=`<circle cx="${r.x-20}" cy="${bottom-8}" r="3" fill="#ffd27a"><animate attributeName="cy" values="${bottom-6};${top+6};${bottom-6}" dur="2.2s" repeatCount="indefinite"/></circle><circle cx="${r.x+22}" cy="${bottom-10}" r="2.2" fill="#ffd27a"><animate attributeName="cy" values="${bottom-4};${top+8};${bottom-4}" dur="1.7s" repeatCount="indefinite"/></circle>`;
        else inner+=`<path d="M ${x0+10} ${top+9} q 8 -4 16 0" stroke="rgba(255,255,255,.55)" stroke-width="2" fill="none" stroke-linecap="round"/>`;
      }
      const badges=[c.water?`💧${c.water}`:'',c.lava?`🔥${c.lava}`:'',c.stone?`🪨${c.stone}`:''].filter(Boolean).join(' ');
      let face='';
      if(r.hero)face=`<text x="${r.x}" y="${r.y+(c.gold?-2:4)}" text-anchor="middle" font-size="27">🧑‍🚀</text>${c.gold?`<text x="${r.x}" y="${r.y+24}" text-anchor="middle" font-size="13" font-weight="900" fill="#ffe28a">${won?'やった！ ':''}💎${c.gold}</text>`:`<text x="${r.x}" y="${r.y+25}" text-anchor="middle" font-size="11" font-weight="700" fill="#bfe8d6">待ってるよ！</text>`}`;
      else if(c.gold)face=`<text x="${r.x-8}" y="${r.y+6}" text-anchor="middle" font-size="26">💎</text><text x="${r.x+20}" y="${r.y+8}" text-anchor="middle" font-size="15" font-weight="900" fill="#ffe28a" stroke="#241b30" stroke-width="3" paint-order="stroke">×${c.gold}</text>`;
      else if(!liquid&&!c.stone)face=`<text x="${r.x}" y="${r.y+5}" text-anchor="middle" font-size="13" fill="#8f84a3">空</text>`;
      const badge=badges?`<text x="${x0+8}" y="${y0+17}" font-size="12" font-weight="900" fill="#fff" stroke="#140f1d" stroke-width="3" paint-order="stroke">${badges}</text>`:'';
      return `<g style="pointer-events:none" aria-label="${label}、${contents.join('、')||'空'}"><clipPath id="pin-room-${i}"><rect x="${x0+2}" y="${y0+2}" width="94" height="62" rx="13"/></clipPath><rect x="${x0}" y="${y0}" width="98" height="66" rx="15" fill="${r.hero?'#1d3a33':'#211a2c'}"/><g clip-path="url(#pin-room-${i})">${inner}</g><rect x="${x0}" y="${y0}" width="98" height="66" rx="15" fill="none" stroke="${stroke}" stroke-width="3"${danger?' class="pin-danger"':''}/>${face}${badge}</g>`;
    }).join('');
    const defs=`<defs><radialGradient id="pin-cave" cx="50%" cy="35%" r="75%"><stop offset="0" stop-color="#3a2f4d"/><stop offset="1" stop-color="#17121f"/></radialGradient><linearGradient id="pin-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fe6ff"/><stop offset="1" stop-color="#2a7fd4"/></linearGradient><linearGradient id="pin-lava" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffcf5a"/><stop offset=".45" stop-color="#ff7032"/><stop offset="1" stop-color="#c22d1c"/></linearGradient><linearGradient id="pin-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3ad"/><stop offset="1" stop-color="#f2ae22"/></linearGradient><filter id="pin-glow" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
    const rocks=[[34,120,9],[372,96,7],[30,330,8],[368,300,10],[120,452,6],[290,450,8],[372,452,5],[60,450,7]].map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="#ffffff" opacity=".045"/>`).join('');
    q('pin-board').innerHTML=`<svg viewBox="0 0 400 470" role="group" aria-label="ピン抜きパズルの盤面">${defs}<rect x="3" y="3" width="394" height="464" rx="26" fill="url(#pin-cave)" stroke="#4d4062" stroke-width="3"/>${rocks}${pipes}${rooms}${pins}</svg>`;
    q('pin-status').textContent=state.failed||message;
    q('pin-status').setAttribute('data-tone',state.failed?'bad':state.won?'good':'');
    q('pin-undo').disabled=!history.length||locked||ended||state.won;q('pin-reset').disabled=locked||ended||state.won;q('pin-hint').disabled=locked||ended||!!state.failed||state.won;
    q('pin-next').hidden=!state.won||locked||ended;q('pin-next').textContent=index===PIN_PULL_STAGES.length-1?'結果を見る →':'次のステージへ →';
  }
  function pull(i){
    if(locked||ended)return;const next=pinPullMove(PIN_PULL_STAGES[index],state,i);if(!next)return;
    history.push(state);state=next;lastPin=i;if(state.failed)failures++;if(state.won&&index<PIN_PULL_STAGES.length-1)savePuzzleProgress('pinpull',{stage:index+1,failures,hints});locked=true;render(state.won?'宝物をすべて届けました！':'水と宝物が流れます…');
    gameDelay(()=>{if(ended)return;locked=false;lastPin=-1;render(state.won?'宝物をすべて届けました！':undefined);},550);
  }
  q('pin-board').onclick=e=>{const pin=e.target.closest('[data-pin]');if(pin)pull(Number(pin.dataset.pin));};
  q('pin-board').onkeydown=e=>{if(e.key!=='Enter'&&e.key!==' ')return;const pin=e.target.closest('[data-pin]');if(pin){e.preventDefault();pull(Number(pin.dataset.pin));}};
  q('pin-undo').onclick=()=>{if(!history.length||locked||ended||state.won)return;state=history.pop();state={...state,transfers:[]};render('一手戻しました。');};
  q('pin-reset').onclick=()=>{if(locked||ended||state.won)return;state=pinPullInitial(PIN_PULL_STAGES[index]);history=[];render('このステージをやり直します。');};
  q('pin-hint').onclick=()=>{if(locked||ended||state.failed||state.won)return;if(!hinted){hints++;hinted=true;}render(PIN_PULL_STAGES[index].hint);};
  q('pin-next').onclick=()=>{if(locked||ended||!state.won)return;if(index===PIN_PULL_STAGES.length-1){ended=true;savePuzzleProgress('pinpull',null);q('pin-next').disabled=true;recordWin('pinpull',Math.max(80,250-failures*15-hints*10));return;}index++;state=pinPullInitial(PIN_PULL_STAGES[index]);history=[];hinted=false;render();};
  // Stopping keeps saved progress, so the next visit resumes from this stage.
  el._quit=()=>{if(ended||locked)return;if(state.won&&index===PIN_PULL_STAGES.length-1){q('pin-next').onclick();return;}ended=true;render('ここで終了しました。続きは次回このステージから遊べます。');recordQuit('pinpull',(index+(state.won?1:0))*15);};
  el._cleanup=()=>{ended=true;};render();
  const saved=puzzleProgress('pinpull',PIN_PULL_STAGES.length);
  if(saved)showPuzzleResume(el,'pinpull',saved,PIN_PULL_STAGES.length,s=>{index=s.stage;failures=s.failures||0;hints=s.hints||0;hinted=false;state=pinPullInitial(PIN_PULL_STAGES[index]);history=[];render('続きから再開しました。');});
};
