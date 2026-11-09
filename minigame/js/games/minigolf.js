
const MINI_GOLF_HOLES=[
  {start:[70,320],cup:[290,80],par:2,walls:[]},
  {start:[65,330],cup:[290,65],par:3,walls:[{x:125,y:150,w:110,h:22}]},
  {start:[60,340],cup:[300,65],par:4,walls:[{x:20,y:240,w:220,h:20},{x:140,y:135,w:200,h:20}]}
];
function miniGolfStep(ball,hole){
  if(ball.sunk)return;
  const radius=7;
  for(const axis of ['x','y']){
    const vel=axis==='x'?'vx':'vy';ball[axis]+=ball[vel]/120;
    const max=axis==='x'?353:393;
    if(ball[axis]<radius){ball[axis]=radius;ball[vel]=Math.abs(ball[vel])*.8;}
    if(ball[axis]>max){ball[axis]=max;ball[vel]=-Math.abs(ball[vel])*.8;}
    for(const wall of hole.walls){
      if(ball.x+radius>wall.x&&ball.x-radius<wall.x+wall.w&&ball.y+radius>wall.y&&ball.y-radius<wall.y+wall.h){
        if(axis==='x')ball.x=ball.vx>0?wall.x-radius:wall.x+wall.w+radius;
        else ball.y=ball.vy>0?wall.y-radius:wall.y+wall.h+radius;
        ball[vel]*=-.8;
      }
    }
  }
  ball.vx*=.991;ball.vy*=.991;
  if(Math.hypot(ball.x-hole.cup[0],ball.y-hole.cup[1])<12&&Math.hypot(ball.vx,ball.vy)<150){ball.x=hole.cup[0];ball.y=hole.cup[1];ball.vx=ball.vy=0;ball.sunk=true;}
  if(Math.hypot(ball.vx,ball.vy)<5)ball.vx=ball.vy=0;
}
games.minigolf=function(el){
  let index=0,strokes=0,total=0,ball,drag=null,ended=false,raf=0,last=0,accumulator=0,scored=false;
  el.innerHTML=`<div class="game-header"><h2>⛳ ミニゴルフ</h2><p>ボールを引っぱって離そう。引いた方向と逆へ飛びます。</p><p class="kbd-hint"><kbd>←</kbd><kbd>→</kbd> 角度、<kbd>↑</kbd><kbd>↓</kbd> 強さ（<kbd>Shift</kbd> で細かく）、<kbd>Space</kbd> でショット、<kbd>N</kbd> で次のホール</p></div><p id="golf-status" class="golf-status" role="status"></p>
  <canvas id="golf-course" width="360" height="400" class="golf-course" style="display:block;width:100%;max-width:360px;height:auto;margin:auto;touch-action:none" aria-label="ミニゴルフのコース。下の角度と強さの操作でもショットできます。"></canvas>
  <div class="golf-controls"><label>角度（0°は右、90°は下） <output id="golf-angle-value">-45°</output><input id="golf-angle" type="range" min="-180" max="180" value="-45" style="width:100%"></label><label>強さ <output id="golf-power-value">60%</output><input id="golf-power" type="range" min="10" max="100" value="60" style="width:100%"></label><button class="btn btn-success" id="golf-shot">⛳ ショット</button><button class="btn btn-warn" id="golf-next" style="display:none">次のホールへ →</button></div>`;
  const q=id=>el.querySelector('#'+id),canvas=q('golf-course'),ctx=canvas.getContext('2d');
  const moving=()=>ball.vx!==0||ball.vy!==0;
  function status(message=''){const text=`ホール ${index+1}/3 ・ PAR ${MINI_GOLF_HOLES[index].par} ・ ${strokes}打（合計 ${total+strokes}打）${message?' ・ '+message:''}`;if(q('golf-status').textContent!==text)q('golf-status').textContent=text;q('golf-shot').disabled=moving()||ball.sunk||ended;}
  function start(){const h=MINI_GOLF_HOLES[index];ball={x:h.start[0],y:h.start[1],vx:0,vy:0,sunk:false};strokes=0;scored=false;drag=null;q('golf-next').style.display='none';status('カップを目指そう！');}
  function shoot(vx,vy){if(ended||moving()||ball.sunk)return;const speed=Math.hypot(vx,vy);if(speed<8)return;const scale=Math.min(1,420/speed);ball.vx=vx*scale;ball.vy=vy*scale;strokes++;status();}
  function coordinates(e){const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*360/r.width,y:(e.clientY-r.top)*400/r.height};}
  canvas.onpointerdown=e=>{if(ended||moving()||ball.sunk||drag||e.button!==0)return;const p=coordinates(e);if(Math.hypot(p.x-ball.x,p.y-ball.y)>30)return;e.preventDefault();drag={...p,id:e.pointerId};canvas.setPointerCapture(e.pointerId);};
  canvas.onpointermove=e=>{if(drag&&drag.id===e.pointerId)drag={...coordinates(e),id:e.pointerId};};
  canvas.onpointerup=e=>{if(!drag||drag.id!==e.pointerId)return;const p=coordinates(e);drag=null;shoot((ball.x-p.x)*3,(ball.y-p.y)*3);};
  canvas.onpointercancel=()=>{drag=null;};canvas.onlostpointercapture=()=>{drag=null;};
  q('golf-angle').oninput=()=>{q('golf-angle-value').textContent=q('golf-angle').value+'°';};
  q('golf-power').oninput=()=>{q('golf-power-value').textContent=q('golf-power').value+'%';};
  q('golf-shot').onclick=()=>{const angle=Number(q('golf-angle').value)*Math.PI/180,power=Number(q('golf-power').value)*4.2;shoot(Math.cos(angle)*power,Math.sin(angle)*power);};
  q('golf-next').onclick=()=>{if(!ball.sunk||ended||index>=2)return;total+=strokes;index++;start();};
  // Keyboard aiming moves the same sliders, so the guide line and labels stay in sync.
  function nudge(id,delta){const input=q(id),min=Number(input.min),max=Number(input.max);let v=Number(input.value)+delta;if(id==='golf-angle'){if(v>max)v-=360;if(v<min)v+=360;}input.value=Math.max(min,Math.min(max,v));input.oninput();}
  onGameKey((key,e)=>{
    if(e.target instanceof HTMLInputElement&&e.target.type==='range'&&key.startsWith('Arrow'))return false;
    const step=e.shiftKey?1:5;
    if(key==='ArrowLeft'){nudge('golf-angle',-step);return true;}
    if(key==='ArrowRight'){nudge('golf-angle',step);return true;}
    if(key==='ArrowUp'){nudge('golf-power',step);return true;}
    if(key==='ArrowDown'){nudge('golf-power',-step);return true;}
    if(key===' '||key==='Enter'){if(!e.repeat)q('golf-shot').click();return true;}
    if(key==='n'){q('golf-next').click();return true;}
    return false;
  });
  // Plain fills only (no gradients/measureText): the Node test draws with a stub canvas.
  function draw(){
    const h=MINI_GOLF_HOLES[index];
    ctx.fillStyle='#2f8f4e';ctx.fillRect(0,0,360,400);
    ctx.fillStyle='#37a05a';for(let x=-400;x<360;x+=48){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+24,0);ctx.lineTo(x+424,400);ctx.lineTo(x+400,400);ctx.closePath();ctx.fill();}
    ctx.fillStyle='rgba(255,255,255,.05)';for(let i=0;i<40;i++){ctx.fillRect((i*83)%360,(i*137)%400,2,2);}
    // walls: wooden rails with a light top edge and a drop shadow
    for(const w of h.walls){ctx.fillStyle='rgba(0,0,0,.22)';ctx.fillRect(w.x+3,w.y+4,w.w,w.h);ctx.fillStyle='#b9824f';ctx.fillRect(w.x,w.y,w.w,w.h);ctx.fillStyle='#e0b47c';ctx.fillRect(w.x,w.y,w.w,Math.min(4,w.h));ctx.fillStyle='#8a5a32';ctx.fillRect(w.x,w.y+w.h-2,w.w,2);}
    // cup with green ring and waving flag
    const [cx,cy]=h.cup;ctx.fillStyle='#4fc27a';ctx.beginPath();ctx.arc(cx,cy,19,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#0b2416';ctx.beginPath();ctx.arc(cx,cy,12,0,Math.PI*2);ctx.fill();ctx.fillStyle='#1d3d29';ctx.beginPath();ctx.arc(cx,cy+3,9,0,Math.PI);ctx.fill();
    ctx.strokeStyle='#f5f5f5';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx,cy-40);ctx.stroke();
    const wave=Math.sin(last/260)*3;ctx.fillStyle='#ff4d5e';ctx.beginPath();ctx.moveTo(cx+1,cy-40);ctx.quadraticCurveTo(cx+12,cy-38+wave,cx+24,cy-34);ctx.quadraticCurveTo(cx+12,cy-30+wave,cx+1,cy-28);ctx.closePath();ctx.fill();
    if(!ball.sunk){
      if(!moving()){
        const angle=Number(q('golf-angle').value)*Math.PI/180;let dx=drag?(ball.x-drag.x):Math.cos(angle)*Number(q('golf-power').value),dy=drag?(ball.y-drag.y):Math.sin(angle)*Number(q('golf-power').value);
        const len=Math.min(100,Math.hypot(dx,dy)),ux=dx/Math.max(1,Math.hypot(dx,dy)),uy=dy/Math.max(1,Math.hypot(dx,dy)),power=len/100;
        ctx.strokeStyle=power>.75?'#ff6b6b':power>.45?'#ffd24d':'#ffffff';ctx.lineWidth=3;ctx.setLineDash([6,6]);ctx.beginPath();ctx.moveTo(ball.x,ball.y);ctx.lineTo(ball.x+ux*len,ball.y+uy*len);ctx.stroke();ctx.setLineDash([]);
        const tx=ball.x+ux*len,ty=ball.y+uy*len;ctx.fillStyle=ctx.strokeStyle;ctx.beginPath();ctx.moveTo(tx+ux*9,ty+uy*9);ctx.lineTo(tx-uy*6,ty+ux*6);ctx.lineTo(tx+uy*6,ty-ux*6);ctx.closePath();ctx.fill();
      }
      ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(ball.x+2,ball.y+4,7,4,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(ball.x,ball.y,7,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='rgba(0,0,0,.12)';ctx.beginPath();ctx.arc(ball.x+2,ball.y+2,4,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(ball.x-2,ball.y-2,2.5,0,Math.PI*2);ctx.fill();
    }
  }
  function frame(now){if(ended)return;accumulator+=last?Math.min((now-last)/1000,.05):0;last=now;while(accumulator>=1/120){miniGolfStep(ball,MINI_GOLF_HOLES[index]);accumulator-=1/120;}
    if(ball.sunk&&!scored){scored=true;status('カップイン！');if(index===2){ended=true;draw();recordWin('minigolf',Math.max(50,300-(total+strokes)*12));return;}q('golf-next').style.display='';}
    else if(!ball.sunk)status(moving()?'ボールが止まるまで待ってね':'ショットできます');
    draw();raf=requestAnimationFrame(frame);
  }
  el._quit=()=>{if(ended)return;ended=true;drag=null;draw();recordQuit('minigolf',(index+(scored?1:0))*50);};
  start();raf=requestAnimationFrame(frame);el._cleanup=()=>{ended=true;drag=null;cancelAnimationFrame(raf);};
};
