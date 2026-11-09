// ===== バランス検証用の自動プレイ =====
// sim.html から money.html のスクリプトと同じスコープで実行される。
// （S, B, buy, startBattle などゲーム本体の変数・関数をそのまま使う）

// ---- 描画・演出を止める ----
render=renderTop=banner=tip=float=line=shake=sfx=updateBattle=save=log=()=>{};
const avg=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:NaN;

const runQueue=()=>{ // 自前タイマーを空になるまで回す
  for(let g=0;g<1e6;g++){
    if(__T.iv.size){for(const f of [...__T.iv.values()])f();continue}
    if(__T.q.length){__T.q.shift()();continue}
    return;
  }
  throw new Error('タイマーが止まらない');
};

// ---- 記録 ----
let REC=null; // 1ゲーム分の記録
const UNIT_DMG={}; // key -> {dealt, n}
const _endBattle=endBattle;
endBattle=function(res){
  for(const f of B.p)if(f){const k=f.u.key+'★'+f.u.star,o=UNIT_DMG[k]||(UNIT_DMG[k]={dealt:0,n:0});o.dealt+=f.dealt;o.n++}
  if(REC)REC.res[S.round]=res;
  return _endBattle(res);
};
gameOver=function(win){S.phase='over';if(REC)REC.cleared=win};
const _rollShop=rollShop; // ショップに5コストが並んだ回数を数える
rollShop=function(){_rollShop();if(REC)REC.seen5+=S.shop.filter(k=>k&&UNITS[k].cost===5).length};

// ---- ボットの戦略 ----
const STD_LV=[0,1,2,3,3,4,4,5,5,6,6,6,7,7,7,8,8,8,9,9,9]; // ラウンドごとの目標レベル
const STRATS={
  standard:{label:'標準（利子50を維持しつつ育成）',
    reserve:r=>S.hp<35?0:r<5?10:50, rollFloor:r=>S.hp<35?0:50, tl:r=>STD_LV[r], costW:1.2, copyW:4},
  econ:{label:'貯金・豪商（利子上限まで貯める）',pref:['rich'],
    reserve:r=>S.hp<30?0:r<3?0:S.interestCap*10, rollFloor:r=>S.hp<30?0:S.interestCap*10, tl:r=>STD_LV[r], costW:1, copyW:4},
  reroll:{label:'リロール（Lv5で低コスト★3狙い）',
    reserve:r=>S.hp<35?0:r<4?0:30, rollFloor:r=>S.hp<35?0:r<5?99:30, tl:r=>r<12?Math.min(5,STD_LV[r]):STD_LV[r], costW:.3, copyW:7,
    maxCost:r=>r<12?2:5},
  fastlv:{label:'レベル優先（高コスト狙い）',
    reserve:r=>S.hp<35?0:r<4?0:20, rollFloor:r=>S.hp<35?0:S.level>=8?20:50, tl:r=>Math.min(9,STD_LV[r]+1), costW:2.2, copyW:3},
  random:{label:'ランダム（下限の目安）',random:true},
};
let ST=STRATS.standard, RAND_EVENT=false;

const power=u=>UNITS[u.key].cost*STAR_MULT[u.star];
function score(key){
  const d=UNITS[key],own=owned();
  const c1=own.filter(u=>u.key===key&&u.star===1).length,c2=own.filter(u=>u.key===key&&u.star===2).length;
  let s=d.cost*ST.costW+c1*ST.copyW+c2*2;
  const tc=traitCounts(own,true);
  for(const t of d.traits)s+=Math.min(3,tc[t]||0)*1.2+(ST.pref&&ST.pref.includes(t)?4:0);
  if(ST.maxCost&&d.cost>ST.maxCost(S.round)&&!c1)s-=8;
  if(S.level>=7&&d.cost<=1&&!c1)s-=3;
  return s;
}
function keepScore(u){
  if(u.star>1)return 99;
  const same=owned().filter(x=>x!==u&&x.key===u.key&&x.star===1).length;
  return UNITS[u.key].cost*ST.costW+same*ST.copyW;
}
function canMerge(key){return owned().filter(u=>u.key===key&&u.star===1).length>=2}
function shopPass(res){
  for(let i=0;i<5;i++){
    const key=S.shop[i];if(!key)continue;
    const cost=UNITS[key].cost,need=owned().length<cap();
    if(S.gold<cost||(!need&&S.gold-cost<res))continue;
    const sc=score(key);
    if(!need&&sc<5)continue;
    if(S.bench.indexOf(null)<0&&!canMerge(key)){ // ベンチ満杯なら一番要らないユニットを売って空ける
      const w=S.bench.map((u,j)=>[u,j]).filter(([u])=>u).sort((a,b)=>keepScore(a[0])-keepScore(b[0]))[0];
      if(!w||keepScore(w[0])>=sc-2)continue;
      sellAt('bench',w[1]);
    }
    buy(i);
  }
}
function arrange(){ // 強い順に配置上限まで盤面へ。近接は前列、遠距離は後列
  const pref=u=>ST.pref?UNITS[u.key].traits.filter(t=>ST.pref.includes(t)).length*.5:0;
  const all=owned().sort((a,b)=>power(b)+pref(b)-power(a)-pref(a));
  const on=all.slice(0,cap()),off=all.slice(cap());
  S.board=Array(8).fill(null);
  const put=(u,order)=>{const s=order.find(x=>!S.board[x]);S.board[s]=u};
  for(const u of on)put(u,UNITS[u.key].range===1?[1,2,0,3,5,6,4,7]:[5,6,4,7,1,2,0,3]);
  S.bench=[...off,...Array(8).fill(null)].slice(0,8);
  S.sel=null;S.selItem=null;
}
function equipItems(){
  while(S.items.length){
    const u=S.board.filter(u=>u&&u.items.length<3).sort((a,b)=>power(b)-power(a))[0];
    if(!u)break;u.items.push(S.items.shift());
  }
}
function planRandom(){
  if(Math.random()<.3&&S.gold>=4&&S.level<MAX_LV){S.gold-=4;addExp(4)}
  for(let i=0;i<5;i++){
    const k=S.shop[i];if(!k||Math.random()<.4||S.gold<UNITS[k].cost)continue;
    if(S.bench.indexOf(null)<0){const j=S.bench.findIndex(Boolean);sellAt('bench',j)}
    buy(i);
  }
}
function plan(){
  if(ST.random)planRandom();
  else{
    const r=S.round,res=ST.reserve(r);
    while(S.level<MAX_LV&&S.level<ST.tl(r)&&S.gold-4>=Math.max(0,res-10)){S.gold-=4;addExp(4)}
    shopPass(res);
    for(let n=0;n<20&&S.gold-2>=ST.rollFloor(r);n++){S.gold-=2;rollShop();if(REC)REC.rolls++;shopPass(res)}
  }
  arrange();equipItems();
}

// ---- イベント選択 ----
function eventScore(x){
  const t=x.t,tc=traitCounts(S.board,true);
  const tr=Object.keys(TRAITS).find(k=>TRAITS[k].name+'の紋章'===t);
  if(tr){const n=tc[tr]||0;return TRAITS[tr].th.some(th=>th===n+1)?8:n?4:1}
  return ({'臨時収入':6,'高利貸し':S.gold<40?5:2,'投資家の心得':ST.pref?9:3,'スカウト':7,'鍛錬':6+S.round/5,'鉄壁の訓練':5+S.round/5,
    '宝箱':6,'休息':S.hp<50?10:S.hp<80?4:0,'特訓':S.level<6?6:3,'ギャンブル':S.gold<10?3:1})[t]??0;
}
showEvent=function(){
  const opts=shuffle(eventPool()).slice(0,3);
  const x=ST.random||RAND_EVENT?rand(opts):opts.reduce((a,b)=>eventScore(b)>eventScore(a)?b:a);
  x.f();if(REC)REC.events.push(x.t.endsWith('の紋章')?'紋章':x.t);
  S.bench=S.bench.slice(0,8);S.phase='plan';
};

// ---- 1ゲーム ----
function playGame(){
  newGame();__T.q.length=0;__T.iv.clear();
  REC={res:[],hp:[],gold:[],lv:[],me:[],en:[],rolls:0,seen5:0,events:[],cleared:false};
  while(S.phase!=='over'){
    if(S.phase==='event')showEvent();
    plan();
    const r=S.round;REC.hp[r]=S.hp;REC.gold[r]=S.gold;REC.lv[r]=S.level;
    REC.me[r]=boardStats(S.board);REC.en[r]=boardStats(S.enemy);
    startBattle();
    if(S.phase!=='battle')throw new Error('戦闘を開始できない（ラウンド'+r+'）');
    runQueue();
  }
  const tc=traitCounts(S.board,true);
  REC.final=S.round;REC.endHp=S.hp;
  REC.traits=Object.keys(TRAITS).filter(t=>traitLevel(t,tc[t]||0)>0).map(t=>t+traitLevel(t,tc[t]||0));
  REC.units=S.board.filter(Boolean).map(u=>u.key+'★'+u.star);
  return REC;
}

function boardStats(board){
  const us=board.filter(Boolean);
  return {n:us.length,c4:us.filter(u=>UNITS[u.key].cost===4).length,c5:us.filter(u=>UNITS[u.key].cost===5).length,star:avg(us.map(u=>u.star)),s3:us.filter(u=>u.star===3).length,cost:avg(us.map(u=>UNITS[u.key].cost)),
    items:us.reduce((s,u)=>s+u.items.length,0),pow:us.reduce((s,u)=>s+power(u),0)};
}

// ---- チーム戦（同コスト帯からランダムに4体ずつ、★2・アイテムなし） ----
function teamBoard(keys){
  const b=Array(8).fill(null);
  for(const k of keys){const o=UNITS[k].range===1?[1,2,0,3,5,6,4,7]:[5,6,4,7,1,2,0,3];b[o.find(x=>!b[x])]=mk(k,2)}
  return b;
}
function duel(pk,ek){
  newGame();S.round=15;S.gold=20+S.round*2; // 豪商・財力の所持金条件を敵味方で揃える
  const pb=teamBoard(pk),eb=teamBoard(ek);
  B={p:buildFighters(pb,'p'),e:buildFighters(eb,'e'),actions:0};S.phase='battle';
  for(;;){
    step();__T.iv.clear();
    const pa=alive(B.p).length,ea=alive(B.e).length;
    if(!pa||!ea||B.actions>MAX_ACTIONS){__T.q.length=0;return !ea&&pa?1:!pa&&ea?0:.5}
  }
}

// ---- 調整案を試すとき ----
// money.html を書き換える前に、ここで makeEnemy や TRAITS などを差し替えて結果を比べられる。
// 例: TRAITS.guard.th=[2,3];

// ---- 実行 ----
const N=+(__out.params.get('n')||300);
const status=t=>__out.status.textContent=t;
const RESULT={N,strats:{},unitDmg:UNIT_DMG};
const runs=[...Object.keys(STRATS).map(k=>({k,rand:false})),{k:'standard',rand:true,tag:'standard_randEvent'}];
for(const run of runs){
  ST=STRATS[run.k];RAND_EVENT=run.rand;const games=[];
  for(let i=0;i<N;i++){games.push(playGame());if(i%25===0){status(`${run.tag||run.k}: ${i}/${N}`);await __wait()}}
  RESULT.strats[run.tag||run.k]=games;
}
REC=null;
status('チーム戦を計算中…');await __wait();
const TEAM={}; // key -> {w, n}  そのユニットを含むチームの勝率
for(let c=1;c<=5;c++){
  const ks=Object.keys(UNITS).filter(k=>UNITS[k].cost===c);
  for(let i=0;i<3000;i++){
    const pk=Array.from({length:4},()=>rand(ks)),ek=Array.from({length:4},()=>rand(ks));
    const w=duel(pk,ek);
    for(const [team,res] of [[pk,w],[ek,1-w]])for(const k of new Set(team)){const o=TEAM[k]||(TEAM[k]={w:0,n:0});o.w+=res;o.n++}
    if(i%500===0)await __wait();
  }
}
RESULT.team=TEAM;
window.SIM_RESULT=RESULT; // 開発者ツールから参照できるように
// 外の window に結果を渡す（document はスタブなので __out 経由で書く）
__out.doc.defaultView.SIM_RESULT=RESULT;

// ---- 集計表示 ----
const f1=x=>isNaN(x)?'-':x.toFixed(1),pct=x=>isNaN(x)?'-':Math.round(x*100)+'%';
const table=(head,rows)=>`<table><tr>${head.map(h=>`<th>${h}</th>`).join('')}</tr>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</table>`;
let h='';
h+='<h2>戦略別の成績</h2>'+table(['戦略','クリア率','平均到達R','HP0で脱落','R20で敗北','クリア時の残りHP'],Object.entries(RESULT.strats).map(([k,g])=>[
  (STRATS[k]?.label||'標準（イベントはランダム）'),pct(avg(g.map(x=>x.cleared?1:0))),f1(avg(g.map(x=>x.final))),
  pct(avg(g.map(x=>!x.cleared&&x.endHp<=0?1:0))),pct(avg(g.map(x=>!x.cleared&&x.endHp>0?1:0))),f1(avg(g.filter(x=>x.cleared).map(x=>x.endHp)))]));
const rounds=Array.from({length:20},(_,i)=>i+1);
h+='<h2>ラウンド別の勝率（そのラウンドまで生き残ったゲームのみ）</h2>'+table(['R',...Object.keys(RESULT.strats)],rounds.map(r=>[
  r+(STRONG_ROUNDS.includes(r)?' 強敵':'')+(EVENT_ROUNDS.includes(r)?' ev':''),
  ...Object.values(RESULT.strats).map(g=>{const p=g.filter(x=>x.res[r]);return pct(avg(p.map(x=>x.res[r]==='win'?1:0)))+` <small>(${p.length})</small>`})]));
h+='<h2>標準戦略のラウンド開始時の平均値</h2>'+table(['R','HP','所持金','レベル'],rounds.map(r=>{const g=RESULT.strats.standard.filter(x=>x.hp[r]!=null);
  return [r,f1(avg(g.map(x=>x.hp[r]))),f1(avg(g.map(x=>x.gold[r]))),f1(avg(g.map(x=>x.lv[r])))]}));
// 最終盤面のシナジーと成績
const allG=Object.entries(RESULT.strats).filter(([k])=>k!=='random').flatMap(([,g])=>g);
const tr={};allG.forEach(g=>g.traits.forEach(t=>(tr[t]=tr[t]||[]).push(g)));
h+='<h2>最終盤面で発動していたシナジーと成績（ランダム以外）</h2>'+table(['シナジー','ゲーム数','クリア率','平均到達R'],
  Object.entries(tr).sort((a,b)=>a[0]<b[0]?-1:1).map(([t,g])=>[TRAITS[t.slice(0,-1)].name+' Lv'+t.slice(-1),g.length,pct(avg(g.map(x=>x.cleared?1:0))),f1(avg(g.map(x=>x.final)))]));
// イベント
const ev={},rg=RESULT.strats.standard_randEvent;rg.forEach(g=>new Set(g.events).forEach(e=>(ev[e]=ev[e]||[]).push(g)));
h+=`<h2>イベントを選んだゲームの成績（標準戦略・イベントはランダムに選択、全体の平均到達R ${f1(avg(rg.map(x=>x.final)))}）</h2>`+table(['イベント','選ばれた数','クリア率','平均到達R'],
  Object.entries(ev).sort((a,b)=>avg(b[1].map(x=>x.final))-avg(a[1].map(x=>x.final))).map(([e,g])=>[e,g.length,pct(avg(g.map(x=>x.cleared?1:0))),f1(avg(g.map(x=>x.final)))]));
// ユニット
h+='<h2>ユニットの強さ（同コスト帯の4対4ランダムチーム戦で、そのユニットを含むチームの勝率）</h2>'+table(['ユニット','コスト','スキル','チーム勝率','戦闘1回あたり与ダメ(★2, ボット戦)'],
  Object.keys(UNITS).map(k=>{const t=TEAM[k],d=UNIT_DMG[k+'★2'];
    return [UNITS[k].name,UNITS[k].cost,UNITS[k].skill,pct(t.w/t.n)+` <small>(${t.n})</small>`,d?Math.round(d.dealt/d.n)+` <small>(${d.n})</small>`:'-']}));
// 高コストの登場（標準戦略）
h+=`<h2>高コストユニットの登場（標準戦略、1ゲームでショップに並んだ5コスト ${f1(avg(RESULT.strats.standard.map(x=>x.seen5)))} 回）</h2>`+table(['R','平均レベル','Lv8以上','4コスト(盤面平均)','5コストが盤面にいる割合'],
  rounds.slice(9).map(r=>{const g=RESULT.strats.standard.filter(x=>x.me[r]);
    return [r,f1(avg(g.map(x=>x.lv[r]))),pct(avg(g.map(x=>x.lv[r]>=8?1:0))),f1(avg(g.map(x=>x.me[r].c4))),pct(avg(g.map(x=>x.me[r].c5?1:0)))]}));
// 敵と自軍の戦力の推移（標準戦略）
const sg=RESULT.strats.standard;
h+='<h2>ラウンド開始時の自軍と敵の比較（標準戦略、平均）</h2>'+table(['R','自軍 体数','自軍 平均★','自軍 ★3','自軍 戦力','敵 体数','敵 平均★','敵 ★3','敵 平均コスト','敵 アイテム','敵 戦力'],
  rounds.map(r=>{const g=sg.filter(x=>x.me[r]),m=k=>f1(avg(g.map(x=>x.me[r][k]))),e=k=>f1(avg(g.map(x=>x.en[r][k])));
    return [r,m('n'),m('star'),m('s3'),m('pow'),e('n'),e('star'),e('s3'),e('cost'),e('items'),e('pow')]}));
__out.out.innerHTML=h;
status(`完了（各戦略 ${N} ゲーム）`);
