
// A gate applies its steps top to bottom; division and ×1.5 round down.
function gateRunnerStep(count,op,value){
  if(op==='+')return count+value;
  if(op==='-')return Math.max(0,count-value);
  if(op==='×')return Math.floor(count*value);
  if(op==='÷')return Math.floor(count/value);
  return count;
}
function gateRunnerApply(count,event){
  if(event.kind==='enemy'||event.kind==='boss')return Math.max(0,count-event.value);
  const steps=event.steps||[[event.op,event.value]];
  return steps.reduce((n,[op,value])=>gateRunnerStep(n,op,value),count);
}
const GATE_RUNNER_SPEED=95,GATE_RUNNER_GAP=320;
// Builds each section from the count the best route would have there, so the two choices
// land close together and the better one depends on actually doing the arithmetic.
function gateRunnerCourse(random=Math.random){
  const int=(a,b)=>a+Math.floor(random()*(b-a+1)),sign=()=>random()<.5?-1:1;
  const nice=n=>n>=25?Math.round(n/5)*5:Math.round(n);
  const near=(n,lo,hi)=>nice(n*(1+sign()*int(lo,hi)/100));
  const g=(...steps)=>({kind:'gate',steps}),e=value=>({kind:'enemy',value});
  const grow=[
    c=>{const k=c<60?int(2,3):2,a=near(c*(k-1),10,30);return [g(['×',k]),g(['+',Math.max(5,a)])];},
    c=>c<20?null:[g(['×',1.5]),g(['+',Math.max(5,near(c*.5,12,35))])],
    c=>{const a=int(3,c<50?15:30),b=Math.max(3,2*a+sign()*Math.max(4,Math.round(c*.12)));return [g(['+',a],['×',2]),g(['×',2],['+',b])];},
    c=>{if(c<16||c>150)return null;const a=int(2,Math.floor(c/5)),b=c-3*a+sign()*Math.max(4,Math.round(c*.15));return b<3?null:[g(['-',a],['×',3]),g(['×',2],['+',b])];},
    c=>c<12?null:[g(['÷',2],['×',3]),g(['+',Math.max(4,near(c*.5,12,35))])],
  ];
  const shrink=[
    c=>c<12?null:[e(Math.max(3,near(c*.5,15,35))),g(['÷',2])],
    c=>{if(c<15)return null;const a=Math.round(c*int(62,75)/100),loss=c-(c-a)*2;const v=loss+sign()*Math.max(3,Math.round(c*.1));return v<2?null:[e(v),g(['-',a],['×',2])];},
    c=>{if(c<18)return null;const a=int(2,8),v=c-(Math.floor(c/3)+a)+sign()*Math.max(3,Math.round(c*.1));return v<2?null:[g(['÷',3],['+',a]),e(v)];},
  ];
  const plan=['grow','grow','shrink','grow','grow','shrink','grow','shrink','grow','shrink'];
  const rows=[];let best=10,worst=10;
  plan.forEach((kind,i)=>{
    // Past a few hundred, only the gentler templates keep the numbers within mental-math range.
    const pool=kind==='grow'?(best>250?[grow[1],grow[2],grow[4]]:grow):shrink;let choices=null;
    for(let t=0;t<40&&!choices;t++){
      const pick=pool[int(0,pool.length-1)](best);if(!pick)continue;
      const [ra,rb]=pick.map(ev=>gateRunnerApply(best,ev)),diff=Math.abs(ra-rb);
      if(diff>=Math.max(3,Math.round(best*.06))&&diff<=Math.max(10,Math.round(best*.45))&&Math.max(ra,rb)>=4)choices=pick;
    }
    // Always-valid fallback: doubling vs. adding a little more than the current count.
    if(!choices)choices=kind==='grow'?[g(['×',2]),g(['+',best+Math.max(3,Math.round(best*.1))])]:[e(Math.max(2,Math.round(best*.4))),g(['÷',2])];
    best=Math.max(...choices.map(ev=>gateRunnerApply(best,ev)));worst=Math.min(...choices.map(ev=>gateRunnerApply(worst,ev)));
    rows.push({z:300+i*GATE_RUNNER_GAP,choices:random()<.5?choices:choices.slice().reverse()});
  });
  // The boss is 70% of the best route, and never small enough for the worst route to pass.
  const boss=Math.min(best-1,Math.max(Math.min(20,best-1),Math.floor(best*.7),worst));
  rows.push({z:300+plan.length*GATE_RUNNER_GAP,choices:[{kind:'boss',value:boss}]});
  return rows;
}
games.gaterunner=function(el){
  let rows=gateRunnerCourse(),count=10,lane=0,x=100,distance=0,index=0,running=false,ended=false,raf=0,last=0,pointer=null,feedback='',feedbackUntil=0;
  const q=id=>el.querySelector('#'+id),gateSteps=e=>e.steps||[[e.op,e.value]],label=e=>e.kind==='gate'?gateSteps(e).map(([op,v])=>op+v).join('→'):(e.kind==='boss'?'ボス ':'敵 ')+e.value;
  el.innerHTML=`<style>
    .gate-track{display:block;width:100%;max-width:400px;height:auto;margin:auto;border:2px solid #527586;border-radius:18px;touch-action:none}
    .gate-controls{display:grid;grid-template-columns:1fr 1fr;gap:12px;max-width:400px;margin:12px auto}.gate-controls .btn{padding:14px 8px;min-width:0}.gate-controls .btn[aria-pressed="true"]{outline:3px solid #ffd93d;outline-offset:2px}
    .gate-hud{display:flex;justify-content:space-between;gap:8px;max-width:400px;margin:12px auto;font-weight:800}
    .gate-progress{height:6px;max-width:400px;margin:0 auto 10px;background:var(--surface2);border-radius:6px;overflow:hidden}.gate-progress span{display:block;height:100%;background:#65d8fa;width:0}
    #gate-start[hidden]{display:none}
  </style><div class="game-header"><h2>👥 数字ゲートランナー</h2><p>今の人数で計算して、多く残る方を選ぼう！2段のゲートは上から順に計算し、割り算と×1.5は切り捨てです。</p></div>
  <div class="gate-hud"><span id="gate-count">👥 10人</span><span id="gate-distance">区間 1/${rows.length}</span></div><div class="gate-progress"><span id="gate-progress"></span></div>
  <canvas id="gate-canvas" class="gate-track" width="400" height="500" aria-label="数字ゲートランナーのコース。下の左右ボタンか矢印キーで操作できます。"></canvas>
  <div class="gate-controls"><button class="btn" id="gate-left" aria-pressed="true">← 左</button><button class="btn" id="gate-right" aria-pressed="false">右 →</button></div>
  <div class="flex-center"><button class="btn" id="gate-start">スタート</button></div><p id="gate-status" role="status" aria-live="polite" style="text-align:center;min-height:3em">左・右ボタン、コースのタップ・ドラッグ、←→／A・Dキーで操作。Space／Enterでスタート。</p>`;
  const canvas=q('gate-canvas'),ctx=canvas.getContext('2d');
  function hud(){
    q('gate-count').textContent=`👥 ${count}人`;q('gate-distance').textContent=`区間 ${Math.min(index+1,rows.length)}/${rows.length}`;q('gate-progress').style.width=Math.min(100,distance/rows.at(-1).z*100)+'%';
    const next=rows[index];q('gate-left').textContent=next&&next.choices.length===2?'← '+label(next.choices[0]):'← 左';q('gate-right').textContent=next&&next.choices.length===2?label(next.choices[1])+' →':'右 →';
    q('gate-left').setAttribute('aria-pressed',String(lane===0));q('gate-right').setAttribute('aria-pressed',String(lane===1));
  }
  function select(value){if(ended)return;lane=value;hud();if(!running){x=lane===0?100:300;draw();}}
  function finish(won){if(ended)return;ended=true;running=false;cancelAnimationFrame(raf);q('gate-left').disabled=q('gate-right').disabled=true;q('gate-status').textContent=won?`ボスを突破！ ${count}人が生き残りました。`:'仲間が0人になりました。';draw();if(won)recordWin('gaterunner',180+count);else recordLoss(index*10,'gaterunner');}
  // Plain fills only (no gradients/measureText): the Node test renders this with a stub canvas.
  function person(px,py,color,bob){ctx.fillStyle=color;ctx.beginPath();ctx.arc(px,py-6+bob,4.2,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.roundRect(px-4,py-1+bob,8,9,3);ctx.fill();ctx.fillRect(px-3.5,py+7+bob,2.5,4);ctx.fillRect(px+1,py+7-bob,2.5,4);}
  function draw(){
    ctx.fillStyle='#6cc070';ctx.fillRect(0,0,400,500);
    ctx.fillStyle='#5aae5f';for(let y=(distance%60)-60;y<500;y+=60){ctx.fillRect(0,y,20,30);ctx.fillRect(380,y+30,20,30);}
    ctx.fillStyle='#3a4256';ctx.fillRect(20,0,360,500);
    ctx.fillStyle='#434c63';for(let y=(distance%80)-80;y<500;y+=80)ctx.fillRect(20,y,360,40);
    for(let y=(distance%40)-40;y<500;y+=40){ctx.fillStyle='#ff5a5a';ctx.fillRect(16,y,8,20);ctx.fillRect(376,y+20,8,20);ctx.fillStyle='#ffffff';ctx.fillRect(16,y+20,8,20);ctx.fillRect(376,y,8,20);}
    ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=4;ctx.setLineDash([24,20]);ctx.beginPath();ctx.moveTo(200,(distance%44)-44);ctx.lineTo(200,500);ctx.stroke();ctx.setLineDash([]);
    for(let i=index;i<rows.length;i++){
      const row=rows[i],y=410-(row.z-distance);if(y< -90||y>500)continue;
      row.choices.forEach((event,j)=>{
        const boss=event.kind==='boss',enemy=event.kind==='enemy',cx=boss?200:j===0?100:300,w=boss?320:150;
        const bad=event.kind!=='gate'||gateSteps(event).some(([op])=>op==='-'||op==='÷');
        if(enemy||boss){
          const n=Math.min(boss?24:12,Math.ceil(event.value/(boss?5:3)));
          for(let k=0;k<n;k++){const col=k%(boss?12:6),r=Math.floor(k/(boss?12:6));person(cx-(boss?110:40)+col*(boss?20:16),y-2+r*16,'#e0414f',Math.sin(distance*.08+k)*1.5);}
          ctx.fillStyle='rgba(30,10,20,.8)';ctx.beginPath();ctx.roundRect(cx-52,y-50,104,30,15);ctx.fill();
          ctx.fillStyle='#ffb3bb';ctx.font='900 20px sans-serif';ctx.textAlign='center';ctx.fillText((boss?'👑 ':'⚔ ')+event.value,cx,y-28);
          return;
        }
        const main=bad?'rgba(255,90,110,.42)':'rgba(70,200,255,.42)',edge=bad?'#ff8a9a':'#8ff0ff';
        ctx.fillStyle=edge;ctx.fillRect(cx-w/2-5,y-44,8,80);ctx.fillRect(cx+w/2-3,y-44,8,80);
        ctx.fillStyle=main;ctx.beginPath();ctx.roundRect(cx-w/2,y-40,w,64,10);ctx.fill();
        ctx.strokeStyle=edge;ctx.lineWidth=3;ctx.stroke();
        ctx.fillStyle='rgba(255,255,255,.25)';ctx.fillRect(cx-w/2+8,y-34,w-16,5);
        ctx.fillStyle='#ffffff';ctx.textAlign='center';const steps=gateSteps(event);
        if(steps.length===1){ctx.font='900 30px sans-serif';ctx.fillText(steps[0][0]+steps[0][1],cx,y+8);}
        else{ctx.font='900 23px sans-serif';ctx.fillText(steps[0][0]+steps[0][1],cx,y-12);ctx.font='900 21px sans-serif';ctx.fillText('↓ '+steps[1][0]+steps[1][1],cx,y+16);}
      });
    }
    const people=Math.min(count,36);
    for(let n=people-1;n>=0;n--){const col=n%6,row=Math.floor(n/6),px=x+(col-2.5)*14,py=440+row*10;person(px,py,'#3d9bff',running?Math.sin(distance*.12+n)*1.6:0);}
    ctx.fillStyle='rgba(12,20,40,.88)';ctx.beginPath();ctx.roundRect(x-40,384,80,30,15);ctx.fill();ctx.strokeStyle='#7fd6ff';ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle='#ffffff';ctx.font='900 20px sans-serif';ctx.textAlign='center';ctx.fillText('👥 '+count,x,406);
    if(feedback&&distance<feedbackUntil){ctx.fillStyle='rgba(20,15,40,.8)';ctx.beginPath();ctx.roundRect(70,58,260,34,17);ctx.fill();ctx.fillStyle='#ffe28a';ctx.font='900 19px sans-serif';ctx.fillText(feedback,200,82);}
    if(!running&&!ended){ctx.fillStyle='rgba(15,20,40,.86)';ctx.beginPath();ctx.roundRect(30,150,340,112,22);ctx.fill();ctx.fillStyle='#ffffff';ctx.font='900 23px sans-serif';ctx.fillText('仲間を増やしてボスを倒そう',200,194);ctx.fillStyle='#ffb3bb';ctx.font='16px sans-serif';ctx.fillText('最後のボス：👑 '+rows.at(-1).choices[0].value+'体',200,230);}
  }
  function frame(now){
    if(!running||ended)return;const dt=last?Math.min((now-last)/1000,.05):0;last=now;distance+=dt*GATE_RUNNER_SPEED;x+=( (lane===0?100:300)-x)*Math.min(1,dt*18);
    while(index<rows.length&&distance>=rows[index].z){
      const row=rows[index],event=row.choices[row.choices.length===1?0:lane],before=count;count=gateRunnerApply(count,event);index++;
      feedback=`${label(event)} → ${count}人`;feedbackUntil=distance+160;q('gate-status').textContent=`${label(event)}を通過。${before}人から${count}人になりました。`;
      hud();if(count<=0){finish(false);return;}if(event.kind==='boss'){finish(true);return;}
    }
    q('gate-progress').style.width=Math.min(100,distance/rows.at(-1).z*100)+'%';draw();raf=requestAnimationFrame(frame);
  }
  q('gate-left').onclick=()=>select(0);q('gate-right').onclick=()=>select(1);
  q('gate-start').onclick=()=>{if(running||ended)return;running=true;last=0;q('gate-start').hidden=true;q('gate-status').textContent='今の人数で計算して、多く残る方を選ぼう！';raf=requestAnimationFrame(frame);};
  function point(e){const r=canvas.getBoundingClientRect();select((e.clientX-r.left)/r.width<.5?0:1);}
  canvas.onpointerdown=e=>{if(ended||pointer!==null||e.button!==0)return;e.preventDefault();pointer=e.pointerId;canvas.setPointerCapture(pointer);point(e);};
  canvas.onpointermove=e=>{if(pointer===e.pointerId)point(e);};canvas.onpointerup=canvas.onpointercancel=canvas.onlostpointercapture=()=>{pointer=null;};
  function key(e){if(ended||e.ctrlKey||e.metaKey||e.altKey||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(['ArrowLeft','a','A','ArrowRight','d','D'].includes(e.key)){e.preventDefault();select(['ArrowLeft','a','A'].includes(e.key)?0:1);}}
  onGameKey(k=>{if((k===' '||k==='Enter')&&!running&&!ended){q('gate-start').click();return true;}return false;});
  document.addEventListener('keydown',key);el._cleanup=()=>{ended=true;running=false;pointer=null;cancelAnimationFrame(raf);document.removeEventListener('keydown',key);};hud();draw();
};
